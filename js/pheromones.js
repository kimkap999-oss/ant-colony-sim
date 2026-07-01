/**
 * Pheromone System
 * Grid-based pheromone diffusion and evaporation
 */

export const PheromoneType = {
    HOME: 'home', // Trail to nest
    FOOD: 'food', // Trail to food
    DANGER: 'danger', // Avoid this area
    EXPLORE: 'explore', // Recently explored
};

export const PheromoneColors = {
    [PheromoneType.HOME]: { r: 100, g: 255, b: 218 }, // Cyan
    [PheromoneType.FOOD]: { r: 124, g: 181, b: 24 }, // Green
    [PheromoneType.DANGER]: { r: 239, g: 68, b: 68 }, // Red
    [PheromoneType.EXPLORE]: { r: 139, g: 92, b: 246 }, // Purple
};

export class PheromoneGrid {
    constructor(width, height, cellSize = 8) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);

        // Create grids for each pheromone type
        this.grids = new Map();
        for (const type of Object.values(PheromoneType)) {
            this.grids.set(type, new Float32Array(this.cols * this.rows));
        }

        // Configuration
        this.evaporationRate = 0.995; // Per frame multiplier
        this.diffusionRate = 0.1;
        this.maxStrength = 255;
    }

    _index(col, row) {
        return row * this.cols + col;
    }

    _toGrid(x, y) {
        return {
            col: Math.floor(x / this.cellSize),
            row: Math.floor(y / this.cellSize),
        };
    }

    deposit(type, x, y, strength = 50) {
        const { col, row } = this._toGrid(x, y);
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;

        const grid = this.grids.get(type);
        const idx = this._index(col, row);
        grid[idx] = Math.min(grid[idx] + strength, this.maxStrength);
    }

    sample(type, x, y) {
        const { col, row } = this._toGrid(x, y);
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return 0;

        const grid = this.grids.get(type);
        return grid[this._index(col, row)];
    }

    // Sample in a direction, returns gradient strength
    sampleDirection(type, x, y, angle, distance = 20) {
        const tx = x + Math.cos(angle) * distance;
        const ty = y + Math.sin(angle) * distance;
        return this.sample(type, tx, ty);
    }

    // Find strongest pheromone direction
    findGradient(type, x, y, sampleAngles = 8) {
        let bestAngle = null;
        let bestStrength = 0;

        for (let i = 0; i < sampleAngles; i++) {
            const angle = (i / sampleAngles) * Math.PI * 2;
            const strength = this.sampleDirection(type, x, y, angle, 15);

            if (strength > bestStrength) {
                bestStrength = strength;
                bestAngle = angle;
            }
        }

        return { angle: bestAngle, strength: bestStrength };
    }

    update() {
        // Evaporation
        for (const grid of this.grids.values()) {
            for (let i = 0; i < grid.length; i++) {
                grid[i] *= this.evaporationRate;
                if (grid[i] < 0.5) grid[i] = 0;
            }
        }

        // Simple diffusion (blur)
        for (const [type, grid] of this.grids) {
            const newGrid = new Float32Array(grid.length);

            for (let row = 1; row < this.rows - 1; row++) {
                for (let col = 1; col < this.cols - 1; col++) {
                    const idx = this._index(col, row);
                    const neighbors =
                        grid[this._index(col - 1, row)] +
                        grid[this._index(col + 1, row)] +
                        grid[this._index(col, row - 1)] +
                        grid[this._index(col, row + 1)];

                    newGrid[idx] =
                        grid[idx] * (1 - this.diffusionRate) + (neighbors / 4) * this.diffusionRate;
                }
            }

            this.grids.set(type, newGrid);
        }
    }

    // Get data for rendering
    getRenderData(type) {
        return {
            grid: this.grids.get(type),
            cols: this.cols,
            rows: this.rows,
            cellSize: this.cellSize,
            color: PheromoneColors[type],
        };
    }

    clear(type = null) {
        if (type) {
            this.grids.get(type).fill(0);
        } else {
            for (const grid of this.grids.values()) {
                grid.fill(0);
            }
        }
    }
}

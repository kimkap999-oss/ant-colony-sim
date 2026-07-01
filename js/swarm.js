/**
 * Spatial Hash Grid for O(1) neighbor lookups
 * Core of the swarm performance system
 */
export class SpatialHash {
    constructor(cellSize = 20) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    _hash(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }

    insert(entity) {
        const key = this._hash(entity.x, entity.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, new Set());
        }
        this.grid.get(key).add(entity);
        entity._spatialKey = key;
    }

    remove(entity) {
        if (entity._spatialKey && this.grid.has(entity._spatialKey)) {
            this.grid.get(entity._spatialKey).delete(entity);
        }
    }

    update(entity) {
        const newKey = this._hash(entity.x, entity.y);
        if (newKey !== entity._spatialKey) {
            this.remove(entity);
            this.insert(entity);
        }
    }

    query(x, y, radius) {
        const results = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        const radiusSq = radius * radius;

        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                const key = `${cx + dx},${cy + dy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    for (const entity of cell) {
                        const entityDx = entity.x - x;
                        const entityDy = entity.y - y;
                        if (entityDx * entityDx + entityDy * entityDy <= radiusSq) {
                            results.push(entity);
                        }
                    }
                }
            }
        }
        return results;
    }

    clear() {
        this.grid.clear();
    }
}

/**
 * Object Pool for efficient memory management
 */
export class ObjectPool {
    constructor(factory, initialSize = 100) {
        this.factory = factory;
        this.pool = [];
        this.active = new Set();

        for (let i = 0; i < initialSize; i++) {
            this.pool.push(factory());
        }
    }

    acquire() {
        let obj = this.pool.pop();
        if (!obj) {
            obj = this.factory();
        }
        this.active.add(obj);
        return obj;
    }

    release(obj) {
        if (this.active.has(obj)) {
            this.active.delete(obj);
            if (obj.reset) obj.reset();
            this.pool.push(obj);
        }
    }

    get activeCount() {
        return this.active.size;
    }
}

/**
 * Swarm Coordinator
 * Manages collective behavior and global pheromone influence
 */
export class SwarmCoordinator {
    constructor(spatialHash) {
        this.spatialHash = spatialHash;
        this.globalSignals = new Map();
    }

    // Calculate local density for crowding avoidance
    getLocalDensity(x, y, radius = 30) {
        return this.spatialHash.query(x, y, radius).length;
    }

    // Get average heading of nearby ants for alignment
    getLocalAlignment(x, y, radius = 40) {
        const neighbors = this.spatialHash.query(x, y, radius);
        if (neighbors.length === 0) return null;

        let sumX = 0,
            sumY = 0;
        for (const ant of neighbors) {
            sumX += Math.cos(ant.heading);
            sumY += Math.sin(ant.heading);
        }
        return Math.atan2(sumY / neighbors.length, sumX / neighbors.length);
    }

    // Emit a global signal (e.g., danger, food found)
    emitSignal(type, x, y, strength = 1.0) {
        const signal = { type, x, y, strength, time: Date.now() };
        if (!this.globalSignals.has(type)) {
            this.globalSignals.set(type, []);
        }
        this.globalSignals.get(type).push(signal);
    }

    // Get nearby signals
    getSignals(type, x, y, radius = 100) {
        const signals = this.globalSignals.get(type) || [];
        const radiusSq = radius * radius;
        return signals.filter((s) => {
            const dx = s.x - x;
            const dy = s.y - y;
            return dx * dx + dy * dy <= radiusSq && Date.now() - s.time < 10000;
        });
    }

    // Clean up old signals
    cleanupSignals() {
        const now = Date.now();
        for (const [type, signals] of this.globalSignals) {
            this.globalSignals.set(
                type,
                signals.filter((s) => now - s.time < 10000)
            );
        }
    }
}

import { PheromoneGrid, PheromoneType } from './pheromones.js';

describe('PheromoneGrid', () => {
    let grid;

    beforeEach(() => {
        // Create a 100x100 grid with cellSize 10
        // This gives us a 10x10 grid of cells
        grid = new PheromoneGrid(100, 100, 10);
    });

    describe('deposit and sample boundaries', () => {
        test('should deposit and sample successfully within boundaries', () => {
            // Valid coordinates (x=15, y=15 -> col=1, row=1)
            grid.deposit(PheromoneType.FOOD, 15, 15, 50);

            expect(grid.sample(PheromoneType.FOOD, 15, 15)).toBe(50);
        });

        test('should ignore deposit and return 0 for sample with negative coordinates', () => {
            // x < 0
            grid.deposit(PheromoneType.FOOD, -5, 15, 50);
            expect(grid.sample(PheromoneType.FOOD, -5, 15)).toBe(0);

            // y < 0
            grid.deposit(PheromoneType.FOOD, 15, -5, 50);
            expect(grid.sample(PheromoneType.FOOD, 15, -5)).toBe(0);

            // x < 0 and y < 0
            grid.deposit(PheromoneType.FOOD, -5, -5, 50);
            expect(grid.sample(PheromoneType.FOOD, -5, -5)).toBe(0);
        });

        test('should ignore deposit and return 0 for sample with coordinates exceeding dimensions', () => {
            // x >= width
            grid.deposit(PheromoneType.FOOD, 105, 15, 50);
            expect(grid.sample(PheromoneType.FOOD, 105, 15)).toBe(0);

            // y >= height
            grid.deposit(PheromoneType.FOOD, 15, 105, 50);
            expect(grid.sample(PheromoneType.FOOD, 15, 105)).toBe(0);

            // x >= width and y >= height
            grid.deposit(PheromoneType.FOOD, 105, 105, 50);
            expect(grid.sample(PheromoneType.FOOD, 105, 105)).toBe(0);
        });

        test('should respect exact boundary edge cases', () => {
            // cell index 9, 9 -> x=90 to 99, y=90 to 99

            // x = 100 is just outside (col = 10 >= cols=10)
            grid.deposit(PheromoneType.FOOD, 100, 99, 50);
            expect(grid.sample(PheromoneType.FOOD, 100, 99)).toBe(0);

            // y = 100 is just outside
            grid.deposit(PheromoneType.FOOD, 99, 100, 50);
            expect(grid.sample(PheromoneType.FOOD, 99, 100)).toBe(0);

            // x = 99, y = 99 is just inside
            grid.deposit(PheromoneType.FOOD, 99, 99, 50);
            expect(grid.sample(PheromoneType.FOOD, 99, 99)).toBe(50);
        });
    });
});

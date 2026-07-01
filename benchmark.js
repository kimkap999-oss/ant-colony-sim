import { PheromoneGrid, PheromoneType } from './js/pheromones.js';
import { performance } from 'perf_hooks';

const grid = new PheromoneGrid(800, 600, 8);
// warm up
for (let i = 0; i < 100; i++) {
    grid.deposit(PheromoneType.FOOD, 400, 300, 200);
    grid.update();
}

const start = performance.now();
for (let i = 0; i < 1000; i++) {
    grid.deposit(PheromoneType.FOOD, 400, 300, 200);
    grid.update();
}
const end = performance.now();
console.log(`Time taken: ${(end - start).toFixed(2)} ms`);

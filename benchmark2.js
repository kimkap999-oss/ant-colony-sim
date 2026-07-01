import { PheromoneGrid, PheromoneType } from './js/pheromones.js';
import { performance } from 'perf_hooks';

const grid = new PheromoneGrid(800, 600, 8);
const size = grid.cols * grid.rows;

const startAlloc = performance.now();
for (let i = 0; i < 4000; i++) {
    const a = new Float32Array(size);
}
const endAlloc = performance.now();
console.log(`Alloc time: ${(endAlloc - startAlloc).toFixed(2)} ms`);

const buffer = new Float32Array(size);
const startFill = performance.now();
for (let i = 0; i < 4000; i++) {
    buffer.fill(0);
}
const endFill = performance.now();
console.log(`Fill time: ${(endFill - startFill).toFixed(2)} ms`);

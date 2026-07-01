import { ResourceSpawner, ResourceType } from './js/resources.js';
import { performance } from 'perf_hooks';

const spawner = new ResourceSpawner(1000, 1000);
spawner.spawnInitialResources(10000);

const searches = 10000;
let totalResult = 0;

const startFood = performance.now();
for (let i = 0; i < searches; i++) {
    const res = spawner.findNearestFood(Math.random() * 1000, Math.random() * 1000, 500);
    if (res) totalResult++;
}
const endFood = performance.now();

const startAny = performance.now();
for (let i = 0; i < searches; i++) {
    const res = spawner.findNearest(Math.random() * 1000, Math.random() * 1000, ResourceType.SEED, 500);
    if (res) totalResult++;
}
const endAny = performance.now();

console.log(`Baseline - findNearestFood: ${(endFood - startFood).toFixed(2)}ms`);
console.log(`Baseline - findNearest: ${(endAny - startAny).toFixed(2)}ms`);
console.log(`Total found: ${totalResult} (prevents optimization)`);

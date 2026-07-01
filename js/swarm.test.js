import { SpatialHash } from './swarm.js';

describe('SpatialHash', () => {
    let spatialHash;

    beforeEach(() => {
        spatialHash = new SpatialHash(25);
    });

    test('should insert and retrieve objects correctly', () => {
        const obj1 = { id: 1, x: 10, y: 10 };
        const obj2 = { id: 2, x: 15, y: 15 };
        const obj3 = { id: 3, x: 50, y: 50 };

        spatialHash.insert(obj1);
        spatialHash.insert(obj2);
        spatialHash.insert(obj3);

        const neighbors = spatialHash.query(12, 12, 10);

        // Convert to array if it's a Set, or handle accordingly
        const neighborList = Array.isArray(neighbors) ? neighbors : Array.from(neighbors);

        expect(neighborList).toContain(obj1);
        expect(neighborList).toContain(obj2);
        expect(neighborList).not.toContain(obj3);
    });

    test('should clear objects correctly', () => {
        const obj = { id: 1, x: 10, y: 10 };
        spatialHash.insert(obj);

        spatialHash.clear();

        const neighbors = spatialHash.query(10, 10, 10);
        const neighborList = Array.isArray(neighbors) ? neighbors : Array.from(neighbors);

        expect(neighborList.length).toBe(0);
    });
});

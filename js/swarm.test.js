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

    describe('remove()', () => {
        test('should remove an existing entity', () => {
            const obj = { id: 1, x: 10, y: 10 };
            spatialHash.insert(obj);
            spatialHash.remove(obj);

            const neighbors = spatialHash.query(10, 10, 10);
            expect(neighbors.length).toBe(0);
        });

        test('should not throw when removing an uninserted entity', () => {
            const obj = { id: 1, x: 10, y: 10 };
            expect(() => spatialHash.remove(obj)).not.toThrow();
        });
    });

    describe('update()', () => {
        test('should update when entity moves to a different cell', () => {
            const obj = { id: 1, x: 10, y: 10 };
            spatialHash.insert(obj);

            // Move obj to a cell far away (cellSize is 25, so x:100, y:100 is in cell 4,4)
            obj.x = 100;
            obj.y = 100;
            spatialHash.update(obj);

            const oldCellNeighbors = spatialHash.query(10, 10, 10);
            const newCellNeighbors = spatialHash.query(100, 100, 10);

            expect(oldCellNeighbors).not.toContain(obj);
            expect(newCellNeighbors).toContain(obj);
        });

        test('should keep entity in the same cell if it does not cross boundaries', () => {
            const obj = { id: 1, x: 10, y: 10 };
            spatialHash.insert(obj);

            // Move obj within the same cell (cellSize is 25)
            obj.x = 15;
            obj.y = 15;
            spatialHash.update(obj);

            const neighbors = spatialHash.query(15, 15, 10);
            expect(neighbors).toContain(obj);
        });
    });

    describe('query()', () => {
        test('should return empty array for an empty grid', () => {
            const neighbors = spatialHash.query(10, 10, 10);
            expect(neighbors).toEqual([]);
        });

        test('should respect radius boundary limits', () => {
            const centerObj = { id: 1, x: 50, y: 50 };
            const insideObj = { id: 2, x: 55, y: 50 }; // distance 5
            const exactBoundaryObj = { id: 3, x: 60, y: 50 }; // distance 10
            const outsideObj = { id: 4, x: 61, y: 50 }; // distance 11

            spatialHash.insert(centerObj);
            spatialHash.insert(insideObj);
            spatialHash.insert(exactBoundaryObj);
            spatialHash.insert(outsideObj);

            const neighbors = spatialHash.query(50, 50, 10);

            expect(neighbors).toContain(centerObj);
            expect(neighbors).toContain(insideObj);
            expect(neighbors).toContain(exactBoundaryObj);
            expect(neighbors).not.toContain(outsideObj);
        });

        test('should find entities when radius spans multiple cells', () => {
            const obj1 = { id: 1, x: 0, y: 0 };
            const obj2 = { id: 2, x: 100, y: 100 }; // In cell 4,4 (cellSize = 25)

            spatialHash.insert(obj1);
            spatialHash.insert(obj2);

            // Query from 50,50 with radius large enough to cover both (distance is ~70.7)
            const neighbors = spatialHash.query(50, 50, 80);

            expect(neighbors).toContain(obj1);
            expect(neighbors).toContain(obj2);
        });
    });
});

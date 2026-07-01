import { SpatialHash, ObjectPool } from './swarm.js';

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

describe('ObjectPool', () => {
    let factory;
    let pool;

    beforeEach(() => {
        factory = jest.fn(() => ({ x: 0, y: 0, reset: jest.fn() }));
        pool = new ObjectPool(factory, 2);
    });

    test('should initialize with correct size', () => {
        expect(pool.pool.length).toBe(2);
        expect(factory).toHaveBeenCalledTimes(2);
        expect(pool.active.size).toBe(0);
    });

    test('should acquire object from pool', () => {
        const obj = pool.acquire();
        expect(obj).toBeDefined();
        expect(pool.pool.length).toBe(1);
        expect(pool.active.size).toBe(1);
        expect(pool.active.has(obj)).toBe(true);
        expect(factory).toHaveBeenCalledTimes(2); // No new objects created
    });

    test('should acquire new object when pool is empty', () => {
        pool.acquire();
        pool.acquire();
        // Pool is now empty
        expect(pool.pool.length).toBe(0);

        const obj = pool.acquire();
        expect(obj).toBeDefined();
        expect(pool.pool.length).toBe(0);
        expect(pool.active.size).toBe(3);
        expect(factory).toHaveBeenCalledTimes(3); // New object created
    });

    test('should release object back to pool', () => {
        const obj = pool.acquire();
        expect(pool.pool.length).toBe(1);

        pool.release(obj);
        expect(pool.pool.length).toBe(2);
        expect(pool.active.size).toBe(0);
        expect(pool.active.has(obj)).toBe(false);
        expect(obj.reset).toHaveBeenCalledTimes(1);
    });

    test('should ignore releasing unacquired object', () => {
        const obj = { x: 0, y: 0 };
        pool.release(obj);
        expect(pool.pool.length).toBe(2);
        expect(pool.active.size).toBe(0);
    });

    test('should get active count correctly', () => {
        expect(pool.activeCount).toBe(0);
        const obj = pool.acquire();
        expect(pool.activeCount).toBe(1);
        pool.release(obj);
        expect(pool.activeCount).toBe(0);
    });
});

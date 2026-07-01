import { StorageManager, ResourceType } from './resources.js';

describe('StorageManager', () => {
    let storage;

    beforeEach(() => {
        storage = new StorageManager(100);
    });

    describe('deposit', () => {
        test('should deposit successfully into empty storage', () => {
            const deposited = storage.deposit(ResourceType.SEED, 50, 1.0);
            expect(deposited).toBe(50);
            expect(storage.getStored(ResourceType.SEED)).toBe(50);
            expect(storage.getTotalStored()).toBe(50);
        });

        test('should average quality correctly', () => {
            storage.deposit(ResourceType.SEED, 10, 1.0);
            storage.deposit(ResourceType.SEED, 10, 0.5);

            const store = storage.stores.get(ResourceType.SEED);
            expect(store.quantity).toBe(20);
            expect(store.quality).toBe(0.75);
        });

        test('should partially deposit when approaching capacity', () => {
            storage.deposit(ResourceType.SEED, 80, 1.0);

            const deposited = storage.deposit(ResourceType.FUNGUS, 50, 1.0);

            expect(deposited).toBe(20);
            expect(storage.getStored(ResourceType.FUNGUS)).toBe(20);
            expect(storage.getTotalStored()).toBe(100);
        });

        test('should return 0 and not exceed capacity when storage is full', () => {
            // Fill the storage to capacity
            storage.deposit(ResourceType.SEED, 100, 1.0);

            expect(storage.getTotalStored()).toBe(100);

            // Try to deposit more
            const deposited = storage.deposit(ResourceType.SEED, 50, 1.0);

            expect(deposited).toBe(0);
            expect(storage.getStored(ResourceType.SEED)).toBe(100);
            expect(storage.getTotalStored()).toBe(100);
        });

        test('should return 0 for unknown resource type', () => {
            const deposited = storage.deposit('unknown', 50, 1.0);
            expect(deposited).toBe(0);
            expect(storage.getTotalStored()).toBe(0);
        });
    });
});

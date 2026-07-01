import { StorageManager, ResourceType, ResourceDefs } from './resources.js';

describe('StorageManager.applyDecay', () => {
    let manager;

    beforeEach(() => {
        manager = new StorageManager(1000);
    });

    test('should slightly degrade quality for resources with decayRate > 0', () => {
        manager.deposit(ResourceType.SEED, 100, 1.0);
        // seed decayRate is 0.001
        manager.applyDecay(100);

        const stats = manager.getStats();
        // 1.0 - (0.001 * 100 * 0.5) = 1.0 - 0.05 = 0.95
        // getStats returns Math.round(quality * 100) -> 95
        expect(stats[ResourceType.SEED].quantity).toBe(100);
        expect(stats[ResourceType.SEED].quality).toBe(95);
    });

    test('should reduce quantity and reset quality when quality drops below 0.1', () => {
        manager.deposit(ResourceType.INSECT, 100, 0.15);
        // insect decayRate is 0.02
        manager.applyDecay(100);
        // decay amount: 0.02 * 100 * 0.5 = 1.0
        // new quality = 0.15 - 1.0 = -0.85 (which is <= 0.1)

        const stats = manager.getStats();
        // quantity should be Math.floor(100 * 0.9) = 90
        // quality should be reset to 0.5, so Math.round(0.5 * 100) = 50
        expect(stats[ResourceType.INSECT].quantity).toBe(90);
        expect(stats[ResourceType.INSECT].quality).toBe(50);
    });

    test('should not degrade quality for resources with decayRate = 0', () => {
        manager.deposit(ResourceType.SOIL, 100, 1.0);
        // soil decayRate is 0
        manager.applyDecay(100);

        const stats = manager.getStats();
        expect(stats[ResourceType.SOIL].quantity).toBe(100);
        expect(stats[ResourceType.SOIL].quality).toBe(100);
    });
});

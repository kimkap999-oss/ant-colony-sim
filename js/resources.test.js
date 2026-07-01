import { ResourceSpawner, ResourceCategory } from './resources.js';

describe('ResourceSpawner', () => {
    let resourceSpawner;

    beforeEach(() => {
        resourceSpawner = new ResourceSpawner(800, 600);
    });

    describe('findNearestFood', () => {
        test('should return null if no resources are available', () => {
            const nearestFood = resourceSpawner.findNearestFood(100, 100);
            expect(nearestFood).toBeNull();
        });

        test('should return null if only non-food resources are available', () => {
            resourceSpawner.resources.push({
                x: 100,
                y: 100,
                category: ResourceCategory.MATERIAL,
                claimed: false,
            });

            const nearestFood = resourceSpawner.findNearestFood(100, 100);
            expect(nearestFood).toBeNull();
        });

        test('should return null if food resources are available but all are claimed', () => {
            resourceSpawner.resources.push({
                x: 100,
                y: 100,
                category: ResourceCategory.FOOD,
                claimed: true,
            });

            const nearestFood = resourceSpawner.findNearestFood(100, 100);
            expect(nearestFood).toBeNull();
        });

        test('should return null if food resources are outside of maxDist', () => {
            resourceSpawner.resources.push({
                x: 400,
                y: 400,
                category: ResourceCategory.FOOD,
                claimed: false,
            });

            const nearestFood = resourceSpawner.findNearestFood(100, 100, 200); // dist is approx 424
            expect(nearestFood).toBeNull();
        });

        test('should return the nearest food resource when multiple are available', () => {
            const furtherFood = {
                x: 200,
                y: 200,
                category: ResourceCategory.FOOD,
                claimed: false,
            };
            const nearerFood = {
                x: 150,
                y: 150,
                category: ResourceCategory.FOOD,
                claimed: false,
            };

            resourceSpawner.resources.push(furtherFood);
            resourceSpawner.resources.push(nearerFood);

            const nearestFood = resourceSpawner.findNearestFood(100, 100, 200);
            expect(nearestFood).toBe(nearerFood);
        });

        test('should ignore claimed food and return the nearest unclaimed food', () => {
            const claimedNearerFood = {
                x: 150,
                y: 150,
                category: ResourceCategory.FOOD,
                claimed: true,
            };
            const unclaimedFurtherFood = {
                x: 200,
                y: 200,
                category: ResourceCategory.FOOD,
                claimed: false,
            };

            resourceSpawner.resources.push(claimedNearerFood);
            resourceSpawner.resources.push(unclaimedFurtherFood);

            const nearestFood = resourceSpawner.findNearestFood(100, 100, 200);
            expect(nearestFood).toBe(unclaimedFurtherFood);
        });
    });
});

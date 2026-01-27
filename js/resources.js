/**
 * Resource Management System
 * Handles all colony resources with decay, nutrition, and storage
 */

export const ResourceType = {
    SEED: 'seed',
    FUNGUS: 'fungus',
    HONEYDEW: 'honeydew',
    INSECT: 'insect',
    SOIL: 'soil',
    LEAF: 'leaf',
    PEBBLE: 'pebble'
};

export const ResourceCategory = {
    FOOD: 'food',
    MATERIAL: 'material'
};

// Resource definitions with properties
export const ResourceDefs = {
    [ResourceType.SEED]: {
        category: ResourceCategory.FOOD,
        nutrition: 10,
        decayRate: 0.001,
        weight: 1,
        color: '#c4a35a',
        icon: '🌰'
    },
    [ResourceType.FUNGUS]: {
        category: ResourceCategory.FOOD,
        nutrition: 25,
        decayRate: 0.005,
        weight: 0.5,
        color: '#8b5cf6',
        icon: '🍄'
    },
    [ResourceType.HONEYDEW]: {
        category: ResourceCategory.FOOD,
        nutrition: 15,
        decayRate: 0.01,
        weight: 0.3,
        color: '#fbbf24',
        icon: '🍯'
    },
    [ResourceType.INSECT]: {
        category: ResourceCategory.FOOD,
        nutrition: 40,
        decayRate: 0.02,
        weight: 2,
        color: '#ef4444',
        icon: '🦗'
    },
    [ResourceType.SOIL]: {
        category: ResourceCategory.MATERIAL,
        strength: 5,
        decayRate: 0,
        weight: 1.5,
        color: '#78350f',
        icon: '🟤'
    },
    [ResourceType.LEAF]: {
        category: ResourceCategory.MATERIAL,
        strength: 2,
        decayRate: 0.002,
        weight: 0.2,
        color: '#22c55e',
        icon: '🍂'
    },
    [ResourceType.PEBBLE]: {
        category: ResourceCategory.MATERIAL,
        strength: 15,
        decayRate: 0,
        weight: 3,
        color: '#6b7280',
        icon: '🪨'
    }
};

/**
 * Individual resource instance in the world
 */
export class Resource {
    constructor(type, x, y, quantity = 1) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.quantity = quantity;
        this.quality = 1.0; // Degrades over time
        this.claimed = false;
        this.claimedBy = null;
        
        const def = ResourceDefs[type];
        this.category = def.category;
        this.nutrition = def.nutrition || 0;
        this.strength = def.strength || 0;
        this.decayRate = def.decayRate;
        this.weight = def.weight;
        this.color = def.color;
    }

    update(deltaTime) {
        // Apply decay
        if (this.decayRate > 0) {
            this.quality -= this.decayRate * deltaTime;
            if (this.quality <= 0) {
                this.quantity = 0;
            }
        }
    }

    harvest(amount = 1) {
        const taken = Math.min(amount, this.quantity);
        this.quantity -= taken;
        return taken;
    }

    get isEmpty() {
        return this.quantity <= 0;
    }

    get effectiveValue() {
        return (this.nutrition || this.strength) * this.quality * this.quantity;
    }
}

/**
 * Colony Storage Manager
 */
export class StorageManager {
    constructor(capacity = 1000) {
        this.capacity = capacity;
        this.stores = new Map();
        
        // Initialize stores for each resource type
        for (const type of Object.values(ResourceType)) {
            this.stores.set(type, {
                quantity: 0,
                quality: 1.0
            });
        }
    }

    deposit(type, quantity, quality = 1.0) {
        const store = this.stores.get(type);
        if (!store) return 0;

        const currentTotal = this.getTotalStored();
        const spaceLeft = this.capacity - currentTotal;
        const deposited = Math.min(quantity, spaceLeft);

        if (deposited > 0) {
            // Average quality based on amounts
            const totalQty = store.quantity + deposited;
            store.quality = (store.quality * store.quantity + quality * deposited) / totalQty;
            store.quantity = totalQty;
        }

        return deposited;
    }

    withdraw(type, quantity) {
        const store = this.stores.get(type);
        if (!store) return { quantity: 0, quality: 0 };

        const withdrawn = Math.min(quantity, store.quantity);
        store.quantity -= withdrawn;

        return { quantity: withdrawn, quality: store.quality };
    }

    getStored(type) {
        return this.stores.get(type)?.quantity || 0;
    }

    getTotalStored() {
        let total = 0;
        for (const store of this.stores.values()) {
            total += store.quantity;
        }
        return total;
    }

    getTotalFood() {
        let total = 0;
        for (const [type, store] of this.stores) {
            if (ResourceDefs[type].category === ResourceCategory.FOOD) {
                total += store.quantity;
            }
        }
        return total;
    }

    getTotalMaterials() {
        let total = 0;
        for (const [type, store] of this.stores) {
            if (ResourceDefs[type].category === ResourceCategory.MATERIAL) {
                total += store.quantity;
            }
        }
        return total;
    }

    // Apply daily decay to stored resources
    applyDecay(deltaTime) {
        for (const [type, store] of this.stores) {
            const def = ResourceDefs[type];
            if (def.decayRate > 0 && store.quantity > 0) {
                // Storage slows decay by 50%
                store.quality -= def.decayRate * deltaTime * 0.5;
                if (store.quality <= 0.1) {
                    // Spoiled food is discarded
                    store.quantity = Math.floor(store.quantity * 0.9);
                    store.quality = 0.5;
                }
            }
        }
    }

    getStats() {
        const stats = {};
        for (const [type, store] of this.stores) {
            stats[type] = {
                quantity: store.quantity,
                quality: Math.round(store.quality * 100)
            };
        }
        return stats;
    }
}

/**
 * Resource Spawner for the world
 */
export class ResourceSpawner {
    constructor(worldWidth, worldHeight) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.resources = [];
        this.spawnTimer = 0;
        this.spawnInterval = 5; // seconds
    }

    spawnInitialResources(count = 50) {
        for (let i = 0; i < count; i++) {
            this.spawnRandom();
        }
    }

    spawnRandom() {
        const types = [ResourceType.SEED, ResourceType.SEED, ResourceType.SEED,
                       ResourceType.FUNGUS, ResourceType.HONEYDEW, ResourceType.INSECT,
                       ResourceType.LEAF];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Spawn in the upper area (surface)
        const x = Math.random() * this.worldWidth;
        const y = Math.random() * (this.worldHeight * 0.3);
        const quantity = Math.floor(Math.random() * 5) + 1;

        const resource = new Resource(type, x, y, quantity);
        this.resources.push(resource);
        return resource;
    }

    update(deltaTime) {
        // Spawn new resources periodically
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval && this.resources.length < 100) {
            this.spawnRandom();
            this.spawnTimer = 0;
        }

        // Update existing resources and remove empty ones
        for (let i = this.resources.length - 1; i >= 0; i--) {
            this.resources[i].update(deltaTime);
            if (this.resources[i].isEmpty) {
                this.resources.splice(i, 1);
            }
        }
    }

    findNearest(x, y, type = null, maxDist = 200) {
        let nearest = null;
        let nearestDist = maxDist;

        for (const resource of this.resources) {
            if (resource.claimed) continue;
            if (type && resource.type !== type) continue;

            const dist = Math.hypot(resource.x - x, resource.y - y);
            if (dist < nearestDist) {
                nearest = resource;
                nearestDist = dist;
            }
        }

        return nearest;
    }

    findNearestFood(x, y, maxDist = 200) {
        let nearest = null;
        let nearestDist = maxDist;

        for (const resource of this.resources) {
            if (resource.claimed) continue;
            if (resource.category !== ResourceCategory.FOOD) continue;

            const dist = Math.hypot(resource.x - x, resource.y - y);
            if (dist < nearestDist) {
                nearest = resource;
                nearestDist = dist;
            }
        }

        return nearest;
    }
}

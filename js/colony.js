/**
 * Colony Manager
 * Handles nest state, population, and chambers
 */

import { Ant, AntRole } from './ant.js';
import { StorageManager } from './resources.js';
import { ObjectPool } from './swarm.js';

export const ChamberType = {
    ENTRANCE: 'entrance',
    FOOD_STORAGE: 'food_storage',
    NURSERY: 'nursery',
    QUEEN: 'queen',
    WASTE: 'waste',
    TUNNEL: 'tunnel',
};

export class Chamber {
    constructor(type, x, y, width, height) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.capacity = width * height;
        this.contents = [];
    }

    get center() {
        return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
    }
}

export class Colony {
    constructor(x, y, world) {
        this.nestX = x;
        this.nestY = y;
        this.world = world;

        // Population
        this.ants = [];
        this.antPool = new ObjectPool(() => new Ant(0, 0, this), 200);
        this.maxPopulation = 500;

        // Resources
        this.storage = new StorageManager(2000);

        // Structure
        this.chambers = [];
        this._initNest();

        // Stats
        this.larvae = 0;
        this.eggs = 0;
        this.day = 1;
        this.timeOfDay = 0; // 0-24 hours

        // Growth
        this.spawnTimer = 0;
        this.spawnRate = 2; // seconds between spawns
    }

    _initNest() {
        // Create initial chambers
        this.chambers.push(
            new Chamber(ChamberType.ENTRANCE, this.nestX - 15, this.nestY - 10, 30, 20)
        );

        this.chambers.push(
            new Chamber(ChamberType.QUEEN, this.nestX - 20, this.nestY + 50, 40, 30)
        );

        this.chambers.push(
            new Chamber(ChamberType.FOOD_STORAGE, this.nestX + 30, this.nestY + 30, 35, 25)
        );

        this.chambers.push(
            new Chamber(ChamberType.NURSERY, this.nestX - 50, this.nestY + 40, 30, 25)
        );
    }

    spawnAnt(role = AntRole.WORKER) {
        if (this.ants.length >= this.maxPopulation) return null;

        const ant = this.antPool.acquire();
        ant.x = this.nestX + (Math.random() - 0.5) * 20;
        ant.y = this.nestY + (Math.random() - 0.5) * 20;
        ant.heading = Math.random() * Math.PI * 2;
        ant.role = role;
        ant.colony = this;

        this.ants.push(ant);
        this.world.spatialHash.insert(ant);

        return ant;
    }

    removeAnt(ant) {
        const idx = this.ants.indexOf(ant);
        if (idx !== -1) {
            this.ants.splice(idx, 1);
            this.world.spatialHash.remove(ant);
            this.antPool.release(ant);
        }
    }

    update(deltaTime) {
        // Time progression
        this.timeOfDay += deltaTime * 0.1; // 10 real seconds = 1 game hour
        if (this.timeOfDay >= 24) {
            this.timeOfDay = 0;
            this.day++;
        }

        // Spawn new ants if food available
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnRate && this.storage.getTotalFood() > 10) {
            if (this.ants.length < this.maxPopulation) {
                this.spawnAnt();
                this.storage.withdraw('seed', 2);
            }
            this.spawnTimer = 0;
        }

        // Update all ants
        for (const ant of this.ants) {
            ant.update(deltaTime, this.world);
            this.world.spatialHash.update(ant);
        }

        // Resource decay
        this.storage.applyDecay(deltaTime);
    }

    getStats() {
        return {
            population: this.ants.length,
            food: Math.floor(this.storage.getTotalFood()),
            materials: Math.floor(this.storage.getTotalMaterials()),
            larvae: this.larvae,
            chambers: this.chambers.length,
            day: this.day,
            timeOfDay: this.timeOfDay,
        };
    }

    getTimeString() {
        const hour = Math.floor(this.timeOfDay);
        if (hour >= 6 && hour < 12) return '☀️ Morning';
        if (hour >= 12 && hour < 17) return '🌤️ Afternoon';
        if (hour >= 17 && hour < 20) return '🌅 Evening';
        return '🌙 Night';
    }
}

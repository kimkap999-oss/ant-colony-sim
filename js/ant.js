/**
 * Individual Ant Agent
 * Implements behavior using finite state machine
 */

import { PheromoneType } from './pheromones.js';
import { ResourceCategory } from './resources.js';

export const AntRole = {
    WORKER: 'worker',
    FORAGER: 'forager',
    NURSE: 'nurse',
    SOLDIER: 'soldier'
};

export const AntState = {
    IDLE: 'idle',
    EXPLORING: 'exploring',
    SEEKING_FOOD: 'seeking_food',
    RETURNING_HOME: 'returning_home',
    DEPOSITING: 'depositing',
    FOLLOWING_TRAIL: 'following_trail',
    DIGGING: 'digging',
    NURSING: 'nursing',
    FLEEING: 'fleeing'
};

export class Ant {
    constructor(x, y, colony) {
        this.x = x;
        this.y = y;
        this.colony = colony;
        
        // Movement
        this.heading = Math.random() * Math.PI * 2;
        this.speed = 30 + Math.random() * 20; // pixels per second
        this.turnRate = 3;
        
        // State
        this.role = AntRole.WORKER;
        this.state = AntState.EXPLORING;
        this.stateTimer = 0;
        
        // Carrying
        this.carrying = null;
        this.carryingAmount = 0;
        this.maxCarry = 3;
        
        // Energy
        this.energy = 100;
        this.maxEnergy = 100;
        this.hunger = 0;
        
        // Perception
        this.senseRadius = 40;
        this.homeDirection = 0;
        
        // Visual
        this.size = 4;
        this.legPhase = Math.random() * Math.PI * 2;
        
        // Memory
        this.lastFoodLocation = null;
        this.wanderAngle = 0;
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.heading = 0;
        this.state = AntState.IDLE;
        this.carrying = null;
        this.carryingAmount = 0;
        this.energy = 100;
    }

    update(deltaTime, world) {
        this.stateTimer += deltaTime;
        this.legPhase += deltaTime * 15;
        
        // Energy consumption
        this.energy -= deltaTime * 0.5;
        this.hunger += deltaTime * 0.3;
        
        // State machine
        switch (this.state) {
            case AntState.EXPLORING:
                this._explore(deltaTime, world);
                break;
            case AntState.SEEKING_FOOD:
                this._seekFood(deltaTime, world);
                break;
            case AntState.RETURNING_HOME:
                this._returnHome(deltaTime, world);
                break;
            case AntState.FOLLOWING_TRAIL:
                this._followTrail(deltaTime, world);
                break;
            case AntState.DIGGING:
                this._dig(deltaTime, world);
                break;
            default:
                this._wander(deltaTime);
        }

        // Deposit pheromones
        this._depositPheromones(world);
        
        // Boundary check
        this._boundaryCheck(world);
    }

    _explore(deltaTime, world) {
        // Random walk with bias
        this.wanderAngle += (Math.random() - 0.5) * 2;
        this.heading += this.wanderAngle * deltaTime;
        
        // Check for food pheromones
        const foodGradient = world.pheromones.findGradient(PheromoneType.FOOD, this.x, this.y);
        if (foodGradient.strength > 10) {
            this.state = AntState.FOLLOWING_TRAIL;
            this.heading = foodGradient.angle;
            return;
        }

        // Look for food directly
        const food = world.resources.findNearestFood(this.x, this.y, this.senseRadius);
        if (food) {
            this.state = AntState.SEEKING_FOOD;
            this._turnToward(food.x, food.y, deltaTime);
        }

        this._move(deltaTime);
    }

    _seekFood(deltaTime, world) {
        const food = world.resources.findNearestFood(this.x, this.y, this.senseRadius * 2);
        
        if (!food) {
            this.state = AntState.EXPLORING;
            return;
        }

        const dist = Math.hypot(food.x - this.x, food.y - this.y);
        
        if (dist < 8) {
            // Pick up food
            const taken = food.harvest(this.maxCarry - this.carryingAmount);
            if (taken > 0) {
                this.carrying = food.type;
                this.carryingAmount += taken;
                this.lastFoodLocation = { x: food.x, y: food.y };
                
                // Signal other ants
                world.swarm.emitSignal('food_found', food.x, food.y, 1.0);
                
                if (this.carryingAmount >= this.maxCarry || food.isEmpty) {
                    this.state = AntState.RETURNING_HOME;
                }
            }
        } else {
            this._turnToward(food.x, food.y, deltaTime);
            this._move(deltaTime);
        }
    }

    _returnHome(deltaTime, world) {
        const homeX = world.colony.nestX;
        const homeY = world.colony.nestY;
        const dist = Math.hypot(homeX - this.x, homeY - this.y);

        if (dist < 20) {
            // Deposit food
            if (this.carrying) {
                world.colony.storage.deposit(this.carrying, this.carryingAmount, 1.0);
                this.carrying = null;
                this.carryingAmount = 0;
            }
            this.state = AntState.EXPLORING;
            // Turn around to go back for more
            this.heading += Math.PI;
        } else {
            // Follow home pheromones or head toward nest
            const homeGradient = world.pheromones.findGradient(PheromoneType.HOME, this.x, this.y);
            if (homeGradient.strength > 5) {
                this._turnToward(
                    this.x + Math.cos(homeGradient.angle) * 20,
                    this.y + Math.sin(homeGradient.angle) * 20,
                    deltaTime
                );
            } else {
                this._turnToward(homeX, homeY, deltaTime);
            }
            this._move(deltaTime);
        }
    }

    _followTrail(deltaTime, world) {
        const gradient = world.pheromones.findGradient(PheromoneType.FOOD, this.x, this.y);
        
        if (gradient.strength < 5) {
            this.state = AntState.EXPLORING;
            return;
        }

        // Check for actual food
        const food = world.resources.findNearestFood(this.x, this.y, this.senseRadius);
        if (food) {
            this.state = AntState.SEEKING_FOOD;
            return;
        }

        this._turnToward(
            this.x + Math.cos(gradient.angle) * 20,
            this.y + Math.sin(gradient.angle) * 20,
            deltaTime
        );
        this._move(deltaTime);
    }

    _dig(deltaTime, world) {
        // Digging behavior for tunnel creation
        this.stateTimer += deltaTime;
        if (this.stateTimer > 2) {
            this.state = AntState.EXPLORING;
            this.stateTimer = 0;
        }
    }

    _wander(deltaTime) {
        this.wanderAngle += (Math.random() - 0.5) * 3 * deltaTime;
        this.heading += this.wanderAngle * deltaTime;
        this._move(deltaTime * 0.5);
    }

    _move(deltaTime) {
        const dx = Math.cos(this.heading) * this.speed * deltaTime;
        const dy = Math.sin(this.heading) * this.speed * deltaTime;
        this.x += dx;
        this.y += dy;
    }

    _turnToward(tx, ty, deltaTime) {
        const targetAngle = Math.atan2(ty - this.y, tx - this.x);
        let diff = targetAngle - this.heading;
        
        // Normalize to [-PI, PI]
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        
        this.heading += Math.sign(diff) * Math.min(Math.abs(diff), this.turnRate * deltaTime);
    }

    _depositPheromones(world) {
        // Deposit home pheromones when exploring from nest
        if (this.state === AntState.EXPLORING || this.state === AntState.SEEKING_FOOD) {
            const distFromHome = Math.hypot(
                this.x - world.colony.nestX,
                this.y - world.colony.nestY
            );
            const strength = Math.max(0, 50 - distFromHome * 0.1);
            world.pheromones.deposit(PheromoneType.HOME, this.x, this.y, strength * 0.3);
        }
        
        // Deposit food pheromones when returning with food
        if (this.state === AntState.RETURNING_HOME && this.carrying) {
            world.pheromones.deposit(PheromoneType.FOOD, this.x, this.y, 30);
        }
    }

    _boundaryCheck(world) {
        const margin = 10;
        const bounce = Math.PI * 0.75;
        
        if (this.x < margin) {
            this.x = margin;
            this.heading = -this.heading + Math.PI;
        }
        if (this.x > world.width - margin) {
            this.x = world.width - margin;
            this.heading = -this.heading + Math.PI;
        }
        if (this.y < margin) {
            this.y = margin;
            this.heading = -this.heading;
        }
        if (this.y > world.height - margin) {
            this.y = world.height - margin;
            this.heading = -this.heading;
        }
    }

    // Get render properties
    getRenderData() {
        return {
            x: this.x,
            y: this.y,
            heading: this.heading,
            size: this.size,
            carrying: this.carrying,
            state: this.state,
            legPhase: this.legPhase
        };
    }
}

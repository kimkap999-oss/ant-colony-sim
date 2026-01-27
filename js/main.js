/**
 * Main Entry Point
 * Game loop and world coordination
 */

import { SpatialHash, SwarmCoordinator } from './swarm.js';
import { PheromoneGrid } from './pheromones.js';
import { ResourceSpawner } from './resources.js';
import { Colony } from './colony.js';
import { ParticleSystem } from './particles.js';
import { Renderer } from './renderer.js';

class World {
    constructor(canvas) {
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Core systems
        this.spatialHash = new SpatialHash(25);
        this.swarm = new SwarmCoordinator(this.spatialHash);
        this.pheromones = new PheromoneGrid(this.width, this.height, 10);
        this.resources = new ResourceSpawner(this.width, this.height);
        this.particles = new ParticleSystem(2000);
        this.renderer = new Renderer(canvas);
        
        // Colony (centered, below surface)
        this.colony = new Colony(
            this.width / 2,
            this.height * 0.25,
            this
        );
        
        // Game state
        this.paused = false;
        this.speed = 1;
        this.lastTime = 0;
        
        // Initialize
        this._init();
    }

    _init() {
        // Spawn initial resources
        this.resources.spawnInitialResources(60);
        
        // Spawn initial ants
        for (let i = 0; i < 30; i++) {
            this.colony.spawnAnt();
        }
        
        // Deposit initial home pheromones
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 50;
            this.pheromones.deposit(
                'home',
                this.colony.nestX + Math.cos(angle) * dist,
                this.colony.nestY + Math.sin(angle) * dist,
                100
            );
        }

        // Setup UI bindings
        this._setupUI();
    }

    _setupUI() {
        document.getElementById('btn-pause').addEventListener('click', () => {
            this.paused = !this.paused;
            document.getElementById('btn-pause').textContent = this.paused ? '▶️' : '⏸️';
        });

        document.getElementById('btn-speed').addEventListener('click', () => {
            this.speed = this.speed >= 4 ? 1 : this.speed * 2;
            document.getElementById('btn-speed').textContent = `${this.speed}×`;
        });

        document.getElementById('btn-pheromones').addEventListener('click', (e) => {
            this.renderer.showPheromones = !this.renderer.showPheromones;
            e.target.classList.toggle('active');
        });

        // Track pressed keys for smooth camera movement
        this.keysPressed = new Set();
        
        document.addEventListener('keydown', (e) => {
            this.keysPressed.add(e.key);
            
            switch (e.key) {
                case ' ':
                    this.paused = !this.paused;
                    e.preventDefault();
                    break;
                case 'd':
                case 'D':
                    this.renderer.showDebug = !this.renderer.showDebug;
                    break;
                case 'p':
                case 'P':
                    this.renderer.showPheromones = !this.renderer.showPheromones;
                    break;
                case '1':
                    this.speed = 1;
                    break;
                case '2':
                    this.speed = 2;
                    break;
                case '3':
                    this.speed = 3;
                    break;
                case '4':
                    this.speed = 4;
                    break;
                case '+':
                case '=':
                    this.renderer.camera.zoom = Math.min(3, this.renderer.camera.zoom * 1.2);
                    break;
                case '-':
                case '_':
                    this.renderer.camera.zoom = Math.max(0.3, this.renderer.camera.zoom / 1.2);
                    break;
                case 'Home':
                    // Reset camera
                    this.renderer.camera.x = 0;
                    this.renderer.camera.y = 0;
                    this.renderer.camera.zoom = 1;
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keysPressed.delete(e.key);
        });
        
        // Mouse drag to pan
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };
        
        this.renderer.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0 && e.shiftKey) {
                isDragging = true;
                dragStart = { x: e.clientX, y: e.clientY };
                e.preventDefault();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;
                this.renderer.camera.x -= dx / this.renderer.camera.zoom;
                this.renderer.camera.y -= dy / this.renderer.camera.zoom;
                dragStart = { x: e.clientX, y: e.clientY };
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // Mouse wheel to zoom
        this.renderer.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.renderer.camera.zoom = Math.max(0.3, Math.min(3, this.renderer.camera.zoom * zoomFactor));
        }, { passive: false });

        // Click to add food
        this.renderer.canvas.addEventListener('click', (e) => {
            const rect = this.renderer.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Only spawn if in the surface area
            if (y < this.height * 0.35) {
                this.resources.spawnRandom();
                this.resources.resources[this.resources.resources.length - 1].x = x;
                this.resources.resources[this.resources.resources.length - 1].y = y;
                
                // Visual feedback
                this.particles.emitCollect(x, y, { r: 100, g: 255, b: 100 });
            }
        });
    }

    update(deltaTime) {
        // Camera movement (always runs even when paused)
        const camSpeed = 300 / this.renderer.camera.zoom;
        if (this.keysPressed.has('ArrowLeft') || this.keysPressed.has('a')) {
            this.renderer.camera.x -= camSpeed * deltaTime;
        }
        if (this.keysPressed.has('ArrowRight') || this.keysPressed.has('d') && !this.keysPressed.has('Shift')) {
            this.renderer.camera.x += camSpeed * deltaTime;
        }
        if (this.keysPressed.has('ArrowUp') || this.keysPressed.has('w')) {
            this.renderer.camera.y -= camSpeed * deltaTime;
        }
        if (this.keysPressed.has('ArrowDown') || this.keysPressed.has('s')) {
            this.renderer.camera.y += camSpeed * deltaTime;
        }
        
        if (this.paused) return;
        
        const dt = deltaTime * this.speed;
        
        // Update systems
        this.colony.update(dt);
        this.resources.update(dt);
        this.pheromones.update();
        this.particles.update(dt);
        this.swarm.cleanupSignals();
        
        // Resize handler
        if (this.width !== this.renderer.canvas.width || 
            this.height !== this.renderer.canvas.height) {
            this.width = this.renderer.canvas.width;
            this.height = this.renderer.canvas.height;
        }
    }

    render(timestamp) {
        this.renderer.updateFPS(timestamp);
        this.renderer.clear();
        
        // Render layers in order
        this.renderer.renderPheromones(this.pheromones);
        this.renderer.renderChambers(this.colony.chambers);
        this.renderer.renderNestEntrance(this.colony.nestX, this.colony.nestY);
        this.renderer.renderResources(this.resources.resources);
        this.renderer.renderAnts(this.colony.ants);
        this.particles.render(this.renderer.ctx);
        
        // UI
        const stats = this.colony.getStats();
        stats.timeString = this.colony.getTimeString();
        this.renderer.renderUI(stats);
        this.renderer.renderDebugInfo(this);
    }
}

// Bootstrap
const canvas = document.getElementById('colony-canvas');
const world = new World(canvas);

let lastTime = 0;

function gameLoop(timestamp) {
    const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    
    world.update(deltaTime);
    world.render(timestamp);
    
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

console.log('🐜 Ant Colony Simulator initialized');

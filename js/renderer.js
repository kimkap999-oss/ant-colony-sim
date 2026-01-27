/**
 * Renderer
 * Handles all canvas drawing with optimizations
 */

import { PheromoneType, PheromoneColors } from './pheromones.js';
import { ResourceDefs } from './resources.js';
import { AntState } from './ant.js';
import { ChamberType } from './colony.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Camera
        this.camera = { x: 0, y: 0, zoom: 1 };
        
        // Options
        this.showPheromones = true;
        this.showDebug = false;
        this.showGrid = false;
        
        // Performance
        this.frameCount = 0;
        this.fps = 60;
        this.lastFpsUpdate = 0;
        
        // Colors
        this.colors = {
            background: '#2d1b0e',
            soil: '#4a3423',
            soilDark: '#3d2817',
            tunnel: '#1a1209',
            ant: '#1a1a1a',
            antCarrying: '#2d5a27'
        };

        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    clear() {
        const ctx = this.ctx;
        const cam = this.camera;
        
        // Reset transform before clearing
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Sky gradient at top, soil below
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');    // Sky
        gradient.addColorStop(0.15, '#5a9fd4'); // Horizon
        gradient.addColorStop(0.18, '#8B7355'); // Surface
        gradient.addColorStop(0.2, '#6B4423');  // Topsoil
        gradient.addColorStop(0.4, '#4a3423');  // Soil
        gradient.addColorStop(1, '#2d1b0e');    // Deep soil
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Apply camera transform
        ctx.setTransform(
            cam.zoom, 0, 0, cam.zoom,
            this.canvas.width / 2 - cam.x * cam.zoom,
            this.canvas.height / 2 - cam.y * cam.zoom
        );
        
        // Offset to center the view on (0,0) being top-left of world
        ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);

        // Surface grass (drawn in world space now)
        ctx.fillStyle = '#228B22';
        for (let x = 0; x < this.canvas.width * 2; x += 8) {
            const height = 5 + Math.sin(x * 0.1) * 3;
            ctx.fillRect(x - this.canvas.width / 2, this.canvas.height * 0.17 - height, 3, height);
        }
    }

    renderPheromones(pheromoneGrid) {
        if (!this.showPheromones) return;

        const ctx = this.ctx;
        
        for (const type of [PheromoneType.HOME, PheromoneType.FOOD]) {
            const data = pheromoneGrid.getRenderData(type);
            const { grid, cols, rows, cellSize, color } = data;

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const idx = row * cols + col;
                    const strength = grid[idx];
                    
                    if (strength > 1) {
                        const alpha = Math.min(strength / 100, 0.6);
                        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
                        ctx.fillRect(
                            col * cellSize,
                            row * cellSize,
                            cellSize,
                            cellSize
                        );
                    }
                }
            }
        }
    }

    renderChambers(chambers) {
        const ctx = this.ctx;
        
        for (const chamber of chambers) {
            // Chamber background
            ctx.fillStyle = this.colors.tunnel;
            ctx.beginPath();
            ctx.roundRect(chamber.x, chamber.y, chamber.width, chamber.height, 8);
            ctx.fill();
            
            // Chamber border glow based on type
            const glowColors = {
                [ChamberType.ENTRANCE]: 'rgba(100, 255, 218, 0.3)',
                [ChamberType.FOOD_STORAGE]: 'rgba(124, 181, 24, 0.3)',
                [ChamberType.NURSERY]: 'rgba(255, 182, 193, 0.3)',
                [ChamberType.QUEEN]: 'rgba(255, 215, 0, 0.4)',
                [ChamberType.WASTE]: 'rgba(139, 90, 43, 0.3)'
            };
            
            ctx.strokeStyle = glowColors[chamber.type] || 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    renderResources(resources) {
        const ctx = this.ctx;
        
        for (const resource of resources) {
            const def = ResourceDefs[resource.type];
            
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(resource.x, resource.y + 3, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Resource
            ctx.fillStyle = def.color;
            ctx.beginPath();
            ctx.arc(resource.x, resource.y, 4 + resource.quantity, 0, Math.PI * 2);
            ctx.fill();
            
            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(resource.x - 2, resource.y - 2, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Quantity indicator
            if (resource.quantity > 1) {
                ctx.fillStyle = '#fff';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(resource.quantity.toString(), resource.x, resource.y - 10);
            }
        }
    }

    renderAnts(ants) {
        const ctx = this.ctx;
        
        for (const ant of ants) {
            const data = ant.getRenderData();
            
            ctx.save();
            ctx.translate(data.x, data.y);
            ctx.rotate(data.heading);
            
            // Body segments
            const bodyColor = data.carrying ? this.colors.antCarrying : this.colors.ant;
            
            // Abdomen
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.ellipse(-4, 0, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Thorax
            ctx.beginPath();
            ctx.ellipse(1, 0, 3, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Head
            ctx.beginPath();
            ctx.ellipse(5, 0, 2.5, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Antennae
            ctx.strokeStyle = bodyColor;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(6, -1);
            ctx.lineTo(9, -3);
            ctx.moveTo(6, 1);
            ctx.lineTo(9, 3);
            ctx.stroke();
            
            // Legs (animated)
            const legOffset = Math.sin(data.legPhase) * 0.5;
            ctx.beginPath();
            for (let i = 0; i < 3; i++) {
                const lx = -1 + i * 2;
                const offset = i % 2 === 0 ? legOffset : -legOffset;
                ctx.moveTo(lx, -2);
                ctx.lineTo(lx - 1, -5 + offset);
                ctx.moveTo(lx, 2);
                ctx.lineTo(lx - 1, 5 - offset);
            }
            ctx.stroke();
            
            // Carried resource
            if (data.carrying) {
                const def = ResourceDefs[data.carrying];
                ctx.fillStyle = def?.color || '#c4a35a';
                ctx.beginPath();
                ctx.arc(3, -4, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
            
            // Debug: show state
            if (this.showDebug) {
                ctx.fillStyle = '#fff';
                ctx.font = '8px monospace';
                ctx.fillText(data.state.substring(0, 4), data.x + 8, data.y);
            }
        }
    }

    renderNestEntrance(x, y) {
        const ctx = this.ctx;
        
        // Mound
        ctx.fillStyle = '#5c4033';
        ctx.beginPath();
        ctx.ellipse(x, y - 5, 25, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Entrance hole
        ctx.fillStyle = '#1a1209';
        ctx.beginPath();
        ctx.ellipse(x, y, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Entrance shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(x, y + 2, 10, 5, 0, 0, Math.PI);
        ctx.fill();
    }

    renderUI(stats) {
        // Reset transform for UI (screen space)
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Update DOM elements
        document.getElementById('stat-population').textContent = `🐜 ${stats.population}`;
        document.getElementById('stat-food').textContent = `🌰 ${stats.food}`;
        document.getElementById('day-count').textContent = `Day ${stats.day}`;
    }

    renderDebugInfo(world) {
        if (!this.showDebug) return;
        
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 150, 80);
        
        ctx.fillStyle = '#0f0';
        ctx.font = '12px monospace';
        ctx.fillText(`FPS: ${this.fps}`, 20, 30);
        ctx.fillText(`Ants: ${world.colony.ants.length}`, 20, 45);
        ctx.fillText(`Particles: ${world.particles.activeCount}`, 20, 60);
        ctx.fillText(`Resources: ${world.resources.resources.length}`, 20, 75);
    }

    updateFPS(timestamp) {
        this.frameCount++;
        if (timestamp - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = timestamp;
        }
    }
}

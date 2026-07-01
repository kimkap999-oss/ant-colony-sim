/**
 * Particle System
 * Efficient particle effects for dust, debris, and visual feedback
 */

export class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 1;
        this.size = 2;
        this.color = { r: 255, g: 255, b: 255 };
        this.alpha = 1;
        this.gravity = 0;
        this.friction = 0.98;
        this.type = 'default';
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vy += this.gravity * deltaTime;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= deltaTime;
        this.alpha = Math.max(0, this.life / this.maxLife);
    }

    get isDead() {
        return this.life <= 0;
    }
}

export class ParticleSystem {
    constructor(maxParticles = 1000) {
        this.maxParticles = maxParticles;
        this.particles = [];
        this.pool = [];

        // Pre-allocate particles
        for (let i = 0; i < maxParticles; i++) {
            this.pool.push(new Particle());
        }
    }

    emit(config) {
        const count = config.count || 1;

        for (let i = 0; i < count; i++) {
            if (this.pool.length === 0) break;

            const p = this.pool.pop();
            p.reset();

            p.x = config.x + (Math.random() - 0.5) * (config.spread || 0);
            p.y = config.y + (Math.random() - 0.5) * (config.spread || 0);

            const angle = config.angle ?? Math.random() * Math.PI * 2;
            const speed = config.speed ?? 50;
            const speedVariance = config.speedVariance ?? 0.5;
            const actualSpeed = speed * (1 + (Math.random() - 0.5) * speedVariance);

            p.vx = Math.cos(angle) * actualSpeed;
            p.vy = Math.sin(angle) * actualSpeed;

            p.life = config.life ?? 1;
            p.maxLife = p.life;
            p.size = config.size ?? 2;
            p.color = config.color ?? { r: 255, g: 255, b: 255 };
            p.gravity = config.gravity ?? 0;
            p.friction = config.friction ?? 0.98;
            p.type = config.type ?? 'default';

            this.particles.push(p);
        }
    }

    // Emit dust when ant is digging
    emitDust(x, y) {
        this.emit({
            x,
            y,
            count: 5,
            spread: 8,
            speed: 30,
            life: 0.5,
            size: 2,
            color: { r: 139, g: 90, b: 43 },
            gravity: 50,
            type: 'dust',
        });
    }

    // Emit sparkle when food is collected
    emitCollect(x, y, color) {
        this.emit({
            x,
            y,
            count: 8,
            spread: 5,
            speed: 60,
            speedVariance: 0.8,
            life: 0.4,
            size: 3,
            color: color || { r: 255, g: 215, b: 0 },
            gravity: -20,
            type: 'sparkle',
        });
    }

    // Pheromone visual
    emitPheromone(x, y, type) {
        const colors = {
            home: { r: 100, g: 255, b: 218 },
            food: { r: 124, g: 181, b: 24 },
        };

        this.emit({
            x,
            y,
            count: 1,
            speed: 5,
            life: 0.8,
            size: 4,
            color: colors[type] || colors.home,
            gravity: -10,
            friction: 0.95,
            type: 'pheromone',
        });
    }

    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(deltaTime);

            if (p.isDead) {
                this.particles.splice(i, 1);
                p.reset();
                this.pool.push(p);
            }
        }
    }

    render(ctx) {
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;

            if (p.type === 'sparkle') {
                // Star shape for sparkles
                ctx.fillStyle = `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
                ctx.fill();

                // Glow
                ctx.shadowColor = `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`;
                ctx.shadowBlur = 10;
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                ctx.fillStyle = `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`;
                ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            }
        }

        ctx.globalAlpha = 1;
    }

    get activeCount() {
        return this.particles.length;
    }
}

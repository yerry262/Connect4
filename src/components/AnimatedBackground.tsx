import { useCallback, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import {
  getRenderScale,
  getTargetFps,
  isLowPowerDevice,
  prefersReducedMotion,
} from '../utils/performance';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  targetAlpha: number;
}

const PARTICLE_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFC53D',
  '#6C5CE7',
  '#FF8E53',
  '#A29BFE',
  '#FF69B4',
  '#00CEC9',
  '#E91E63',
];

// Cap particle count so it doesn't scale unbounded with the area of large
// in-car / desktop displays. The connection-line pass is the expensive part,
// so low-power devices (Tesla) get a much smaller budget.
const MAX_PARTICLES_HIGH = 120;
const MAX_PARTICLES_LOW = 40;
const CONNECT_DISTANCE = 120;
const GLOW_SPRITE_SIZE = 64; // backing size of the cached radial-gradient sprite

/**
 * Pre-render each particle colour's radial glow into a small offscreen canvas
 * once, then blit it per frame. This avoids allocating a fresh radial gradient
 * for every particle on every frame, which was the single biggest per-frame
 * cost (and is brutal on the Tesla browser's GPU).
 */
function buildGlowSprites(): Map<string, HTMLCanvasElement> {
  const sprites = new Map<string, HTMLCanvasElement>();
  for (const color of PARTICLE_COLORS) {
    const c = document.createElement('canvas');
    c.width = GLOW_SPRITE_SIZE;
    c.height = GLOW_SPRITE_SIZE;
    const sctx = c.getContext('2d');
    if (!sctx) continue;
    const r = GLOW_SPRITE_SIZE / 2;
    const grd = sctx.createRadialGradient(r, r, 0, r, r, r);
    grd.addColorStop(0, color);
    grd.addColorStop(1, color + '00');
    sctx.fillStyle = grd;
    sctx.beginPath();
    sctx.arc(r, r, r, 0, Math.PI * 2);
    sctx.fill();
    sprites.set(color, c);
  }
  return sprites;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animationRef = useRef<number>(0);
  const spritesRef = useRef<Map<string, HTMLCanvasElement> | null>(null);
  // CSS-pixel dimensions of the canvas (independent of the backing-store scale).
  const sizeRef = useRef({ width: 0, height: 0 });

  const lowPower = isLowPowerDevice();
  const reducedMotion = prefersReducedMotion();

  const initParticles = useCallback(
    (width: number, height: number) => {
      const maxParticles = lowPower ? MAX_PARTICLES_LOW : MAX_PARTICLES_HIGH;
      const numParticles = Math.min(
        Math.floor((width * height) / 15000),
        maxParticles
      );

      const particles: Particle[] = [];
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 20 + 10,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          alpha: Math.random() * 0.3 + 0.1,
          targetAlpha: Math.random() * 0.3 + 0.1,
        });
      }

      particlesRef.current = particles;
    },
    [lowPower]
  );

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = sizeRef.current;
    const sprites = spritesRef.current;

    // Gradient background (cheap: one fill per frame).
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f0c29');
    gradient.addColorStop(0.5, '#302b63');
    gradient.addColorStop(1, '#24243e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const particles = particlesRef.current;
    const interactive = !lowPower; // skip pointer repulsion on constrained devices

    for (const particle of particles) {
      if (interactive) {
        const dx = particle.x - mouseRef.current.x;
        const dy = particle.y - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 150 && distance > 0) {
          const force = (150 - distance) / 150;
          particle.vx += (dx / distance) * force * 0.2;
          particle.vy += (dy / distance) * force * 0.2;
        }
      }

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.99;
      particle.vy *= 0.99;

      if (particle.x < -particle.radius) particle.x = width + particle.radius;
      if (particle.x > width + particle.radius) particle.x = -particle.radius;
      if (particle.y < -particle.radius) particle.y = height + particle.radius;
      if (particle.y > height + particle.radius) particle.y = -particle.radius;

      particle.alpha += (particle.targetAlpha - particle.alpha) * 0.02;
      if (Math.abs(particle.alpha - particle.targetAlpha) < 0.01) {
        particle.targetAlpha = Math.random() * 0.3 + 0.1;
      }

      // Blit the cached glow sprite instead of building a gradient per frame.
      const sprite = sprites?.get(particle.color);
      const size = particle.radius * 2;
      ctx.globalAlpha = particle.alpha;
      if (sprite) {
        ctx.drawImage(
          sprite,
          particle.x - particle.radius,
          particle.y - particle.radius,
          size,
          size
        );
      } else {
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Connection lines. The original ran an O(n^2) all-pairs scan every
    // frame; we bucket particles into a uniform grid sized to the connect
    // distance so each particle only tests its own + adjacent cells (~O(n)).
    // Skipped entirely on low-power devices.
    if (!lowPower && particles.length > 1) {
      const cellSize = CONNECT_DISTANCE;
      const cols = Math.max(1, Math.ceil(width / cellSize));
      const grid = new Map<number, Particle[]>();
      for (const p of particles) {
        const cx = Math.min(cols - 1, Math.max(0, Math.floor(p.x / cellSize)));
        const cy = Math.max(0, Math.floor(p.y / cellSize));
        const key = cy * cols + cx;
        const bucket = grid.get(key);
        if (bucket) bucket.push(p);
        else grid.set(key, [p]);
      }

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const maxDistSq = CONNECT_DISTANCE * CONNECT_DISTANCE;
      for (const p1 of particles) {
        const cx = Math.min(cols - 1, Math.max(0, Math.floor(p1.x / cellSize)));
        const cy = Math.max(0, Math.floor(p1.y / cellSize));
        for (let ox = -1; ox <= 1; ox++) {
          for (let oy = -1; oy <= 1; oy++) {
            const nx = cx + ox;
            const ny = cy + oy;
            if (nx < 0 || nx >= cols || ny < 0) continue;
            const bucket = grid.get(ny * cols + nx);
            if (!bucket) continue;
            for (const p2 of bucket) {
              if (p2 === p1 || p2.x < p1.x || (p2.x === p1.x && p2.y <= p1.y)) {
                // Visit each unordered pair once.
                continue;
              }
              const ddx = p1.x - p2.x;
              const ddy = p1.y - p2.y;
              if (ddx * ddx + ddy * ddy < maxDistSq) {
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
              }
            }
          }
        }
      }
      ctx.stroke();
    }
  }, [lowPower]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    spritesRef.current = buildGlowSprites();

    const applySize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const scale = getRenderScale();
      sizeRef.current = { width, height };
      // Backing store at (capped) device resolution; draw in CSS pixels.
      canvas.width = Math.floor(width * scale);
      canvas.height = Math.floor(height * scale);
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(scale, 0, 0, scale, 0, 0);
      initParticles(width, height);
    };

    applySize();

    // Reduced motion: render a single static frame and stop. No rAF loop,
    // no CPU/GPU churn — important for a parked-car display.
    if (reducedMotion) {
      drawFrame();
      const handleResize = () => {
        applySize();
        drawFrame();
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    const targetFps = getTargetFps();
    const frameInterval = 1000 / targetFps;
    let lastFrame = 0;
    let running = true;

    const loop = (now: number) => {
      if (!running) return;
      animationRef.current = requestAnimationFrame(loop);
      if (now - lastFrame < frameInterval) return;
      lastFrame = now;
      drawFrame();
    };

    const start = () => {
      if (running) return;
      running = true;
      lastFrame = 0;
      animationRef.current = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(animationRef.current);
    };

    const handleResize = () => applySize();
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    // Pause the loop while the tab/app is backgrounded to save power.
    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    window.addEventListener('resize', handleResize);
    if (!lowPower) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
    }
    document.addEventListener('visibilitychange', handleVisibility);

    running = false; // start() expects to flip this on
    start();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('visibilitychange', handleVisibility);
      stop();
    };
  }, [drawFrame, initParticles, lowPower, reducedMotion]);

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </Box>
  );
}

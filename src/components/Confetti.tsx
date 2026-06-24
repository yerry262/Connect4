import { useEffect, useRef } from 'react';
import {
  getRenderScale,
  isLowPowerDevice,
  prefersReducedMotion,
} from '../utils/performance';

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
}

const CONFETTI_COLORS = [
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
  '#FFEB3B',
  '#00BCD4',
];

// Confetti is purely decorative, so it auto-stops after this long to free the
// CPU/GPU (the original looped forever, recycling pieces indefinitely).
const CONFETTI_DURATION_MS = 6000;

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<ConfettiPiece[]>([]);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    // Respect reduced motion (and our low-power override) by skipping the
    // animation entirely. This component renders nothing in that case.
    if (prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = getRenderScale();
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    const lowPower = isLowPowerDevice();
    const numConfetti = lowPower ? 60 : 150;

    const confetti: ConfettiPiece[] = [];
    for (let i = 0; i < numConfetti; i++) {
      confetti.push({
        x: Math.random() * width,
        y: -Math.random() * height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        width: Math.random() * 10 + 5,
        height: Math.random() * 15 + 8,
      });
    }
    confettiRef.current = confetti;

    let running = true;
    const startTime = performance.now();

    const animate = (now: number) => {
      if (!running) return;

      // Stop recycling pieces once the celebration window has elapsed.
      const elapsed = now - startTime;
      const finished = elapsed > CONFETTI_DURATION_MS;

      ctx.clearRect(0, 0, width, height);

      let visible = 0;
      confettiRef.current.forEach((piece) => {
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.vy += 0.05; // Gravity
        piece.rotation += piece.rotationSpeed;
        piece.vx *= 0.99; // Air resistance
        piece.vx += (Math.random() - 0.5) * 0.1; // Wind

        if (piece.y > height) {
          if (finished) return; // let it fall off-screen and disappear
          piece.y = -20;
          piece.x = Math.random() * width;
          piece.vy = Math.random() * 3 + 2;
        }

        if (piece.y <= height) visible++;

        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate((piece.rotation * Math.PI) / 180);
        ctx.fillStyle = piece.color;
        ctx.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
        ctx.restore();
      });

      if (finished && visible === 0) {
        running = false;
        ctx.clearRect(0, 0, width, height);
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(animationRef.current);
      } else if (performance.now() - startTime <= CONFETTI_DURATION_MS) {
        running = true;
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      document.removeEventListener('visibilitychange', handleVisibility);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 300,
      }}
    />
  );
}

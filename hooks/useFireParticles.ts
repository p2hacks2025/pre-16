import { useRef, useCallback } from "react";

export interface Point {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

export function useFireParticles() {
  const particles = useRef<Particle[]>([]);

  const emitParticles = useCallback((source: Point, amount: number = 5) => {
    for (let i = 0; i < amount; i++) {
      // Fire Breathing physics: Downward jet with some spread
      const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 15 + 5; // Faster particles for "breathing" force

      // Brighter colors (High lightness for hot center)
      const hue = Math.random() * 45; // 0-45 (Red to Yellow)
      const lightness = 50 + Math.random() * 40; // 50-90% lightness

      particles.current.push({
        x: source.x,
        y: source.y,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 5, // Random side spray
        vy: Math.abs(Math.sin(angle) * speed), // Always down-ish
        life: 1.0,
        size: Math.random() * 30 + 10,
        color: `hsl(${hue}, 100%, ${lightness}%)`,
      });
    }
  }, []);

  const updateAndDrawParticles = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Additive blending makes overlapping particles super bright (fire effect)
      ctx.globalCompositeOperation = "lighter";

      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= Math.random() * 0.02 + 0.01; // Random decay
        p.size *= 0.95; // Shrink over time

        if (p.life <= 0 || p.size < 0.5) {
          particles.current.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;

        // Glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reset context for other draws
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = "source-over";
      ctx.shadowBlur = 0;
    },
    []
  );

  const clearParticles = useCallback(() => {
    particles.current = [];
  }, []);

  return { emitParticles, updateAndDrawParticles, clearParticles };
}

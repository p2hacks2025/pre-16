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
      const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5; // Downwards-ish (PI/2) with spread
      const speed = Math.random() * 5 + 2;

      particles.current.push({
        x: source.x,
        y: source.y,
        vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1) * 2,
        vy: Math.abs(Math.sin(angle) * speed) + 2,
        life: 1.0,
        size: Math.random() * 20 + 10,
        color: `hsl(${Math.random() * 40 + 10}, 100%, 50%)`,
      });
    }
  }, []);

  const updateAndDrawParticles = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      // Note: We don't clear rect here because the caller might need to draw video/image first

      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.01;
        p.size *= 0.95;

        if (p.life <= 0) {
          particles.current.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    },
    []
  );

  const clearParticles = useCallback(() => {
    particles.current = [];
  }, []);

  return { emitParticles, updateAndDrawParticles, clearParticles };
}

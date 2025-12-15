"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  hue: number;
};

export type FireworksHandle = {
  celebrate: () => void;
};

// Fireworks overlay that can be triggered programmatically (e.g. after posting)
export const FireworksOverlay = forwardRef<FireworksHandle>(
  function FireworksOverlay(_, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    const spawnBurst = useCallback((x?: number, y?: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const burstX = x ?? canvas.width * (0.25 + Math.random() * 0.5);
      const burstY = y ?? canvas.height * (0.15 + Math.random() * 0.35);
      const hueBase = 280 + Math.random() * 120; // blue-purple-gold range

      const sparkCount = 28 + Math.floor(Math.random() * 18);
      for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2.5 + Math.random() * 4.5;
        particlesRef.current.push({
          x: burstX,
          y: burstY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          size: 3 + Math.random() * 3.5,
          hue: hueBase + Math.random() * 50,
        });
      }
    }, []);

    const celebrate = useCallback(() => {
      // Two quick bursts for a celebratory feel
      spawnBurst();
      window.setTimeout(() => spawnBurst(), 180);
    }, [spawnBurst]);

    useImperativeHandle(ref, () => ({ celebrate }));

    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctxRef.current = ctx;

      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      const render = () => {
        if (!ctxRef.current || !canvasRef.current) return;
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.985; // air drag
          p.vy = p.vy * 0.985 + 0.06; // gravity
          p.life -= 0.012 + Math.random() * 0.01;

          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          ctx.globalAlpha = Math.max(p.life, 0);
          ctx.fillStyle = `hsl(${p.hue}, 85%, 62%)`;
          ctx.shadowBlur = 18;
          ctx.shadowColor = ctx.fillStyle;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        rafRef.current = requestAnimationFrame(render);
      };

      resize();
      window.addEventListener("resize", resize);
      rafRef.current = requestAnimationFrame(render);

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        window.removeEventListener("resize", resize);
        ctxRef.current = null;
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-40 mix-blend-screen"
      />
    );
  }
);

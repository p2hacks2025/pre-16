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
  maxLife: number;
  size: number;
  hue: number;
  trail: { x: number; y: number }[];
};

export type FireworksHandle = {
  celebrate: () => void;
};

// Realistic fireworks overlay with trails and color gradients
export const FireworksOverlay = forwardRef<FireworksHandle>(
  function FireworksOverlay(_, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number | null>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    const celebrate = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const burstX = canvas.width * 0.5; // center
      const burstY = canvas.height * 0.3; // upper center
      
      // Random color palette: blue, purple, green, white
      const colorPalettes = [
        [200, 240, 280], // blues to cyan
        [260, 280, 320], // purples to magenta
        [140, 160, 180], // greens to cyan
        [40, 60, 200],   // warm to cool white
      ];
      const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

      const sparkCount = 300 + Math.floor(Math.random() * 100); // 300-400 particles
      for (let i = 0; i < sparkCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 8 + Math.random() * 12; // high initial velocity
        const hue = palette[Math.floor(Math.random() * palette.length)];
        
        particlesRef.current.push({
          x: burstX,
          y: burstY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 1,
          size: 2 + Math.random() * 3,
          hue: hue + (Math.random() - 0.5) * 30,
          trail: [],
        });
      }
    }, []);

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

        // Fade previous frame for trail effect (motion blur)
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          
          // Physics: velocity decay and gravity
          p.vx *= 0.98; // air resistance
          p.vy = p.vy * 0.98 + 0.15; // gravity
          p.x += p.vx;
          p.y += p.vy;
          
          // Trail tracking - store position history
          p.trail.push({ x: p.x, y: p.y });
          if (p.trail.length > 8) p.trail.shift();
          
          // Life decay
          p.life -= 0.008 + Math.random() * 0.007;

          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          // Color gradient over time: start bright, shift hue, fade to white
          const lifeRatio = p.life / p.maxLife;
          const brightness = 50 + lifeRatio * 30; // 50-80%
          const saturation = lifeRatio > 0.5 ? 80 : 80 - (0.5 - lifeRatio) * 100; // desaturate at end
          const currentHue = p.hue + (1 - lifeRatio) * 20; // slight hue shift

          ctx.globalCompositeOperation = "lighter";

          // Draw trail (long exposure effect)
          if (p.trail.length > 1) {
            for (let t = 0; t < p.trail.length - 1; t++) {
              const alpha = (t / p.trail.length) * p.life * 0.6;
              const trailSize = p.size * (0.3 + (t / p.trail.length) * 0.7);
              
              ctx.globalAlpha = alpha;
              ctx.fillStyle = `hsl(${currentHue}, ${saturation}%, ${brightness}%)`;
              ctx.shadowBlur = 15 + lifeRatio * 20;
              ctx.shadowColor = ctx.fillStyle;
              
              ctx.beginPath();
              ctx.arc(p.trail[t].x, p.trail[t].y, trailSize, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // Draw main particle (brightest point)
          ctx.globalAlpha = p.life;
          ctx.fillStyle = `hsl(${currentHue}, ${saturation}%, ${brightness + 10}%)`;
          ctx.shadowBlur = 25 + lifeRatio * 30;
          ctx.shadowColor = ctx.fillStyle;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Extra bright core glow
          ctx.globalAlpha = p.life * 0.5;
          ctx.shadowBlur = 40;
          ctx.fillStyle = `hsl(${currentHue}, ${saturation}%, ${brightness + 20}%)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
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
        className="pointer-events-none fixed inset-0 z-40 bg-black mix-blend-screen"
      />
    );
  }
);

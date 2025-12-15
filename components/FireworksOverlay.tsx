"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

export type FireworksHandle = {
  celebrate: () => void;
};

// Performance-tuned fireworks overlay using object pooling + pre-rendered sprites
export const FireworksOverlay = forwardRef<FireworksHandle>(function Overlay(
  _,
  ref
) {
  // Canvas/state refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // DPR + size
  const dprRef = useRef(1);
  const widthRef = useRef(0);
  const heightRef = useRef(0);

  // Animation
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // FPS-based quality scaling (0.6 - 1.0)
  const framesRef = useRef(0);
  const accRef = useRef(0);
  const qualityRef = useRef(1);

  // Sprites (palettes x levels)
  const spritesRef = useRef<HTMLCanvasElement[][]>([]);
  const LEVELS = 12; // life→white shift levels (higher quality fades)
  // Hues for blue, purple, green, white(null)
  const PALETTES: (number | null)[] = [200, 280, 160, null];

  // Particle pool (struct of arrays)
  const MAX = 800; // pool capacity
  const alive = useRef<Uint8Array | null>(null);
  const px = useRef<Float32Array | null>(null);
  const py = useRef<Float32Array | null>(null);
  const vx = useRef<Float32Array | null>(null);
  const vy = useRef<Float32Array | null>(null);
  const life = useRef<Float32Array | null>(null); // 1→0
  const decay = useRef<Float32Array | null>(null); // life decay per second
  const size = useRef<Float32Array | null>(null); // radius in px
  const pal = useRef<Uint8Array | null>(null); // palette index 0..3

  // Free list for pool reuse
  const freeList = useRef<Int32Array | null>(null);
  const freeTop = useRef<number>(0);

  // Utility: init pool arrays
  const initPool = () => {
    alive.current = new Uint8Array(MAX);
    px.current = new Float32Array(MAX);
    py.current = new Float32Array(MAX);
    vx.current = new Float32Array(MAX);
    vy.current = new Float32Array(MAX);
    life.current = new Float32Array(MAX);
    decay.current = new Float32Array(MAX);
    size.current = new Float32Array(MAX);
    pal.current = new Uint8Array(MAX);
    freeList.current = new Int32Array(MAX);
    freeTop.current = MAX;
    for (let i = 0; i < MAX; i++) freeList.current![i] = i;
  };

  // Utility: take/free slot
  const alloc = () => {
    if (freeTop.current <= 0) return -1;
    return freeList.current![--freeTop.current];
  };
  const release = (id: number) => {
    alive.current![id] = 0;
    freeList.current![freeTop.current++] = id;
  };

  // Create tinted radial sprite
  const makeSprite = (
    hue: number | null,
    level: number,
    dpr: number
  ): HTMLCanvasElement => {
    const sizePx = Math.floor(64 * dpr);
    const c = document.createElement("canvas");
    c.width = sizePx;
    c.height = sizePx;
    const g = c.getContext("2d")!;
    const cx = sizePx / 2;
    const cy = sizePx / 2;
    const r = sizePx / 2;

    const t = level / Math.max(1, LEVELS - 1);
    // Saturation 80%→35%, Lightness 60%→85%
    const sat = hue === null ? 0 : Math.max(0, 80 - 45 * t);
    const lit = hue === null ? 95 : Math.min(90, 60 + 25 * t);
    const h = hue ?? 0;

    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, `hsla(${h}, ${sat}%, ${Math.min(100, lit + 10)}%, 1)`);
    grad.addColorStop(0.35, `hsla(${h}, ${sat}%, ${lit}%, 0.85)`);
    grad.addColorStop(0.7, `hsla(${h}, ${sat}%, ${lit - 10}%, 0.35)`);
    grad.addColorStop(1, `hsla(${h}, ${sat}%, ${lit - 10}%, 0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, sizePx, sizePx);
    return c;
  };

  const buildSprites = (dpr: number) => {
    const sets: HTMLCanvasElement[][] = [];
    for (let p = 0; p < PALETTES.length; p++) {
      const hue = PALETTES[p];
      const levels: HTMLCanvasElement[] = [];
      for (let l = 0; l < LEVELS; l++) levels.push(makeSprite(hue, l, dpr));
      sets.push(levels);
    }
    spritesRef.current = sets;
  };

  // Resize + DPR clamp
  const doResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    dprRef.current = dpr;
    const w = Math.floor(window.innerWidth * dpr);
    const h = Math.floor(window.innerHeight * dpr);
    widthRef.current = w;
    heightRef.current = h;
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    // Rebuild sprites for new DPR
    buildSprites(dpr);
  }, []);

  // Spawn burst (returns spawned count)
  const spawnBurst = useCallback((cx: number, cy: number, count: number) => {
    const w = widthRef.current;
    const baseSpeed = 400; // px/s - maximum spread for edge-pushing
    for (let i = 0; i < count; i++) {
      const id = alloc();
      if (id < 0) break;
      const ang = Math.random() * Math.PI * 2;
      const spd = baseSpeed * (0.9 + Math.random() * 1.1); // 0.9x-2.0x
      px.current![id] = cx;
      py.current![id] = cy;
      vx.current![id] = Math.cos(ang) * spd;
      vy.current![id] = Math.sin(ang) * spd;
      life.current![id] = 1;
      decay.current![id] = 0.3 + Math.random() * 0.4; // per sec - slower decay for lingering
      // radius scaled by quality + DPR - smaller for delicate appearance
      const q = qualityRef.current;
      size.current![id] = (8 + Math.random() * 12) * (0.8 + 0.4 * q) * dprRef.current;
      pal.current![id] = (Math.random() * PALETTES.length) | 0;
      alive.current![id] = 1;
    }
  }, []);

  // Public API: celebrate
  const celebrate = useCallback(() => {
    const w = widthRef.current;
    const h = heightRef.current;
    if (!w || !h) return;
    // Burst at upper center with slight horizontal randomness
    const cx = w * 0.5 + (Math.random() - 0.5) * (w * 0.2);
    const cy = h * 0.32 + Math.random() * (h * 0.05);
    // Particle target ~350 scaled by quality for maximum burst volume
    const target = Math.floor(350 * qualityRef.current);
    spawnBurst(cx, cy, target);
  }, [spawnBurst]);

  useImperativeHandle(ref, () => ({ celebrate }));

  // Main loop
  useEffect(() => {
    initPool();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctxRef.current = ctx;
    doResize();

    let last = (lastTimeRef.current = performance.now());

    const loop = () => {
      const ctx = ctxRef.current!;
      const now = performance.now();
      let dt = (now - last) / 1000;
      last = now;
      // Clamp dt (tab switching etc.)
      if (dt > 0.05) dt = 0.05;

      // FPS measure
      framesRef.current++;
      accRef.current += dt;
      if (accRef.current >= 0.5) {
        const fps = framesRef.current / accRef.current;
        framesRef.current = 0;
        accRef.current = 0;
        if (fps < 55) qualityRef.current = Math.max(0.5, qualityRef.current - 0.08);
        else if (fps > 58)
          qualityRef.current = Math.min(1.0, qualityRef.current + 0.03);
      }

      // Motion blur (trail) over black - subtle for cleaner look
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
      ctx.fillRect(0, 0, widthRef.current, heightRef.current);

      // Update + draw particles
      ctx.globalCompositeOperation = "lighter";

      const damp = Math.pow(0.985, dt * 60); // per-sec damping
      const grav = 380 * dt; // px/s^2 - slower fall for extended view

      const sets = spritesRef.current;
      for (let i = 0; i < MAX; i++) {
        if (!alive.current![i]) continue;

        // physics
        vx.current![i] *= damp;
        vy.current![i] = vy.current![i] * damp + grav;
        px.current![i] += vx.current![i] * dt;
        py.current![i] += vy.current![i] * dt;
        life.current![i] -= decay.current![i] * dt;

        if (life.current![i] <= 0) {
          release(i);
          continue;
        }

        // choose sprite by palette + level from life
        const pidx = pal.current![i];
        const lv = Math.min(
          LEVELS - 1,
          Math.max(0, Math.floor((1 - life.current![i]) * LEVELS))
        );
        const sprite = sets[pidx][lv];
        const r = size.current![i];
        const x = px.current![i];
        const y = py.current![i];
        // Modulate alpha by life for fade-out
        ctx.globalAlpha = Math.max(0.05, life.current![i]);
        ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
      }

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(loop);
    };

    const onResize = () => doResize();
    window.addEventListener("resize", onResize);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      ctxRef.current = null;
    };
  }, [doResize]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-40 mix-blend-screen"
    />
  );
});
 

"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { Fireworks } from "@shun_god/fireworks-js-setlocation-react";
import type {
  FireworksHandlers,
  FireworksOptions,
} from "@shun_god/fireworks-js-setlocation-react";

interface SoundOptions {
  enabled?: boolean;
  files?: string[];
  volume?: { min?: number; max?: number };
}

interface FireworksOverlayProps {
  isActive: boolean;
  onComplete: () => void;
  /** Optional sentiment label to pick color scheme: "positive", "negative", etc. */
  sentimentLabel?: string | null;
  /** Accept either SoundOptions or a direct path (string) or array of paths */
  sound?: SoundOptions | string | string[];
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const getViewport = () => {
  if (typeof window === "undefined") {
    return { width: 1280, height: 720 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
};

const pickTarget = () => {
  const { width, height } = getViewport();
  const paddingX = Math.max(48, Math.round(width * 0.08));
  const paddingY = Math.max(96, Math.round(height * 0.12));
  const x =
    paddingX + Math.random() * Math.max(60, width - paddingX * 2);
  const y =
    paddingY +
    Math.random() * Math.max(80, Math.round(height * 0.45) - paddingY);
  return { x, y };
};

export function FireworksOverlay({
  isActive,
  onComplete,
  sentimentLabel = null,
  sound = undefined,
}: FireworksOverlayProps) {
  const fwRef = useRef<FireworksHandlers | null>(null);
  const runIdRef = useRef(0);

  // Map sentiment to hue ranges. Default is the earlier orange-ish range.
  const hueRange = useMemo(() => {
    const defaultHue = { min: 12, max: 42 };
    if (!sentimentLabel) return defaultHue;
    if (sentimentLabel === "positive") return { min: 18, max: 48 };
    if (sentimentLabel === "negative") return { min: 200, max: 245 };
    return { min: 120, max: 165 };
  }, [sentimentLabel]);

  // Normalize sound into the Fireworks shape.
  const normalizedSound: SoundOptions = useMemo(() => {
    if (!sound) return { enabled: false };
    if (typeof sound === "string") {
      return { enabled: true, files: [sound], volume: { min: 50, max: 80 } };
    }
    if (Array.isArray(sound)) {
      return { enabled: true, files: sound, volume: { min: 50, max: 80 } };
    }
    const volume = sound.volume ?? { min: 50, max: 80 };
    return {
      ...sound,
      volume: {
        min: clamp(
          typeof volume.min === "number" ? volume.min : 50,
          0,
          100
        ),
        max: clamp(
          typeof volume.max === "number" ? volume.max : 80,
          0,
          100
        ),
      },
    };
  }, [sound]);

  const baseOptions: FireworksOptions = useMemo(() => {
    const { width, height } = getViewport();
    return {
      hue: hueRange,
      launchAngle: { min: 70, max: 110 },
      burstDistance: Math.round(height * 0.55),
      rocketsPoint: { min: 38, max: 62 },
      autoresize: true,
      opacity: 0.32,
      acceleration: 1.02,
      friction: 0.985,
      gravity: 1.0,
      particles: 65,
      traceLength: 4,
      traceSpeed: 14,
      explosion: 6,
      intensity: 22,
      flickering: 35,
      lineStyle: "round",
      delay: { min: 70, max: 120 },
      lineWidth: {
        explosion: { min: 1, max: 3 },
        trace: { min: 1, max: 2 },
      },
      brightness: { min: 65, max: 85 },
      decay: { min: 0.02, max: 0.028 },
      mouse: { click: false, move: false, max: 0 },
      boundaries: {
        x: 32,
        y: 48,
        width,
        height,
        debug: false,
      },
      sound: normalizedSound,
    };
  }, [hueRange, normalizedSound]);

  useEffect(() => {
    if (!isActive) return;

    const fw = fwRef.current;
    if (!fw) {
      onComplete();
      return;
    }

    runIdRef.current += 1;
    const runId = runIdRef.current;
    let cancelled = false;

    const runSequence = async () => {
      const { width, height } = getViewport();

      // Keep the canvas in sync with the viewport while we run.
      fw.updateOptions({
        boundaries: {
          x: 32,
          y: 48,
          width,
          height,
          debug: false,
        },
        sound: normalizedSound,
        hue: hueRange,
      });

      const BURST_COUNT = 3;
      const BURST_DELAY = 180;

      for (let i = 0; i < BURST_COUNT; i += 1) {
        if (cancelled || runId !== runIdRef.current) return;

        const target = pickTarget();
        fw.updateOptions({
          target: { enabled: true, x: target.x, y: target.y },
        });
        fw.launch(1);

        if (i < BURST_COUNT - 1) {
          await sleep(BURST_DELAY);
        }
      }

      if (cancelled || runId !== runIdRef.current) return;
      await fw.waitStop();

      if (!cancelled && runId === runIdRef.current) {
        onComplete();
      }
    };

    void runSequence();

    return () => {
      cancelled = true;
      runIdRef.current += 1;
      fw.stop(true);
      fw.clear();
    };
  }, [hueRange, isActive, normalizedSound, onComplete]);

  if (typeof window === "undefined" || !isActive) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 pointer-events-none">
      <Fireworks
        ref={fwRef}
        autostart={false}
        options={baseOptions}
        style={{
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          position: "fixed",
          background: "transparent",
          zIndex: 9999,
        }}
      />
    </div>,
    document.body
  );
}

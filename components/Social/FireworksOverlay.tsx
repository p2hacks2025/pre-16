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
  trigger: number;
  /** Optional sentiment label to pick color scheme: "positive", "negative", etc. */
  sentimentLabel?: string | null;
  /** Accept either SoundOptions or a direct path (string) or array of paths */
  sound?: SoundOptions | string | string[];
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getViewport = () => {
  if (typeof window === "undefined") {
    return { width: 1280, height: 720 };
  }
  return { width: window.innerWidth, height: window.innerHeight };
};

const pickTarget = () => {
  const { width, height } = getViewport();
  const paddingY = Math.max(96, Math.round(height * 0.12));

  // Prefer a visible pending stack (mobile or desktop). Fallback to viewport center.
  const stacks = Array.from(
    document.querySelectorAll<HTMLElement>("[data-pending-stack]")
  );
  const visibleStack = stacks.find((el) => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
  const rect = visibleStack?.getBoundingClientRect();

  const centerX = rect ? rect.left + rect.width / 2 : width / 2;
  const y =
    paddingY +
    Math.random() * Math.max(80, Math.round(height * 0.45) - paddingY);

  return { x: centerX, y };
};

export function FireworksOverlay({
  trigger,
  sentimentLabel = null,
  sound = undefined,
}: FireworksOverlayProps) {
  const hueRange = useMemo(() => {
    const defaultHue = { min: 12, max: 42 };
    if (!sentimentLabel) return defaultHue;
    if (sentimentLabel === "positive") return { min: 18, max: 48 };
    if (sentimentLabel === "negative") return { min: 200, max: 245 };
    if (sentimentLabel === "neutral") return { min: 0, max: 360 }; // full random
    return defaultHue;
  }, [sentimentLabel]);

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
      rocketsPoint: { min: 50, max: 50 },
      launchAngle: { min: 80, max: 100 },
      burstDistance: Math.round(height * 0.75),
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

  const fwRef = useRef<FireworksHandlers | null>(null);
  const lastTriggerRef = useRef(0);

  useEffect(() => {
    if (trigger === 0) return;
    if (trigger === lastTriggerRef.current) return;

    let cancelled = false;
    lastTriggerRef.current = trigger;

    const launch = () => {
      if (cancelled) return;
      const fw = fwRef.current;
      if (!fw) {
        requestAnimationFrame(launch);
        return;
      }

      const { width, height } = getViewport();
      const { x: targetX } = pickTarget();
      const rocketsPoint = Math.max(0, Math.min(100, (targetX / width) * 100));

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
        rocketsPoint: { min: rocketsPoint, max: rocketsPoint },
        burstDistance: Math.round(height * 0.75),
        launchAngle: { min: 70, max: 110 },
      });

      fw.launch(1);
    };

    launch();

    return () => {
      cancelled = true;
    };
  }, [hueRange, normalizedSound, trigger]);

  if (typeof window === "undefined") return null;

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

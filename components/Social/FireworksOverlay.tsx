"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Fireworks } from "@shun_god/fireworks-js-setlocation-react";
import type { FireworksHandlers } from "@shun_god/fireworks-js-setlocation-react";

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

export function FireworksOverlay({
  isActive,
  onComplete,
  sentimentLabel = null,
  sound = undefined,
}: FireworksOverlayProps) {
  const fwRef = useRef<FireworksHandlers | null>(null);
  const burstDistance =
    typeof window !== "undefined" ? Math.round(window.innerHeight / 2) : 400;
  const rocketsPointValue = 33; // 画面左から約1/3の位置

  // Map sentiment to hue ranges. Default is the earlier orange-ish range.
  const defaultHue = { min: 12, max: 42 };
  const positiveHue = { min: 12, max: 42 };
  const negativeHue = { min: 200, max: 240 };
  const neutralHue = { min: 120, max: 160 };

  useEffect(() => {
    if (isActive) {
      console.log("FireworksOverlay active");
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1400); // 発射後すぐにクールダウン
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  // Decide hue range based on sentiment label
  const hue = (() => {
    if (!isActive) return defaultHue;
    if (!sentimentLabel) return defaultHue;
    if (sentimentLabel === "positive") return positiveHue;
    if (sentimentLabel === "negative") return negativeHue;
    return neutralHue;
  })();

  // Simple sound mapping: accept a direct path string, array of paths, or SoundOptions.
  const soundOptions: SoundOptions = (() => {
    if (!sound) return { enabled: false };
    if (typeof sound === "string") {
      return { enabled: true, files: [sound], volume: { min: 50, max: 80 } };
    }
    if (Array.isArray(sound)) {
      return { enabled: true, files: sound, volume: { min: 50, max: 80 } };
    }
    return sound as SoundOptions;
  })();

  useEffect(() => {
    const fw = fwRef.current;
    if (!fw || !isActive) return;
    console.log("FireworksOverlay ref", fw);
    fw.start();
    fw.clear();
    requestAnimationFrame(() => {
      fw.clear();
      fw.launch(1);
    });
    return () => {
      fw.stop(true);
      fw.clear();
    };
  }, [isActive]);

  if (typeof window === "undefined" || !isActive) return null;

  return createPortal(
    <div className="fixed inset-0 z-9999 pointer-events-none">
      <Fireworks ref={fwRef}
        options={{
          launchAngle: 90,
          burstDistance,
          autoresize: true,
          opacity: 0.35,
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
          hue: hue,
          delay: {
            min: 80,
            max: 120,
          },
          rocketsPoint: {
            min: rocketsPointValue,
            max: rocketsPointValue,
          },
          // Sound options (use direct prop or boolean-off default)
          sound: soundOptions,
          lineWidth: {
            explosion: {
              min: 1,
              max: 3,
            },
            trace: {
              min: 1,
              max: 2,
            },
          },
          brightness: {
            min: 65,
            max: 85,
          },
          decay: {
            min: 0.02,
            max: 0.028,
          },
          mouse: {
            click: false,
            move: false,
            max: 1,
          },
        }}
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

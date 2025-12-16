"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Fireworks } from "@fireworks-js/react";

interface FireworksOverlayProps {
  isActive: boolean;
  onComplete: () => void;
}

export function FireworksOverlay({
  isActive,
  onComplete,
}: FireworksOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isActive) {
      console.log("FireworksOverlay active");
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        onComplete();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  if (!mounted || !isActive) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* デバッグ用の可視レイヤー。これが見えない場合はポータル自体が描画されていない */}
      <div className="absolute inset-0 bg-red-500/15" />
      <div className="absolute top-4 left-4 z-[10000] text-white font-bold drop-shadow">
        FIREWORKS ACTIVE
      </div>
      <Fireworks
        options={{
          autoresize: true,
          opacity: 0.5,
          acceleration: 1.05,
          friction: 0.97,
          gravity: 1.5,
          particles: 50,
          traceLength: 3,
          traceSpeed: 10,
          explosion: 5,
          intensity: 30,
          flickering: 50,
          lineStyle: "round",
          hue: {
            min: 0,
            max: 360,
          },
          delay: {
            min: 30,
            max: 60,
          },
          rocketsPoint: {
            min: 50,
            max: 50,
          },
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
            min: 50,
            max: 80,
          },
          decay: {
            min: 0.015,
            max: 0.03,
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

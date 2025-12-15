"use client";

import React, { useEffect, useState } from "react";
import { useDroppable } from "@dnd-kit/core";

interface TrashBinProps {
  dropTrigger?: number; // Timestamp or incrementing ID to trigger effect
}

export function TrashBin({ dropTrigger }: TrashBinProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "trash-bin",
  });
  const [smoke, setSmoke] = useState<boolean>(false);

  const playSound = () => {
    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const t = ctx.currentTime;
      const duration = 1.0; // Shorter, sharper sound

      // Noise buffer for "hiss"
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // High frequency noise preferred
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Filter: Sharper hiss (High frequency start)
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass"; // Changed to bandpass for that specific "steam" sound
      filter.Q.value = 1;
      filter.frequency.setValueAtTime(3000, t); // Start high (hiss)
      filter.frequency.exponentialRampToValueAtTime(100, t + duration); // Drop fast

      // Gain: Sharp attack, sizzling tail
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.8, t + 0.05); // Attack
      gain.gain.exponentialRampToValueAtTime(0.01, t + duration); // Decay

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(t + duration);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    if (dropTrigger && dropTrigger > 0) {
      playSound();
      setSmoke(true);
      const timer = setTimeout(() => setSmoke(false), 2000); // 2s smoke duration
      return () => clearTimeout(timer);
    }
  }, [dropTrigger]);

  return (
    <div
      ref={setNodeRef}
      className={`fixed bottom-8 right-8 z-50 transition-all duration-300 ${
        isOver ? "scale-110" : "scale-100"
      }`}
    >
      <style>{`
        @keyframes flashy-smoke {
          0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
          10% { opacity: 0.8; }
          100% { transform: translate(-50%, -150px) scale(3); opacity: 0; }
        }
        .animate-flashy-smoke {
          animation: flashy-smoke 1.2s ease-out forwards;
        }
      `}</style>

      {/* Intense Smoke Particles */}
      {smoke && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-40 h-60 pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute bottom-0 left-1/2 w-10 h-10 rounded-full bg-white/60 blur-xl animate-flashy-smoke"
              style={{
                animationDelay: `${i * 0.05}s`,
                // Wider spread for flashiness
                transform: `translateX(${(((i * 37) % 20) - 10) * 8}px)`,
                backgroundColor:
                  i % 2 === 0
                    ? "rgba(255,255,255,0.6)"
                    : "rgba(200,220,255,0.4)", // White and slight blue smoke
              }}
            />
          ))}
        </div>
      )}

      {/* Water Bucket Visual */}
      <div className="relative group">
        {/* Bucket Handle (Visual) */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-12 border-t-4 border-l-2 border-r-2 border-zinc-400 rounded-t-full z-10 opacity-80" />

        {/* Bucket Body */}
        <div
          className={`relative w-20 h-20 bg-blue-900/40 backdrop-blur-md border-[3px] border-blue-400/50 rounded-b-xl rounded-t-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden transition-colors ${
            isOver
              ? "bg-blue-800/60 shadow-[0_0_30px_rgba(59,130,246,0.5)] border-blue-400"
              : ""
          }`}
        >
          {/* Water Level */}
          <div
            className={`absolute bottom-0 left-0 w-full bg-blue-500/60 transition-all duration-500 ${
              isOver ? "h-full animate-pulse" : "h-3/4"
            }`}
          >
            <div className="w-full h-full bg-gradient-to-t from-blue-700 to-transparent opacity-50" />
          </div>

          {/* Surface Reflection */}
          <div className="absolute top-2 left-2 w-full h-4 bg-white/10 skew-y-6 rounded-full blur-sm" />

          {/* Icon or Text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {!isOver && <span className="text-2xl opacity-50">💧</span>}
            {isOver && <span className="text-3xl animate-bounce">🔥</span>}
          </div>
        </div>
      </div>

      {isOver && (
        <p className="absolute -top-8 left-1/2 -translate-x-1/2 text-blue-300 font-bold whitespace-nowrap drop-shadow-md bg-black/60 px-2 py-1 rounded text-xs border border-blue-500/30">
          水に入れる (Douse)
        </p>
      )}
    </div>
  );
}

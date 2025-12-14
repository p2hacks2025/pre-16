"use client";

import React from "react";
import { Camera, Image as ImageIcon, Flame, ShieldCheck } from "lucide-react";

interface IntroductionProps {
  onStart: () => void;
}

export function Introduction({ onStart }: IntroductionProps) {
  return (
    <div className="flex flex-col items-center gap-8 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-6">
        <div className="relative inline-block">
          <Flame className="w-24 h-24 text-orange-500 animate-pulse" />
          <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full -z-10 animate-pulse"></div>
        </div>

        <h2 className="text-4xl font-bold">Welcome to HANABI</h2>
        <p className="text-xl text-white/70 max-w-2xl leading-relaxed">
          The ultimate AI-powered playground where you can breathe fire. Upload
          a photo or turn on your camera to unleash the dragon within.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <ImageIcon className="w-10 h-10 text-blue-400 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Photo Mode</h3>
          <p className="text-white/60 mb-4">
            Upload any image. Our AI detects faces automatically. For creatures
            and pets, you can manually pinpoint the nose to start the fire.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <Camera className="w-10 h-10 text-green-400 mb-4" />
          <h3 className="text-2xl font-bold mb-2">Real-time AR</h3>
          <p className="text-white/60 mb-4">
            Use your webcam for a live augmented reality experience. The fire
            effect tracks your movements in real-time.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-white/40 mt-4 bg-white/5 px-4 py-2 rounded-full">
        <ShieldCheck size={16} />
        <span>
          Privacy First: All AI processing happens locally in your browser. No
          images are sent to any server.
        </span>
      </div>

      <button
        onClick={onStart}
        className="px-10 py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-lg shadow-orange-500/30"
      >
        Get Started
      </button>
    </div>
  );
}

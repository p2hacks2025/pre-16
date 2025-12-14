"use client";

import React, { useEffect, useRef, useState } from "react";
import { useFireParticles, Point } from "@/hooks/useFireParticles";

interface FireBreatherProps {
  imageSrc: string;
  onBack: () => void;
}

export function FireBreather({ imageSrc, onBack }: FireBreatherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<
    "loading" | "detecting" | "ready" | "manual"
  >("loading");
  const [nosePos, setNosePos] = useState<Point | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const requestRef = useRef<number | null>(null);

  // Hook for particles
  const { emitParticles, updateAndDrawParticles, clearParticles } =
    useFireParticles();

  // 1. Initialize Image and Models
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const faceapi = await import("face-api.js");

        // Load Image
        const img = new Image();
        img.src = imageSrc;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        if (!isMounted) return;
        setImgElement(img);

        // Load Models
        const MODEL_URL =
          "https://justadudewhohacks.github.io/face-api.js/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

        if (!isMounted) return;
        setStatus("detecting");

        // Detect Face
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detection) {
          const nose = detection.landmarks.getNose()[6];
          setNosePos({ x: nose.x, y: nose.y });
          setStatus("ready");
        } else {
          setStatus("manual");
        }
      } catch (error) {
        console.error("Initialization failed:", error);
        setStatus("manual");
      }
    };

    init();
    clearParticles(); // Clear old particles on new image
    return () => {
      isMounted = false;
    };
  }, [imageSrc, clearParticles]);

  // 2. Handle Canvas Rendering & Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgElement || !containerRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgElement, 0, 0);

      if (nosePos) {
        emitParticles(nosePos, 5);
      }

      updateAndDrawParticles(ctx);

      if (status === "manual" && !nosePos) {
        // Visual hint logic could go here
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [imgElement, nosePos, status, emitParticles, updateAndDrawParticles]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if ((status === "manual" || status === "ready") && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      setNosePos({ x, y });
      setStatus("ready");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div
        className="relative w-full max-w-4xl flex justify-center"
        ref={containerRef}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className={`max-h-[70vh] w-auto border-2 border-white/20 rounded-lg shadow-2xl cursor-crosshair`}
          style={{ maxWidth: "100%" }}
        />

        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
            <div className="text-xl font-bold animate-pulse text-orange-400">
              Loading AI Models...
            </div>
          </div>
        )}
        {status === "detecting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
            <div className="text-xl font-bold animate-pulse text-blue-400">
              Detecting Face...
            </div>
          </div>
        )}
        {status === "manual" && !nosePos && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 px-6 py-2 rounded-full text-white pointer-events-none backdrop-blur-md border border-white/10">
            Click on the nose to start! 👆
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          Upload New Image
        </button>
        {status === "ready" && (
          <button
            onClick={() => setNosePos(null)}
            className="px-6 py-2 rounded-full border border-orange-500/50 text-orange-200 hover:bg-orange-500/20 transition-colors"
          >
            Reset Position
          </button>
        )}
      </div>
    </div>
  );
}

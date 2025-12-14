"use client";

import React, { useEffect, useRef, useState } from "react";
import { useFireParticles } from "@/hooks/useFireParticles";
import { VideoOff } from "lucide-react";

export function RealTimeFire() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"initializing" | "running" | "error">(
    "initializing"
  );
  const [debugMsg, setDebugMsg] = useState<string>("");

  const { emitParticles, updateAndDrawParticles } = useFireParticles();
  const requestRef = useRef<number | null>(null);
  const faceApiRef = useRef<any>(null); // Store face-api instance
  const frameCountRef = useRef(0); // For throttling detection

  // 1. Setup Camera and Models
  useEffect(() => {
    let isMounted = true;
    let stream: MediaStream | null = null;

    const setup = async () => {
      try {
        const faceapi = await import("face-api.js");
        faceApiRef.current = faceapi;

        const MODEL_URL =
          "https://justadudewhohacks.github.io/face-api.js/models";

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);

        if (!isMounted) return;

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Ensure video plays inline
          videoRef.current.setAttribute("playsinline", "true");

          videoRef.current.onloadedmetadata = () => {
            if (isMounted) {
              videoRef.current
                ?.play()
                .catch((e) => console.error("Play error:", e));
              setIsCameraReady(true);
              setStatus("running");
            }
          };
        }
      } catch (err: any) {
        console.error(err);
        if (isMounted) {
          setError(`Camera/AI Error: ${err.message || err}`);
          setStatus("error");
        }
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. Detection & Rendering Loop
  useEffect(() => {
    if (
      !isCameraReady ||
      !videoRef.current ||
      !canvasRef.current ||
      !faceApiRef.current
    )
      return;

    const faceapi = faceApiRef.current;

    // TinyDetector options - lower threshold for easier detection, smaller size for speed
    const detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.3,
    });

    const detectAndDraw = async () => {
      if (
        !videoRef.current ||
        !canvasRef.current ||
        videoRef.current.paused ||
        videoRef.current.ended
      ) {
        requestRef.current = requestAnimationFrame(detectAndDraw);
        return;
      }

      // Match canvas size to video
      if (canvasRef.current.width !== videoRef.current.videoWidth) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      }

      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      const ctx = canvasRef.current.getContext("2d");
      if (!ctx) return;

      // Draw Video Background (Mirrored)
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, width, height);
      ctx.restore();

      // Detect Face (Throttled: every 3rd frame to save CPU)
      frameCountRef.current++;
      if (frameCountRef.current % 3 === 0) {
        try {
          // Detect on video element
          const detection = await faceapi
            .detectSingleFace(videoRef.current, detectorOptions)
            .withFaceLandmarks();

          if (detection) {
            const nose = detection.landmarks.getNose()[6];
            // Adjust nose x for mirroring
            const mirroredX = width - nose.x;

            // Emit particles
            emitParticles({ x: mirroredX, y: nose.y }, 3); // Emit fewer but more often if we detect fast? No, burst emit.

            setDebugMsg("Face Detected");
          } else {
            setDebugMsg("Searching...");
          }
        } catch (e) {
          console.warn("Detection error", e);
        }
      }

      // Draw Particles
      updateAndDrawParticles(ctx);

      // Draw Debug Info
      /*
         ctx.font = '16px monospace';
         ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
         ctx.fillText(debugMsg, 10, 20);
         */

      requestRef.current = requestAnimationFrame(detectAndDraw);
    };

    requestRef.current = requestAnimationFrame(detectAndDraw);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isCameraReady, emitParticles, updateAndDrawParticles]);

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-red-500/30 bg-red-500/10 rounded-xl">
        <VideoOff className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black">
      {/* Hidden Video element for source */}
      <video ref={videoRef} muted autoPlay playsInline className="hidden" />

      {/* Canvas for display */}
      <canvas ref={canvasRef} className="w-full h-auto block" />

      {/* Status Overlay */}
      <div className="absolute top-4 left-4 pointer-events-none">
        {debugMsg === "Searching..." && (
          <div className="bg-yellow-500/50 px-3 py-1 rounded-full text-xs text-white backdrop-blur-sm border border-yellow-300/30 animate-pulse">
            🔍 Searching for nose...
          </div>
        )}
        {debugMsg === "Face Detected" && (
          <div className="bg-green-500/50 px-3 py-1 rounded-full text-xs text-white backdrop-blur-sm border border-green-300/30">
            ✅ Nose Linked
          </div>
        )}
      </div>

      {!isCameraReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <p className="text-blue-400 animate-pulse font-bold">
            Initializing Camera & AI...
          </p>
        </div>
      )}

      <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-xs text-white/50 border border-white/10 backdrop-blur-sm">
        Real-time Face Tracking
      </div>
    </div>
  );
}

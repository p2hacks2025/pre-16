"use client";

import React, { useEffect, useRef, useState } from "react";
import { useFireParticles } from "@/hooks/useFireParticles";
import { VideoOff } from "lucide-react";

export function RealTimeFire() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "initializing" | "running" | "error"
  >("idle");
  const [debugMsg, setDebugMsg] = useState<string>("");

  const { emitParticles, updateAndDrawParticles } = useFireParticles();
  const requestRef = useRef<number | null>(null);
  const faceApiRef = useRef<unknown>(null); // Store face-api instance
  const frameCountRef = useRef(0); // For throttling detection

  // 1. Setup Camera and Models
  const startCamera = async () => {
    setStatus("initializing");
    let stream: MediaStream | null = null;

    try {
      const faceapi = await import("face-api.js");
      faceApiRef.current = faceapi;

      const MODEL_URL =
        "https://justadudewhohacks.github.io/face-api.js/models";

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);

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
          if (videoRef.current) {
            // Check if ref is still valid
            videoRef.current
              ?.play()
              .catch((e) => console.error("Play error:", e));
            setIsCameraReady(true);
            setStatus("running");
          }
        };
      }
    } catch (err: unknown) {
      console.error(err);

      const hasName = (e: unknown): e is { name: string } =>
        typeof e === "object" && e !== null && "name" in e && typeof (e as any).name === "string";

      const getMessage = (e: unknown): string =>
        typeof e === "object" && e !== null && "message" in e && typeof (e as any).message === "string"
          ? (e as any).message
          : "Unknown error";

      if (hasName(err) && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
        setError(
          "カメラのアクセスが拒否されました。ブラウザの設定でカメラを許可して、再試行してください。"
        );
      } else if (hasName(err) && (err.name === "NotFoundError" || err.name === "DevicesNotFoundError")) {
        setError("カメラが見つかりません。");
      } else {
        setError(`カメラエラー: ${getMessage(err)}`);
      }
      setStatus("error");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const videoEl = videoRef.current;
      if (videoEl && videoEl.srcObject) {
        const stream = videoEl.srcObject as MediaStream;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const faceapi = faceApiRef.current as any;

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
      requestRef.current = requestAnimationFrame(detectAndDraw);
    };

    requestRef.current = requestAnimationFrame(detectAndDraw);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isCameraReady, emitParticles, updateAndDrawParticles]);

  if (status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-white/10 bg-black rounded-xl h-[400px]">
        <h3 className="text-xl font-bold text-white mb-6">
          Real-time Fire Camera
        </h3>
        <p className="text-white/60 mb-8 max-w-md">
          カメラを使用して、あなたの顔に合わせて炎のエフェクトを表示します。
          <br />
          カメラの使用を許可してください。
        </p>
        <button
          onClick={startCamera}
          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full font-bold hover:from-orange-400 hover:to-red-500 transition-all shadow-lg hover:shadow-orange-500/25"
        >
          カメラを開始する
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-red-500/30 bg-red-500/10 rounded-xl h-[400px]">
        <VideoOff className="w-16 h-16 text-red-500 mb-6" />
        <h3 className="text-xl font-bold text-red-400 mb-2">Camera Error</h3>
        <p className="text-red-200 mb-6 max-w-md">{error}</p>
        <button
          onClick={() => setStatus("idle")}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold transition-colors"
        >
          戻る
        </button>
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

      {status === "initializing" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-orange-400 font-bold animate-pulse">
              Starting Camera & Loading AI...
            </p>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-xs text-white/50 border border-white/10 backdrop-blur-sm">
        Real-time Face Tracking
      </div>
    </div>
  );
}

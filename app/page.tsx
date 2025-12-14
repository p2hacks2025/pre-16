"use client";

import { useState } from "react";
import { UploadMode } from "@/components/UploadMode";
import { RealTimeFire } from "@/components/RealTimeFire";
import { Introduction } from "@/components/Introduction";
import { SocialTab } from "@/components/Social/SocialTab";
import { Login } from "@/components/Login";
import { useAuth } from "@/hooks/useAuth";
import { Camera, Image as ImageIcon, Info, Users } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "intro" | "social" | "upload" | "camera" | "login"
  >("intro");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0a0a0a] text-white selection:bg-orange-500/30">
      <div className="max-w-4xl w-full flex flex-col items-center gap-12">
        <header className="text-center space-y-4">
          <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 bg-clip-text text-transparent animate-gradient">
            HANABI
          </h1>
          {activeTab !== "intro" && (
            <p className="text-xl text-white/60 font-light animate-in fade-in">
              Ignite your world with AI
            </p>
          )}
        </header>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("intro")}
            className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 ${activeTab === "intro"
                ? "bg-white/10 text-white shadow-lg"
                : "text-white/40 hover:text-white/70"
              }`}
          >
            <Info size={18} />
            <span className="font-medium whitespace-nowrap">About</span>
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 ${activeTab === "social"
                ? "bg-white/10 text-white shadow-lg"
                : "text-white/40 hover:text-white/70"
              }`}
          >
            <Users size={18} />
            <span className="font-medium whitespace-nowrap">Community</span>
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 ${activeTab === "upload"
                ? "bg-white/10 text-white shadow-lg"
                : "text-white/40 hover:text-white/70"
              }`}
          >
            <ImageIcon size={18} />
            <span className="font-medium whitespace-nowrap">Photo Upload</span>
          </button>
          <button
            onClick={() => setActiveTab("camera")}
            className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 ${activeTab === "camera"
                ? "bg-white/10 text-white shadow-lg"
                : "text-white/40 hover:text-white/70"
              }`}
          >
            <Camera size={18} />
            <span className="font-medium whitespace-nowrap">
              Real-time Camera
            </span>
          </button>
          <button
            onClick={() => setActiveTab("login")}
            className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 ${activeTab === "login"
                ? "bg-white/10 text-white shadow-lg"
                : "text-white/40 hover:text-white/70"
              }`}
          >
            <span className="font-medium whitespace-nowrap">
              Login
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="w-full flex justify-center min-h-[400px]">
          {activeTab === "intro" && (
            <Introduction onStart={() => setActiveTab("upload")} />
          )}
          {activeTab === "social" && (
            loading ? (
              <div className="text-white/70">Checking auth...</div>
            ) : user ? (
              <SocialTab />
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-white/70">
                  Community を見るにはログインしてください。
                </p>
                <Login />
              </div>
            )
          )}
          {activeTab === "upload" && <UploadMode />}
          {activeTab === "camera" && <RealTimeFire />}
          {activeTab === "login" && <Login />}
        </div>
      </div>
    </main>
  );
}

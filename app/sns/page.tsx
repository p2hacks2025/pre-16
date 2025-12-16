"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Social/Sidebar";

import { SocialTab } from "@/components/Social/SocialTab";
import { useAuth } from "@/hooks/useAuth";
import { Login } from "@/components/Login";
import { X } from "lucide-react";

import { useSearchParams, useRouter } from "next/navigation";
import { ProfileSettings } from "@/components/ProfileSettings";
import { useProfile } from "@/hooks/useProfile";

// ... existing imports ...

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"everyone" | "solo">("everyone");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const { user, loading } = useAuth();
  const { profile, updateProfile } = useProfile(user);

  const searchParams = useSearchParams();
  const isSettingsOpen = searchParams.get("tab") === "settings";
  const router = useRouter();

  const handleCloseSettings = () => {
    // Remove tab param by replacing (to avoid history stack buildup if desired, or push to root /sns)
    router.replace("/sns");
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/70">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center relative">
      {/* Settings Modal (Popup) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl">
            <button
              onClick={handleCloseSettings}
              className="absolute -top-12 right-0 md:-right-12 text-white/50 hover:text-white transition-colors"
            >
              <X size={32} />
            </button>
            {user ? (
              <ProfileSettings profile={profile} onSave={updateProfile} />
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                <p>ログインしてください</p>
                <button
                  onClick={() => {
                    handleCloseSettings();
                    setShowLoginPrompt(true);
                  }}
                  className="mt-4 px-6 py-2 bg-white text-black rounded-full font-bold"
                >
                  ログイン画面へ
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Login Prompt for Guests */}
      {!user && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-orange-500/90 to-red-600/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-w-sm shadow-lg animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <p className="font-semibold text-white">
                さらに楽しむにはログイン
              </p>
              <p className="text-sm text-white/90">
                返信やいいねなどの機能を使用できます
              </p>
              <button
                onClick={() => setShowLoginPrompt(true)}
                className="mt-2 px-4 py-1.5 bg-white text-black font-bold rounded-full text-sm hover:bg-white/90 transition-colors"
              >
                ログイン
              </button>
            </div>
            <button
              onClick={() => setShowLoginPrompt(true)}
              className="text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginPrompt && !user && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">ログイン</h2>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <Login />
          </div>
        </div>
      )}

      <div className="flex w-full">
        {/* Left Sidebar */}
        <Sidebar
          onPostClick={() =>
            user ? setShowCompose(!showCompose) : setShowLoginPrompt(true)
          }
        />

        {/* Center Spacer (pushes feed to right) */}
        <div className="hidden lg:block flex-1 border-r border-white/10" />

        {/* Main Feed (Moved to Right) */}
        <main className="w-full lg:w-[600px] lg:flex-none border-l border-white/20 min-h-screen relative">
          <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-white/20">
            <div className="flex w-full">
              <div
                onClick={() => setActiveTab("everyone")}
                className={`flex-1 hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2 py-4 cursor-pointer relative group ${
                  activeTab === "everyone"
                    ? ""
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {activeTab === "everyone" && (
                  <div className="w-2 h-2 bg-gradient-to-tr from-orange-500 to-red-600 rotate-45 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                )}
                <span
                  className={`font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ${
                    activeTab === "everyone" ? "text-white" : ""
                  }`}
                >
                  みんな
                </span>
                {activeTab === "everyone" && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-600 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
                )}
              </div>

              <div
                onClick={() => setActiveTab("solo")}
                className={`flex-1 hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-2 py-4 cursor-pointer relative group ${
                  activeTab === "solo"
                    ? ""
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {activeTab === "solo" && (
                  <div className="w-2 h-2 bg-gradient-to-tr from-cyan-400 to-blue-500 rotate-45 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                )}
                <span
                  className={`font-medium drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ${
                    activeTab === "solo" ? "text-white font-bold" : ""
                  }`}
                >
                  おひとり
                </span>
                {activeTab === "solo" && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                )}
              </div>
            </div>
          </div>

          <div className="pb-20">
            <div className="p-4">
              <SocialTab tab={activeTab} showCompose={showCompose} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Social/Sidebar";

import { SocialTab } from "@/components/Social/SocialTab";
import { useAuth } from "@/hooks/useAuth";
import { Login } from "@/components/Login";
import { X } from "lucide-react";

import { useSearchParams, useRouter } from "next/navigation";
import { ProfileSettings } from "@/components/ProfileSettings";
import { useProfile } from "@/hooks/useProfile";
import { PostCard, PostData } from "@/components/Social/PostCard";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import type { AutoAnimationPlugin } from "@formkit/auto-animate";

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<"everyone" | "solo">("everyone");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const { user, loading } = useAuth();
  const { profile, updateProfile } = useProfile(user);

  // Pending posts state for animation in left column (Array)
  const [pendingPosts, setPendingPosts] = useState<PostData[]>([]);

  // Smooth animation for list sorting/removal - Custom config to prevent flicker
  const customAnimationPlugin: AutoAnimationPlugin = (
    el,
    action,
    newCoords,
    oldCoords
  ) => {
    // New items: let CSS (.animate-broadcast) handle the entry
    if (action === "add") {
      return new KeyframeEffect(el, [], { duration: 0 });
    }
    // Removed items: Kill visibility immediately to prevent CSS animation restart
    // Return small duration to ensure 'remain' callback is triggered for siblings
    if (action === "remove") {
      (el as HTMLElement).style.opacity = "0";
      return new KeyframeEffect(el, [{ opacity: 0 }], { duration: 10 });
    }
    // Remaining items: Slide them to their new position (e.g. up)
    if (action === "remain") {
      if (!oldCoords || !newCoords) {
        return new KeyframeEffect(el, [], { duration: 0 });
      }
      const deltaX = oldCoords.left - newCoords.left;
      const deltaY = oldCoords.top - newCoords.top;
      const start = { transform: `translate(${deltaX}px, ${deltaY}px)` };
      const end = { transform: `translate(0, 0)` };
      // Slower duration + smooth easing for 'null-to' feel
      return new KeyframeEffect(el, [start, end], {
        duration: 500,
        easing: "cubic-bezier(0.25, 0.8, 0.25, 1)",
      });
    }
    return new KeyframeEffect(el, [], { duration: 0 });
  };

  const [animationParent] = useAutoAnimate<HTMLElement>(customAnimationPlugin);

  const searchParams = useSearchParams();
  const isSettingsOpen = searchParams.get("tab") === "settings";
  const router = useRouter();

  const handleCloseSettings = () => {
    // Remove tab param by replacing
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

  const handleComposeClick = () => {
    if (user) {
      setShowCompose((prev) => !prev);
    } else {
      setShowLoginPrompt(true);
    }
  };

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
        <div className="fixed top-24 sm:top-28 right-3 sm:right-4 z-40 bg-gradient-to-r from-orange-500/90 to-red-600/90 backdrop-blur-sm border border-white/20 rounded-lg p-3 sm:p-4 max-w-sm shadow-lg animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <p className="font-semibold text-white text-sm sm:text-base">
                さらに楽しむにはログイン
              </p>
              <p className="text-xs sm:text-sm text-white/90">
                返信やいいねなどの機能を使用できます
              </p>
              <button
                onClick={() => setShowLoginPrompt(true)}
                className="mt-2 px-3 py-1 sm:px-4 sm:py-1.5 bg-white text-black font-bold rounded-full text-xs sm:text-sm hover:bg-white/90 transition-colors"
              >
                ログイン
              </button>
            </div>
            <button
              onClick={() => setShowLoginPrompt(true)}
              className="text-white/60 hover:text-white flex-shrink-0"
            >
              <X size={18} className="sm:hidden" />
              <X size={20} className="hidden sm:block" />
            </button>
          </div>
        </div>
      )}

      <div className="lg:hidden fixed bottom-4 left-4 z-50">
        {user ? (
          <Link
            href="/?tab=settings"
            className="relative flex h-12 w-12 aspect-square items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-[0_0_12px_rgba(0,0,0,0.4)] transition-colors hover:border-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
          >
            <span className="sr-only">プロフィール設定</span>
            <div className="flex h-full w-full items-center justify-center p-1">
              {profile?.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div
                  className={`h-full w-full rounded-full bg-gradient-to-tr ${
                    profile?.avatarGradient || "from-blue-500 to-purple-600"
                  }`}
                />
              )}
            </div>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setShowLoginPrompt(true)}
            className="relative flex h-12 w-12 aspect-square items-center justify-center rounded-full border border-white/20 bg-black/60 text-white shadow-[0_0_12px_rgba(0,0,0,0.4)] transition-colors hover:border-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
          >
            <span className="sr-only">ログイン</span>
            <div className="flex h-full w-full items-center justify-center p-1">
              <div className="h-full w-full rounded-full bg-white/10" />
            </div>
          </button>
        )}
      </div>

      {/* Login Modal */}
      {showLoginPrompt && !user && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/20 rounded-2xl p-4 sm:p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold">ログイン</h2>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="text-white/40 hover:text-white"
              >
                <X size={20} className="sm:hidden" />
                <X size={24} className="hidden sm:block" />
              </button>
            </div>
            <Login />
          </div>
        </div>
      )}

      <div className="flex w-full">
        {/* Left Sidebar */}
        <Sidebar onPostClick={handleComposeClick} />

        {/* Center Spacer / Pending Post Stage (Between Sidebar and Main Feed) 
            Adjusted to top-left align with padding to match "below Ignite button"
        */}
        <div
          ref={animationParent}
          className="hidden lg:flex flex-1 border-r border-white/10 flex-col items-center justify-start pt-[280px] relative gap-6"
        >
          {pendingPosts.length > 0 ? (
            <>
              {pendingPosts.map((post) => (
                <div key={post.id} className="w-full max-w-md">
                  {/* Inner wrapper handles the visual animation, isolated from layout shifts */}
                  <div className="w-full animate-broadcast">
                    <PostCard post={post} onLoginRequired={() => {}} />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-white/10 w-full h-full flex flex-col items-center justify-center select-none pb-[280px]">
              <div className="text-8xl mb-4 opacity-50 grayscale">🌋</div>
              <div className="text-sm tracking-[0.2em] font-light">
                NO SIGNAL
              </div>
            </div>
          )}
        </div>

        {/* Main Feed (Right Side) */}
        <main className="w-full lg:w-[600px] lg:flex-none border-l border-white/20 min-h-screen relative">
          <div className="lg:hidden sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-sm">
            <Link
              href="/"
              className="m-3 flex items-center justify-center text-3xl font-black tracking-tight text-transparent bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 bg-clip-text drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]"
            >
              HANABI
            </Link>
          </div>

          <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-white/20">
            <div className="flex w-full">
              <div
                onClick={() => setActiveTab("everyone")}
                className={`flex-1 hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 cursor-pointer relative group ${
                  activeTab === "everyone"
                    ? ""
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {activeTab === "everyone" && (
                  <div className="w-2 h-2 bg-gradient-to-tr from-orange-500 to-red-600 rotate-45 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                )}
                <span
                  className={`font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] text-sm sm:text-base ${
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
                className={`flex-1 hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 cursor-pointer relative group ${
                  activeTab === "solo"
                    ? ""
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {activeTab === "solo" && (
                  <div className="w-2 h-2 bg-gradient-to-tr from-cyan-400 to-blue-500 rotate-45 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                )}
                <span
                  className={`font-medium drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] text-sm sm:text-base ${
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
            <div className="p-3 sm:p-4">
              <SocialTab
                tab={activeTab}
                showCompose={showCompose}
                onComposeClick={handleComposeClick}
                onPendingPostsChange={setPendingPosts}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

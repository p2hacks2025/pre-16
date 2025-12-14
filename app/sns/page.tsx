"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Social/Sidebar";
import { Widgets } from "@/components/Social/Widgets";
import { SocialTab } from "@/components/Social/SocialTab";
import { PostModal } from "@/components/Social/PostModal";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Login } from "@/components/Login";
import { X } from "lucide-react";

export default function CommunityPage() {
  const [isPostModalOpen, setPostModalOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { user, loading } = useAuth();
  const { profile } = useProfile(user);

  const handlePost = () => {
    // Optionally trigger a refresh or just rely on Firestore listener in SocialTab
    console.log("Post created");
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
    <div className="min-h-screen bg-black text-white flex justify-center">
      {/* Login Prompt for Guests */}
      {!user && (
        <div className="fixed top-4 right-4 z-50 bg-gradient-to-r from-orange-500/90 to-red-600/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 max-w-sm shadow-lg animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1">
              <p className="font-semibold text-white">さらに楽しむにはログイン</p>
              <p className="text-sm text-white/90">返信やいいねなどの機能を使用できます</p>
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

      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => setPostModalOpen(false)}
        userProfile={profile}
        onPost={handlePost}
      />

      <div className="flex w-full">
        {/* Left Sidebar */}
        <Sidebar onPostClick={() => user ? setPostModalOpen(true) : setShowLoginPrompt(true)} />

        {/* Main Feed (Center) */}
        <main className="flex-1 w-full border-x border-white/20 min-h-screen">
          <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-white/20">
            <div className="flex w-full">
              <div className="flex-1 hover:bg-white/10 transition-colors flex items-center justify-center gap-2 py-4 cursor-pointer relative">
                <div className="w-2 h-2 bg-gradient-to-tr from-orange-500 to-red-600 rotate-45" />
                <span className="font-bold text-white">おすすめ</span>
              </div>
              <div className="flex-1 hover:bg-white/10 transition-colors text-center py-4 text-white/50 font-medium cursor-pointer">
                フレンド
              </div>
            </div>
          </div>

          <div className="pb-20">
            <div className="p-4">
              <SocialTab />
            </div>
          </div>
        </main>

        {/* Right Widgets */}
        <Widgets />
      </div>
    </div>
  );
}

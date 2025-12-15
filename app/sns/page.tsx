"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Social/Sidebar";
import { Widgets } from "@/components/Social/Widgets";
import { SocialTab } from "@/components/Social/SocialTab";
import { PostModal } from "@/components/Social/PostModal";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export default function CommunityPage() {
  const [isPostModalOpen, setPostModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"everyone" | "solo">("everyone");
  const { user } = useAuth();
  const { profile } = useProfile(user);

  const handlePost = () => {
    // Optionally trigger a refresh or just rely on Firestore listener in SocialTab
    console.log("Post created");
  };

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => setPostModalOpen(false)}
        userProfile={profile}
        onPost={handlePost}
      />

      <div className="flex w-full">
        {/* Left Sidebar */}
        <Sidebar onPostClick={() => setPostModalOpen(true)} />

        {/* Main Feed (Center) */}
        <main className="flex-1 w-full border-x border-white/20 min-h-screen">
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
              <SocialTab tab={activeTab} />
            </div>
          </div>
        </main>

        {/* Right Widgets */}
        <Widgets />
      </div>
    </div>
  );
}

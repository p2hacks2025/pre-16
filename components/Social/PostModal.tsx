"use client";

import React from "react";
import { CreatePost } from "./CreatePost";
import { PostData } from "./PostCard";
import { UserProfile } from "@/hooks/useProfile";
import { X } from "lucide-react";

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onPost: (newPost: PostData) => void;
}

export function PostModal({
  isOpen,
  onClose,
  userProfile,
  onPost,
}: PostModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-black border border-white/20 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 p-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mt-6">
          <CreatePost
            userProfile={userProfile}
            onPost={(post) => {
              onPost(post);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

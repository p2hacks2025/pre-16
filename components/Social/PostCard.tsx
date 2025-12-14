"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface PostData {
  id: string;
  author: string;
  avatar: string; // Gradient classes or placeholder
  photoURL?: string; // User's custom avatar image URL
  content: string;
  image?: string; // Data URL
  timestamp: number;
  likes: number;
}

interface PostCardProps {
  post: PostData;
}

export function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLike = () => {
    if (liked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
    }
    setLiked(!liked);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteDoc(doc(db, "posts", post.id));
      // No need to update state manually, SocialTab listener handles it
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post.");
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-xl overflow-visible hover:bg-white/[0.07] transition-colors relative">
      <div className="p-4 flex gap-4">
        {/* Avatar */}
        {post.photoURL ? (
          <img
            src={post.photoURL}
            alt={post.author}
            className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-tr ${post.avatar} flex items-center justify-center text-white font-bold text-sm`}
          >
            {post.author[0]}
          </div>
        )}

        <div className="flex-1 space-y-2 min-w-0">
          {/* Header */}
          <div className="flex justify-between items-start relative">
            <div className="flex items-center gap-2">
              <span className="font-bold">{post.author}</span>
              <span className="text-white/40 text-sm">
                @{post.author.toLowerCase().replace(" ", "")}
              </span>
              <span className="text-white/40 text-sm">
                · {formatDate(post.timestamp)}
              </span>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <MoreHorizontal size={18} />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-black border border-white/20 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-4 py-3 text-red-500 hover:bg-white/10 flex items-center gap-2 text-sm font-bold"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <p className="text-white/90 whitespace-pre-wrap break-words">
            {post.content}
          </p>

          {/* Image Attachment */}
          {post.image && (
            <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
              <img
                src={post.image}
                alt="Post content"
                className="w-full h-auto max-h-[400px] object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-2 text-white/50 max-w-sm">
            <button className="flex items-center gap-2 hover:text-blue-400 group transition-colors">
              <MessageCircle
                size={18}
                className="group-hover:bg-blue-500/10 p-1 box-content rounded-full"
              />
              <span className="text-xs">Reply</span>
            </button>
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 group transition-colors ${
                liked ? "text-pink-500" : "hover:text-pink-500"
              }`}
            >
              <Heart
                size={18}
                className={`group-hover:bg-pink-500/10 p-1 box-content rounded-full transition-transform ${
                  liked ? "fill-current scale-110" : ""
                }`}
              />
              <span className="text-xs">{likeCount}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-green-400 group transition-colors">
              <Share2
                size={18}
                className="group-hover:bg-green-500/10 p-1 box-content rounded-full"
              />
              <span className="text-xs">Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useAuth } from "@/hooks/useAuth";

export interface Attachment {
  url: string;
  type: string; // MIME type
  name: string;
  size: number;
}

export interface PostData {
  id: string;
  author: string;
  authorId?: string;
  visibility?: "public" | "private";
  avatar: string; // Gradient classes or placeholder
  photoURL?: string; // User's custom avatar image URL
  content: string;
  image?: string; // Legacy field for backward compatibility
  attachment?: Attachment;
  sentiment?: {
    score: number;
    label: "positive" | "negative" | "neutral";
  };
  timestamp: number;
  likes: number;
  expiresAt?: number; // epoch ms when the post should expire
}

interface PostCardProps {
  post: PostData;
  onLoginRequired?: () => void;
}

export function PostCard({ post }: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

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

  const deleteAttachmentFromStorage = async (url?: string) => {
    if (!url) return;
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
    } catch (err) {
      console.warn("Failed to delete attachment from storage", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteAttachmentFromStorage(post.attachment?.url ?? post.image);
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

  const handleCardClick = async (e: React.MouseEvent) => {
    // Ignore clicks on interactive elements
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("a") ||
      (e.target as HTMLElement).closest("video") ||
      (e.target as HTMLElement).tagName === "IMG"
    ) {
      return;
    }

    try {
      // Add fireworks event to Firestore for real-time sync

      const { addDoc, collection, serverTimestamp } = await import(
        "firebase/firestore"
      );
      await addDoc(collection(db, "fireworks"), {
        postId: post.id,
        sentiment: post.sentiment?.label ?? null,
        timestamp: serverTimestamp(),
        count: Math.floor(Math.random() * 3) + 1, // 1-3 fireworks
      });
    } catch (error) {
      console.error("Failed to trigger fireworks:", error);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-lg sm:rounded-xl overflow-visible hover:bg-white/[0.07] transition-all duration-300 relative shadow-lg hover:shadow-orange-500/5 group cursor-pointer active:scale-[0.98]"
    >
      <div className="p-3 sm:p-4 flex gap-2 sm:gap-4">
        {/* Avatar */}
        {post.photoURL ? (
          <Image
            src={post.photoURL}
            alt={post.author}
            className="rounded-full flex-shrink-0 object-cover w-10 h-10"
            width={40}
            height={40}
            unoptimized
          />
        ) : (
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 bg-gradient-to-tr ${post.avatar} flex items-center justify-center text-white font-bold text-xs sm:text-sm`}
          >
            {post.author[0]}
          </div>
        )}

        <div className="flex-1 space-y-2 min-w-0">
          {/* Header */}
          <div className="flex justify-between items-start relative gap-2">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base">
                {post.author}
              </span>
              <span className="text-white/40 text-xs sm:text-sm">
                @{post.author.toLowerCase().replace(" ", "")}
              </span>
              <span className="text-white/40 text-xs sm:text-sm hidden sm:inline">
                · {formatDate(post.timestamp)}
              </span>
              {post.sentiment && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    post.sentiment.label === "positive"
                      ? "border-orange-500/50 text-orange-400 bg-orange-500/10"
                      : post.sentiment.label === "neutral"
                      ? "border-green-500/50 text-green-400 bg-green-500/10"
                      : "border-blue-500/50 text-blue-400 bg-blue-500/10"
                  }`}
                >
                  {post.sentiment.label === "positive"
                    ? "Positive"
                    : post.sentiment.label === "neutral"
                    ? "Neutral"
                    : "Negative"}
                </span>
              )}
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-white/40 hover:text-white p-1.5 sm:p-1 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <MoreHorizontal size={16} className="sm:hidden" />
                <MoreHorizontal size={18} className="hidden sm:block" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-28 sm:w-32 bg-black border border-white/20 rounded-lg sm:rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  {!post.authorId || (user && user.uid === post.authorId) ? (
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-3 text-red-500 hover:bg-white/10 flex items-center gap-2 text-sm font-bold"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  ) : (
                    <div className="px-4 py-3 text-white/50 text-sm italic">
                      No actions
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <p className="text-white/90 whitespace-pre-wrap break-words">
            {post.content}
          </p>

          {/* Media Attachment */}
          {post.attachment ? (
            <div className="mt-2 sm:mt-3 rounded-lg overflow-hidden border border-white/10">
              {post.attachment.type.startsWith("image/") ? (
                <Image
                  src={post.attachment.url}
                  alt={post.attachment.name}
                  className="w-full h-auto max-h-[300px] sm:max-h-[400px] object-cover"
                  width={500}
                  height={300}
                  unoptimized
                />
              ) : post.attachment.type.startsWith("video/") ? (
                <video
                  src={post.attachment.url}
                  className="w-full h-auto max-h-[300px] sm:max-h-[400px] bg-black"
                  controls
                  playsInline
                />
              ) : (
                <div className="bg-white/5 p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-white/10 flex items-center justify-center text-orange-400 flex-shrink-0">
                    {/* Generic File Icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">
                      {post.attachment.name}
                    </div>
                    <div className="text-xs text-white/50">
                      {(post.attachment.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <a
                    href={post.attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold transition-colors"
                  >
                    Open
                  </a>
                </div>
              )}
            </div>
          ) : post.image ? (
            // Legacy Image Support
            <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
              <Image
                src={post.image}
                alt="Post content"
                className="w-full h-auto max-h-[400px] object-cover"
                width={500}
                height={300}
                unoptimized
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

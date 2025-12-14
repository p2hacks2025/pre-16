"use client";

import React, { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";

export interface PostData {
  id: string;
  author: string;
  avatar: string; // URL or placeholder color
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

  const handleLike = () => {
    if (liked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
    }
    setLiked(!liked);
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
    <div className="w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/[0.07] transition-colors">
      <div className="p-4 flex gap-4">
        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-tr ${post.avatar} flex items-center justify-center text-white font-bold text-sm`}
        >
          {post.author[0]}
        </div>

        <div className="flex-1 space-y-2">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="font-bold">{post.author}</span>
              <span className="text-white/40 text-sm">
                @{post.author.toLowerCase().replace(" ", "")}
              </span>
              <span className="text-white/40 text-sm">
                · {formatDate(post.timestamp)}
              </span>
            </div>
            <button className="text-white/40 hover:text-white">
              <MoreHorizontal size={18} />
            </button>
          </div>

          {/* Content */}
          <p className="text-white/90 whitespace-pre-wrap">{post.content}</p>

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

"use client";

import React, { useState, useRef } from "react";
import { Image as ImageIcon, Send, X } from "lucide-react";
import { PostData } from "./PostCard";

interface CreatePostProps {
  onPost: (newPost: PostData) => void;
}

export function CreatePost({ onPost }: CreatePostProps) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    const newPost: PostData = {
      id: Date.now().toString(),
      author: "Dragon Master", // Mock user
      avatar: "from-orange-500 to-red-600", // Gradient classes
      content,
      image: image || undefined,
      timestamp: Date.now(),
      likes: 0,
    };

    onPost(newPost);

    // Reset form
    setContent("");
    setImage(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-8"
    >
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's burning? 🔥"
            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/40 text-lg resize-none min-h-[80px]"
          />

          {image && (
            <div className="relative inline-block">
              <img
                src={image}
                alt="Preview"
                className="h-32 w-auto rounded-lg border border-white/20"
              />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="absolute -top-2 -right-2 bg-black/80 rounded-full p-1 text-white hover:bg-black transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-orange-400 hover:text-orange-300 transition-colors p-2 rounded-full hover:bg-orange-500/10"
            >
              <ImageIcon size={20} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
            />

            <button
              type="submit"
              disabled={!content.trim() && !image}
              className="px-4 py-2 bg-orange-600 text-white rounded-full font-bold text-sm hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
            >
              <Send size={16} />
              Post
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

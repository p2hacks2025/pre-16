"use client";

import React, { useEffect, useState } from "react";
import { CreatePost } from "./CreatePost";
import { PostCard, PostData } from "./PostCard";

const STORAGE_KEY = "hanabi_social_posts";

// Initial seed posts to make it look alive
const SEED_POSTS: PostData[] = [
  {
    id: "seed-1",
    author: "Hanabi Official",
    avatar: "from-blue-500 to-purple-600",
    content:
      "Welcome to the Hanabi Community! 🎆\nShare your best fire-breathing moments here.",
    timestamp: Date.now() - 3600000, // 1 hour ago
    likes: 42,
  },
  {
    id: "seed-2",
    author: "Fire Starter",
    avatar: "from-green-400 to-emerald-600",
    content:
      "This new AR feature is insane! My cat looks like a dragon now. 🐉",
    timestamp: Date.now() - 7200000, // 2 hours ago
    likes: 15,
  },
];

export function SocialTab() {
  const [posts, setPosts] = useState<PostData[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPosts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse posts", e);
        setPosts(SEED_POSTS);
      }
    } else {
      setPosts(SEED_POSTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_POSTS));
    }
  }, []);

  const handleNewPost = (newPost: PostData) => {
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
  };

  return (
    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CreatePost onPost={handleNewPost} />

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

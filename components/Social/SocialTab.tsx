"use client";

import React, { useEffect, useState } from "react";
import { CreatePost } from "./CreatePost";
import { PostCard, PostData } from "./PostCard";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

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
  const { user } = useAuth();
  const { profile } = useProfile(user);
  const [posts, setPosts] = useState<PostData[]>(SEED_POSTS);
  const [ready, setReady] = useState(false);

  // Subscribe to Firestore in realtime
  useEffect(() => {
    try {
      const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const fetched: PostData[] = snap.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              author: data.author ?? "Unknown",
              avatar: data.avatar ?? "from-orange-500 to-red-600",
              photoURL: data.photoURL ?? undefined,
              content: data.content ?? "",
              image: data.image ?? undefined,
              timestamp: (data.timestamp?.toMillis?.() as number) ?? Date.now(),
              likes: data.likes ?? 0,
            };
          });
          setPosts(fetched.length ? fetched : SEED_POSTS);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fetched));
          setReady(true);
        },
        (err) => {
          console.error("Firestore subscription error", err);
          // Fallback to localStorage
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            try {
              setPosts(JSON.parse(saved));
            } catch {}
          }
          setReady(true);
        }
      );
      return () => unsub();
    } catch (e) {
      console.error(e);
      setReady(true);
    }
  }, []);

  const handleNewPost = (newPost: PostData) => {
    // 楽観的更新：投稿直後に先頭に追加
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {user && (
        <CreatePost onPost={handleNewPost} userProfile={profile} />
      )}
      <div className="space-y-4">
        {!ready && (
          <div className="text-white/50 text-sm">Loading posts...</div>
        )}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onLoginRequired={() => {}} />
        ))}
      </div>
    </div>
  );
}

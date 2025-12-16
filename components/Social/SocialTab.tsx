"use client";

import React, { useEffect, useRef, useState } from "react";
import { CreatePost } from "./CreatePost";
import { PostCard, PostData } from "./PostCard";
import { db, storage } from "@/lib/firebase";
import { collection, deleteDoc, onSnapshot, orderBy, query, doc, where } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Search } from "lucide-react";
import { TrashBin } from "./TrashBin";
import { DraggablePostCard } from "./DraggablePostCard";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

const STORAGE_KEY = "hanabi_social_posts";
const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

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

export function SocialTab({
  tab = "everyone",
  showCompose = false,
}: {
  tab?: "everyone" | "solo";
  showCompose?: boolean;
}) {
  const { user } = useAuth();
  const { profile } = useProfile(user);
  const [posts, setPosts] = useState<PostData[]>(SEED_POSTS);
  const [ready, setReady] = useState(false);
  const cleanedRef = useRef<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null); // Unused but kept if needed for drag overlay later
  const [dropTrigger, setDropTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const deleteAttachmentFromStorage = async (url?: string) => {
    if (!url) return;
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
    } catch (err) {
      console.warn("Failed to delete attachment from storage", err);
    }
  };

  const deletePostAssets = async (post?: PostData) => {
    if (!post) return;
    const url = post.attachment?.url ?? post.image;
    await deleteAttachmentFromStorage(url);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // Require 10px movement before drag starts (allows clicks)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Long press to drag on touch, allowing scrolling
        tolerance: 5,
      },
    })
  );
  const [showFireworks, setShowFireworks] = useState(false);

  // Subscribe to Firestore in realtime
  useEffect(() => {
    try {
      let q = query(collection(db, "posts"), orderBy("timestamp", "desc"));

      if (tab === "solo") {
        if (!user) {
          setPosts([]);
          setReady(true);
          return;
        }
        q = query(
          collection(db, "posts"),
          where("authorId", "==", user.uid),
          orderBy("timestamp", "desc")
        );
      }

      const unsub = onSnapshot(
        q,
        (snap) => {
          const now = Date.now();
          const fetched: PostData[] = [];

          snap.docs.forEach((d) => {
            const data = d.data() as any;
            const ts = (data.timestamp?.toMillis?.() as number) ?? Date.now();
            const expiresAt =
              (data.expiresAt?.toMillis?.() as number) ?? ts + EXPIRY_MS;
            const expired = expiresAt <= now;

            if (expired) {
              if (!cleanedRef.current.has(d.id)) {
                cleanedRef.current.add(d.id);
                deletePostAssets({
                  attachment: data.attachment,
                  image: data.image,
                }).catch((err) =>
                  console.warn("Failed to delete expired post attachment", err)
                );
                deleteDoc(d.ref).catch((err) =>
                  console.error("Failed to auto-delete expired post", err)
                );
              }
              return;
            }

            fetched.push({
              id: d.id,
              author: data.author ?? "Unknown",
              authorId: data.authorId ?? undefined, // Read authorId
              avatar: data.avatar ?? "from-orange-500 to-red-600",
              photoURL: data.photoURL ?? undefined,
              content: data.content ?? "",
              image: data.image ?? undefined,
              attachment: data.attachment ?? undefined,
              timestamp: ts,
              expiresAt,
              likes: data.likes ?? 0,
            });
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
  }, [tab, user]);

  const handleNewPost = (_newPost: PostData) => {
    // Optimistic update removed to prevent duplicate keys with real-time listener
    // setPosts((prev) => [newPost, ...prev]);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && over.id === "trash-bin") {
      const postId = active.id as string;
      const targetPost = posts.find((p) => p.id === postId);

      // Trigger effect
      setDropTrigger(Date.now());

      // Delete from local state instantly
      setPosts((prev) => prev.filter((p) => p.id !== postId));

      // Delete from Firestore and Storage if they exist there
      try {
        await deletePostAssets(targetPost);
        await deleteDoc(doc(db, "posts", postId));
        console.log("Deleted post", postId);
      } catch (e) {
        console.error("Error deleting post", e);
        // Could revert state here if strict consistency needed
      }
    }
  };

  const activePost = posts.find((p) => p.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        {/* Search Bar */}
        <div className="mb-6 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="火種を探す..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all hover:bg-white/10"
          />
        </div>

        {user && showCompose && (
          <CreatePost
            onPost={handleNewPost}
            userProfile={profile}
            isPrivate={tab === "solo"}
          />
        )}
        <div className="space-y-4 pb-24">
          {" "}
          {/* Added padding for TrashBin */}
          {!ready && (
            <div className="text-white/50 text-sm">Loading posts...</div>
          )}
          {posts
            .filter((post) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                post.content.toLowerCase().includes(q) ||
                post.author.toLowerCase().includes(q) ||
                post.attachment?.name.toLowerCase().includes(q)
              );
            })
            .map((post) => (
              <DraggablePostCard
                key={post.id}
                post={post}
                isOwner={user?.uid === post.authorId}
                onLoginRequired={() => {}}
              />
            ))}
        </div>

        {/* Render TrashBin if user is logged in (or always if we allow guest deletes locally?) 
            Let's show it always for interaction feel, but maybe disable logic? 
            Assuming user works for now based on context. 
        */}
        <TrashBin dropTrigger={dropTrigger} />

        <DragOverlay>
          {activePost ? (
            <div className="opacity-90 scale-105 pointer-events-none">
              <PostCard post={activePost} onLoginRequired={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

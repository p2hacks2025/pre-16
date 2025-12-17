"use client";

import React, { useEffect, useRef, useState } from "react";
import { CreatePost } from "./CreatePost";
import { PostCard, PostData } from "./PostCard";
import { FireworksOverlay } from "./FireworksOverlay";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  doc,
  where,
} from "firebase/firestore";
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
import { Send, Search } from "lucide-react";
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
  onComposeClick,
  onPendingPostsChange,
}: {
  tab?: "everyone" | "solo";
  showCompose?: boolean;
  onComposeClick?: () => void;
  onPendingPostsChange?: (pendingPosts: PostData[]) => void;
}) {
  const { user } = useAuth();
  const { profile } = useProfile(user);
  const [posts, setPosts] = useState<PostData[]>(SEED_POSTS);
  const [ready, setReady] = useState(false);
  const cleanedRef = useRef<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropTrigger, setDropTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [hideNegative, setHideNegative] = useState(false);

  // New state for the 10-second pending post animation (Array)
  const [pendingPosts, setPendingPosts] = useState<PostData[]>([]);

  useEffect(() => {
    const checkSetting = () => {
      setHideNegative(localStorage.getItem("hanabi_hide_negative") === "true");
    };
    checkSetting();

    const handleStorageChange = () => checkSetting();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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

  type PostAssets = Pick<PostData, "attachment" | "image">;
  const deletePostAssets = async (post?: PostAssets) => {
    if (!post) return;
    const url = post.attachment?.url ?? post.image;
    await deleteAttachmentFromStorage(url);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );
  const [showFireworks, setShowFireworks] = useState(false);
  const [fireworksSentiment, setFireworksSentiment] = useState<string | null>(
    null
  );

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
              authorId: data.authorId ?? undefined,
              avatar: data.avatar ?? "from-orange-500 to-red-600",
              photoURL: data.photoURL ?? undefined,
              content: data.content ?? "",
              image: data.image ?? undefined,
              attachment: data.attachment ?? undefined,
              sentiment: data.sentiment ?? undefined,
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

  // Synchronize local pending posts with parent (CommunityPage)
  useEffect(() => {
    if (onPendingPostsChange) {
      onPendingPostsChange(pendingPosts);
    }
  }, [pendingPosts, onPendingPostsChange]);

  const handleNewPost = (newPost: PostData) => {
    // Choose sentiment preset for fireworks and activate
    const label = newPost.sentiment?.label ?? null;
    setFireworksSentiment(label);
    setShowFireworks(true);

    // Add to pending array
    setPendingPosts((current) => [...current, newPost]);

    // Remove this specific post after 10s
    setTimeout(() => {
      setPendingPosts((current) => current.filter((p) => p.id !== newPost.id));
    }, 10000);
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

      setDropTrigger(Date.now());
      setPosts((prev) => prev.filter((p) => p.id !== postId));

      try {
        await deletePostAssets(targetPost);
        await deleteDoc(doc(db, "posts", postId));
        console.log("Deleted post", postId);
      } catch (e) {
        console.error("Error deleting post", e);
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
      <div className="w-full relative animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Mobile "Center" Shim - if on mobile, show pending posts here at top */}
        <div className="lg:hidden mb-6 flex flex-col gap-4">
          {pendingPosts.map((p) => (
            <div
              key={p.id}
              className="animate-in zoom-in-50 fade-in duration-700 border-b border-white/10 pb-6"
            >
              <PostCard post={p} onLoginRequired={() => {}} />
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
            <Search size={18} className="sm:block hidden" />
            <Search size={16} className="sm:hidden" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="火種を探す..."
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-xs sm:text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all hover:bg-white/10"
          />
        </div>

        {/* Mobile Compose Button */}
        <div className="mb-4 lg:hidden">
          <button
            type="button"
            onClick={onComposeClick}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-white/20 bg-black/20 px-6 py-3 text-xl font-black text-white shadow-[0_0_20px_rgba(249,115,22,0.6)] transition-all hover:bg-white/10 hover:shadow-[0_0_30px_rgba(249,115,22,0.8)]"
          >
            <span
              className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 animate-gradient"
              aria-hidden="true"
            />
            <span className="relative flex items-center justify-center gap-2">
              <span className="bg-gradient-to-r from-orange-200 to-white bg-clip-text text-transparent drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]">
                発火
              </span>
              <span className="text-xs font-normal text-white/70 tracking-widest">
                IGNITE
              </span>
            </span>
          </button>
        </div>

        {user && showCompose && (
          <CreatePost
            onPost={handleNewPost}
            userProfile={profile}
            isPrivate={tab === "solo"}
          />
        )}

        <div className="space-y-3 sm:space-y-4 pb-24">
          {!ready && (
            <div className="text-white/50 text-xs sm:text-sm">
              Loading posts...
            </div>
          )}
          {posts
            .filter((post) => {
              // Hide pending posts from timeline
              if (pendingPosts.some((p) => p.id === post.id)) return false;

              // Hide negative if setting enabled
              if (hideNegative && post.sentiment?.label === "negative") {
                return false;
              }

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
                className="animate-in fade-in duration-700 fill-mode-backwards slide-in-from-top-8 lg:slide-in-from-top-0 lg:slide-in-from-left-48"
              />
            ))}
        </div>

        <TrashBin dropTrigger={dropTrigger} />

        <DragOverlay>
          {activePost ? (
            <div className="opacity-90 scale-105 pointer-events-none">
              <PostCard post={activePost} onLoginRequired={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
        <FireworksOverlay
          isActive={showFireworks}
          sentimentLabel={fireworksSentiment}
          onComplete={() => {
            setShowFireworks(false);
            setFireworksSentiment(null);
          }}
        />
      </div>
    </DndContext>
  );
}

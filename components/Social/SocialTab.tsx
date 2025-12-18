"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CreatePost } from "./CreatePost";
import { PostCard, PostData } from "./PostCard";
import { FireworksOverlay } from "./FireworksOverlay";
import { db } from "@/lib/firebase";
import { deleteDoc, doc } from "firebase/firestore";
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
import { useSocialPosts } from "@/hooks/useSocialPosts";

export function SocialTab({
  tab = "everyone",
  showCompose = false,
  onComposeClick,
  onPendingPostsChange,
  onPostCreated,
  soundEnabled = false,
}: {
  tab?: "everyone" | "solo";
  showCompose?: boolean;
  onComposeClick?: () => void;
  onPendingPostsChange?: (pendingPosts: PostData[]) => void;
  onPostCreated?: () => void;
  soundEnabled?: boolean;
}) {
  const { user } = useAuth();
  const { profile } = useProfile(user);
  // Refactored to use custom hook
  const {
    posts,
    setPosts,
    pendingPosts,
    setPendingPosts,
    ready,
    newPostEvent,
    deletePostAssets,
  } = useSocialPosts({ tab, user });

  const [fireworksQueue, setFireworksQueue] = useState<(string | null)[]>([]);
  const [fireworksSentiment, setFireworksSentiment] = useState<string | null>(
    null
  );
  const [fireworksTrigger, setFireworksTrigger] = useState(0);
  const [fireworksProcessing, setFireworksProcessing] = useState(false);
  const fireworksTimerRef = useRef<number | null>(null);
  const fireworksQueueTimerRef = useRef<number | null>(null);
  type FireworksEventDetail = { sentiments?: (string | null)[] };
  type FireworksCustomEvent = CustomEvent<FireworksEventDetail>;

  // Enqueue sentiments from new post events
  useEffect(() => {
    if (newPostEvent?.sentiments?.length) {
      setFireworksQueue((prev) => [...prev, ...newPostEvent.sentiments]);
    }
  }, [newPostEvent]);

  const queueFireworks = useCallback((label: string | null, count = 1) => {
    if (count <= 0) return;
    const sentiments = Array.from({ length: count }, () => label);
    setFireworksQueue((prev) => [...prev, ...sentiments]);
  }, []);

  // Listen for global fireworks requests (e.g., clicks on pending posts outside this component)
  useEffect(() => {
    const handler = (e: FireworksCustomEvent) => {
      const sentiments = e.detail?.sentiments;
      if (!sentiments?.length) return;
      setFireworksQueue((prev) => [...prev, ...sentiments]);
    };
    const listener: EventListener = (e) =>
      handler(e as FireworksCustomEvent);
    window.addEventListener("hanabi-fireworks", listener);
    return () => window.removeEventListener("hanabi-fireworks", listener);
  }, []);

  // Dequeue one sentiment at a time and trigger fireworks
  useEffect(() => {
    if (fireworksProcessing) return;
    if (!fireworksQueue.length) return;

    // Defer state updates out of the effect body to avoid cascading render warnings
    fireworksQueueTimerRef.current = window.setTimeout(() => {
      const [next, ...rest] = fireworksQueue;
      setFireworksSentiment(next ?? null);
      setFireworksQueue(rest);
      setFireworksTrigger((prev) => prev + 1);
      setFireworksProcessing(true);

      const delay = 80 + Math.random() * 120; // quick stagger, but not simultaneous
      fireworksTimerRef.current = window.setTimeout(() => {
        setFireworksProcessing(false);
        fireworksTimerRef.current = null;
      }, delay);
    }, 0);
  }, [fireworksProcessing, fireworksQueue]);

  useEffect(() => {
    return () => {
      if (fireworksQueueTimerRef.current) {
        window.clearTimeout(fireworksQueueTimerRef.current);
      }
      if (fireworksTimerRef.current) {
        window.clearTimeout(fireworksTimerRef.current);
      }
    };
  }, []);

  // Clean cleanedRef ... actually this logic is inside the hook now but we used it for one-off deletes.
  // The hook handles the expiration deletes.

  // Logic for manual delete drag-drop
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropTrigger, setDropTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [hideNegative, setHideNegative] = useState(false);

  useEffect(() => {
    const checkSetting = () => {
      setHideNegative(localStorage.getItem("hanabi_hide_negative") === "true");
    };
    checkSetting();

    const handleStorageChange = () => checkSetting();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 0.8秒の長押しでドラッグ開始
        tolerance: 20, // 20px以内の移動は許容（スクロール可能）
      },
    })
  );

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

    // Notify parent to scroll or do other actions
    if (onPostCreated) {
      onPostCreated();
    }

    // Add to pending array
    setPendingPosts((current) => {
      if (current.some((p) => p.id === newPost.id)) return current;
      return [...current, newPost].sort((a, b) => a.timestamp - b.timestamp);
    });

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
        <div
          className="lg:hidden mb-6 flex flex-col gap-4"
          data-pending-stack
        >
          {pendingPosts.map((p) => (
            <div
              key={p.id}
              className="animate-in zoom-in-50 fade-in duration-700 border-b border-white/10 pb-6 cursor-pointer"
              onClick={() => {
                const count = 3 + Math.floor(Math.random() * 3); // 3-5発
                queueFireworks(p.sentiment?.label ?? null, count);
              }}
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

        {/* List Container with overflow-anchor: none to prevent browser scroll jumping */}
        <motion.div
          layout
          style={{ overflowAnchor: "none" }}
          className="flex flex-col gap-3 sm:gap-4 pb-24"
          data-feed-root
        >
          {!ready && (
            <div className="text-white/50 text-xs sm:text-sm">
              Loading posts...
            </div>
          )}
          <AnimatePresence mode="popLayout" initial={false}>
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
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{
                    layout: { duration: 0.3, ease: "easeOut" },
                    opacity: { duration: 0.2 },
                  }}
                >
                  <DraggablePostCard
                    post={post}
                    isOwner={user?.uid === post.authorId}
                    onLoginRequired={() => {}}
                    // Removed conflicting CSS animations as Framer Motion handles entry/exit
                    className=""
                  />
                </motion.div>
              ))}
          </AnimatePresence>
        </motion.div>

        <TrashBin dropTrigger={dropTrigger} soundEnabled={soundEnabled} />

        <DragOverlay>
          {activePost ? (
            <div className="opacity-90 scale-105 pointer-events-none">
              <PostCard post={activePost} onLoginRequired={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
        <FireworksOverlay
          trigger={fireworksTrigger}
          sentimentLabel={fireworksSentiment}
          sound={
            soundEnabled
              ? {
                  enabled: true,
                  files: ["/sounds/fireworks.mp3"],
                  volume: { min: 90, max: 100 },
                }
              : { enabled: false }
          }
        />
      </div>
    </DndContext>
  );
}

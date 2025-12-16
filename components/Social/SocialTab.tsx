import React, { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { TrashBin } from "./TrashBin";
import { FireworksOverlay } from "./FireworksOverlay";
import { DraggablePostCard } from "./DraggablePostCard";
import {
  doc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CreatePost } from "./CreatePost";
import { PostData } from "./PostCard";
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
  const [activeId, setActiveId] = useState<string | null>(null); // Unused but kept if needed for drag overlay later
  const [dropTrigger, setDropTrigger] = useState(0);

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
          const fetched: PostData[] = snap.docs
            .map((d) => {
              const data = d.data() as any;
              return {
                id: d.id,
                author: data.author ?? "Unknown",
                authorId: data.authorId ?? undefined,
                visibility: data.visibility ?? "public",
                avatar: data.avatar ?? "from-orange-500 to-red-600",
                photoURL: data.photoURL ?? undefined,
                content: data.content ?? "",
                image: data.image ?? undefined,
                attachment: data.attachment ?? undefined,
                timestamp:
                  (data.timestamp?.toMillis?.() as number) ?? Date.now(),
                likes: data.likes ?? 0,
              };
            })
            // Client-side filtering for simplicity
            .filter((p) => {
              // If we are in "everyone" tab, hide private posts
              if (tab === "everyone" && p.visibility === "private") {
                return false;
              }
              return true;
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && over.id === "trash-bin") {
      const postId = active.id as string;

      // Trigger effect
      setDropTrigger(Date.now());

      // Delete from local state instantly
      setPosts((prev) => prev.filter((p) => p.id !== postId));

      // Delete from Firestore if it exists there
      try {
        await deleteDoc(doc(db, "posts", postId));
        console.log("Deleted post", postId);
      } catch (e) {
        console.error("Error deleting post", e);
        // Could revert state here if strict consistency needed
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
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
          {posts.map((post) => (
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

        {/* Optional: Add DragOverlay for better visual if desired, but default drag works too */}
      </div>
    </DndContext>
  );
}

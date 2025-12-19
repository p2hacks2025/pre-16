import { useState, useEffect, useRef, useCallback } from "react";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  limit,
  where,
  Query,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { PostData } from "@/components/Social/PostCard";

const STORAGE_KEY = "hanabi_social_posts";
const STORAGE_LAST_IDS = "hanabi_social_last_ids";
const EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Initial seed posts
const SEED_POSTS: PostData[] = [
  {
    id: "seed-1",
    author: "Hanabi Official",
    avatar: "from-blue-500 to-purple-600",
    content:
      "Welcome to the HANABI Community! 🎆\nあなたの打ち上げたい思い(花火)をここで共有してください",
    timestamp: Date.now() - 3600000, // 1 hour ago
    likes: 42,
  },
];

type UseSocialPostsProps = {
  tab: "everyone" | "solo";
  user: { uid: string } | null;
};

export function useSocialPosts({ tab, user }: UseSocialPostsProps) {
  const [posts, setPosts] = useState<PostData[]>(SEED_POSTS);
  const [ready, setReady] = useState(false);
  const cleanedRef = useRef<Set<string>>(new Set());
  const [pendingPosts, setPendingPosts] = useState<PostData[]>([]);

  // Events for UI effects (like fireworks)
  const [newPostEvent, setNewPostEvent] = useState<{
    sentiments: (string | null)[];
    timestamp: number;
  } | null>(null);

  const deleteAttachmentFromStorage = useCallback(async (url?: string) => {
    if (!url) return;
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
    } catch (err) {
      console.warn("Failed to delete attachment from storage", err);
    }
  }, []);

  const deletePostAssets = useCallback(
    async (post?: Pick<PostData, "attachment" | "image">) => {
      if (!post) return;
      const url = post.attachment?.url ?? post.image;
      await deleteAttachmentFromStorage(url);
    },
    [deleteAttachmentFromStorage]
  );

  useEffect(() => {
    try {
      let q: Query = query(
        collection(db, "posts"),
        orderBy("timestamp", "desc"),
        limit(50)
      );

      if (tab === "solo") {
        if (!user) {
          const timer = setTimeout(() => {
            setPosts([]);
            setReady(true);
          }, 0);
          return () => clearTimeout(timer);
        }
        q = query(
          collection(db, "posts"),
          where("authorId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(50)
        );
      }

      const unsub = onSnapshot(
        q,
        (snap) => {
          const now = Date.now();
          const fetched: PostData[] = [];
          const addedIds: string[] = [];

          snap.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = change.doc.data() as Partial<PostData>;
              // Fix: Handle Firestore Timestamp or number
              const ts =
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (data.timestamp as any)?.toMillis?.() ??
                (typeof data.timestamp === "number"
                  ? data.timestamp
                  : Date.now());

              const expiresAt =
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (data.expiresAt as any)?.toMillis?.() ?? ts + EXPIRY_MS;

              // Only trigger for recently added posts (< 15s ago)
              if (now - ts < 15000 && expiresAt > now) {
                if (
                  data.visibility === "private" &&
                  user?.uid !== data.authorId
                ) {
                  return;
                }

                setPendingPosts((prev) => {
                  if (prev.some((p) => p.id === change.doc.id)) return prev;

                  addedIds.push(change.doc.id);

                  const newPost: PostData = {
                    id: change.doc.id,
                    author: data.author ?? "Unknown",
                    authorId: data.authorId,
                    avatar: data.avatar ?? "from-orange-500 to-red-600",
                    photoURL: data.photoURL,
                    content: data.content ?? "",
                    image: data.image,
                    attachment: data.attachment,
                    sentiment: data.sentiment,
                    timestamp: ts,
                    expiresAt,
                    likes: data.likes ?? 0,
                    visibility: data.visibility,
                  };

                  // Auto-remove pending after 10s
                  setTimeout(() => {
                    setPendingPosts((current) =>
                      current.filter((p) => p.id !== newPost.id)
                    );
                  }, 10000);

                  return [...prev, newPost].sort(
                    (a, b) => a.timestamp - b.timestamp
                  );
                });
              }
            }
          });

          snap.docs.forEach((d) => {
            const data = d.data() as Partial<PostData>;
            const ts =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (data.timestamp as any)?.toMillis?.() ??
              (typeof data.timestamp === "number"
                ? data.timestamp
                : Date.now());
            const expiresAt =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (data.expiresAt as any)?.toMillis?.() ?? ts + EXPIRY_MS;
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

            if (tab !== "solo" && data.visibility === "private") {
              return;
            }

            fetched.push({
              id: d.id,
              author: data.author ?? "Unknown",
              authorId: data.authorId,
              avatar: data.avatar ?? "from-orange-500 to-red-600",
              photoURL: data.photoURL,
              content: data.content ?? "",
              image: data.image,
              attachment: data.attachment,
              sentiment: data.sentiment,
              timestamp: ts,
              expiresAt,
              likes: data.likes ?? 0,
              visibility: data.visibility,
            });
          });

          setPosts(fetched.length ? fetched : SEED_POSTS);

          // Detect new posts (from docChanges added) to trigger fireworks
          try {
            if (addedIds.length) {
              const sentiments = addedIds
                .map(
                  (id) =>
                    fetched.find((p) => p.id === id)?.sentiment?.label ?? null
                )
                .filter((v) => v != null);
              setNewPostEvent({
                sentiments,
                timestamp: Date.now(),
              });
            }

            const currentIds = fetched.map((p) => p.id);
            localStorage.setItem(
              STORAGE_LAST_IDS,
              JSON.stringify(currentIds.slice(0, 50))
            );
          } catch (err) {
            console.warn("Failed to process localStorage diff", err);
          }

          localStorage.setItem(STORAGE_KEY, JSON.stringify(fetched));
          setReady(true);
        },
        (err) => {
          console.error("Firestore subscription error", err);
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
      queueMicrotask(() => setReady(true));
    }
  }, [tab, user, deletePostAssets]);

  return {
    posts,
    setPosts,
    pendingPosts,
    setPendingPosts,
    ready,
    newPostEvent,
    deletePostAssets,
  };
}

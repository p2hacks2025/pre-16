"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Send,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  increment,
  updateDoc,
} from "firebase/firestore";
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
  timestamp: number;
  likes: number;
}

interface PostCardProps {
  post: PostData;
}

interface ReplyData {
  author?: string;
  uid?: string;
  photoURL?: string;
  content?: string;
  timestamp?: { toMillis: () => number };
}

interface PostCardProps {
  post: PostData;
  onLoginRequired?: () => void;
}

export function PostCard({ post, onLoginRequired }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replies, setReplies] = useState<
    Array<{
      id: string;
      author: string;
      content: string;
      photoURL?: string;
      timestamp: number;
    }>
  >([]);

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

  // Initialize like state and subscribe to post's like count
  useEffect(() => {
    // live likes count from post document
    const postRef = doc(db, "posts", post.id);
    const unsub = onSnapshot(postRef, (snap) => {
      const data = snap.data() as any;
      if (data?.likes !== undefined) {
        setLikeCount(data.likes as number);
      }
    });

    // user like state
    const init = async () => {
      if (!user) return;
      const likeRef = doc(db, "posts", post.id, "likes", user.uid);
      const likeDoc = await getDoc(likeRef);
      setLiked(likeDoc.exists());
    };
    init();

    return () => unsub();
  }, [db, post.id, user?.uid]);

  const handleLike = async () => {
    if (!user) return; // require auth
    const postRef = doc(db, "posts", post.id);
    const likeRef = doc(db, "posts", post.id, "likes", user.uid);
    try {
      if (liked) {
        // Unlike: remove like doc and decrement counter
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likes: increment(-1) });
        setLiked(false);
      } else {
        // Like: create like doc and increment counter
        await setDoc(likeRef, { uid: user.uid, createdAt: serverTimestamp() });
        await updateDoc(postRef, { likes: increment(1) });
        setLiked(true);
      }
    } catch (e) {
      console.error("Failed to toggle like", e);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
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

  // Subscribe replies for this post
  useEffect(() => {
    const repliesRef = collection(db, "posts", post.id, "replies");
    const q = query(repliesRef, orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() as ReplyData;
        return {
          id: d.id,
          author: data.author ?? "",
          content: data.content ?? "",
          photoURL: data.photoURL,
          timestamp: (data.timestamp?.toMillis?.() ?? Date.now()) as number,
        };
      });
      setReplies(list);
    });

    return () => unsub();
  }, [post.id]);

  const submitReply = async () => {
    if (!user || !replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const repliesRef = collection(db, "posts", post.id, "replies");
      await addDoc(repliesRef, {
        author: user.displayName || "Anonymous",
        uid: user.uid,
        photoURL: user.photoURL || null,
        content: replyText.trim(),
        timestamp: serverTimestamp(),
      });
      setReplyText("");
      setShowReplyBox(false);
    } catch (e) {
      console.error("Failed to submit reply", e);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-visible hover:bg-white/[0.07] transition-all duration-300 relative shadow-lg hover:shadow-orange-500/5 group">
      <div className="p-4 flex gap-4">
        {/* Avatar */}
        {post.photoURL ? (
          <img
            src={post.photoURL}
            alt={post.author}
            className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full flex-shrink-0 bg-gradient-to-tr ${post.avatar} flex items-center justify-center text-white font-bold text-sm`}
          >
            {post.author[0]}
          </div>
        )}

        <div className="flex-1 space-y-2 min-w-0">
          {/* Header */}
          <div className="flex justify-between items-start relative">
            <div className="flex items-center gap-2">
              <span className="font-bold">{post.author}</span>
              <span className="text-white/40 text-sm">
                @{post.author.toLowerCase().replace(" ", "")}
              </span>
              <span className="text-white/40 text-sm">
                · {formatDate(post.timestamp)}
              </span>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <MoreHorizontal size={18} />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-black border border-white/20 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
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
            <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
              {post.attachment.type.startsWith("image/") ? (
                <img
                  src={post.attachment.url}
                  alt={post.attachment.name}
                  className="w-full h-auto max-h-[400px] object-cover"
                  loading="lazy"
                />
              ) : post.attachment.type.startsWith("video/") ? (
                <video
                  src={post.attachment.url}
                  className="w-full h-auto max-h-[400px] bg-black"
                  controls
                  playsInline
                />
              ) : (
                <div className="bg-white/5 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center text-orange-400">
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
              <img
                src={post.image}
                alt="Post content"
                className="w-full h-auto max-h-[400px] object-cover"
                loading="lazy"
              />
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex justify-between items-center pt-2 text-white/50 max-w-sm">
            <button
              onClick={() => {
                if (!user) {
                  onLoginRequired?.();
                  return;
                }
                setShowReplyBox((v) => !v);
              }}
              className="flex items-center gap-2 hover:text-blue-400 group transition-colors"
            >
              <MessageCircle
                size={18}
                className="group-hover:bg-blue-500/10 p-1 box-content rounded-full"
              />
              <span className="text-xs">Reply</span>
            </button>
            <button
              onClick={() => {
                if (!user) {
                  onLoginRequired?.();
                  return;
                }
                handleLike();
              }}
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
            <button
              onClick={async () => {
                const shareData = {
                  title: `${post.author}の投稿`,
                  text: post.content,
                  url:
                    typeof window !== "undefined"
                      ? window.location.href
                      : undefined,
                } as ShareData;
                try {
                  if (navigator.share) {
                    await navigator.share(shareData);
                  } else {
                    const url = shareData.url || "";
                    const text = `${shareData.title}\n\n${shareData.text}\n\n${url}`;
                    await navigator.clipboard.writeText(text);
                    alert("共有内容をクリップボードにコピーしました。");
                  }
                } catch (e) {
                  console.error("Share failed", e);
                }
              }}
              className="flex items-center gap-2 hover:text-green-400 group transition-colors"
            >
              <Share2
                size={18}
                className="group-hover:bg-green-500/10 p-1 box-content rounded-full"
              />
              <span className="text-xs">Share</span>
            </button>
          </div>

          {/* Reply input */}
          {showReplyBox && (
            <div className="mt-3 flex items-end gap-2">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? "You"}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-xs">
                  You
                </div>
              )}
              <div className="flex-1 flex items-center gap-2">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    user ? "返信を入力..." : "返信にはログインが必要です"
                  }
                  disabled={!user || submittingReply}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <button
                  onClick={submitReply}
                  disabled={!user || submittingReply || !replyText.trim()}
                  className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Replies list */}
          {replies.length > 0 && (
            <div className="mt-4 space-y-3">
              {replies.map((r) => (
                <div key={r.id} className="flex gap-3">
                  {r.photoURL ? (
                    <img
                      src={r.photoURL}
                      alt={r.author}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                      {r.author[0] || "?"}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white/90">
                        {r.author}
                      </span>
                      <span className="text-xs text-white/40">
                        {formatDate(r.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-white/80 whitespace-pre-wrap">
                      {r.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

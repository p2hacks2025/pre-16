"use client";

import React, { useState, useRef } from "react";
import { Image as ImageIcon, Send, X } from "lucide-react";
import { PostData } from "./PostCard";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { UserProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

interface CreatePostProps {
  onPost: (newPost: PostData) => void;
  userProfile: UserProfile | null;
}

export function CreatePost({ onPost, userProfile }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    setSubmitting(true);

    try {
      // 1) 画像がある場合は Storage にアップロード
      let imageUrl: string | undefined = undefined;
      const tempId = Date.now().toString();
      if (image) {
        const imgRef = ref(storage, `posts/${tempId}`);
        await uploadString(imgRef, image, "data_url");
        imageUrl = await getDownloadURL(imgRef);
      }

      // 2) Firestore に投稿ドキュメントを追加
      const author = userProfile?.displayName || "Dragon Master";
      const avatar =
        userProfile?.avatarGradient || "from-orange-500 to-red-600";
      const photoURL = userProfile?.photoURL || null;

      const docRef = await addDoc(collection(db, "posts"), {
        author,
        authorId: user?.uid || null, // Handle undefined for anonymous users
        avatar,
        photoURL,
        content: content.trim(),
        image: imageUrl || null,
        timestamp: serverTimestamp(),
        likes: 0,
      });

      const newPost: PostData = {
        id: docRef.id,
        author,
        avatar,
        photoURL: photoURL || undefined,
        content: content.trim(),
        image: imageUrl || undefined,
        timestamp: Date.now(), // 表示用に仮タイムスタンプ（サーバー側は serverTimestamp）
        likes: 0,
      };
      onPost(newPost);

      // Reset form
      setContent("");
      setImage(null);
    } catch (err) {
      console.error("Failed to submit post", err);
    } finally {
      setSubmitting(false);
    }
  };

  const avatarGradient =
    userProfile?.avatarGradient || "from-orange-500 to-red-600";
  const userPhotoURL = userProfile?.photoURL;

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 mb-8"
    >
      <div className="flex gap-4">
        {userPhotoURL ? (
          <img
            src={userPhotoURL}
            alt="Your avatar"
            className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full bg-gradient-to-r ${avatarGradient} flex-shrink-0`}
          />
        )}
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
              disabled={submitting || (!content.trim() && !image)}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full font-bold text-sm hover:from-orange-400 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg hover:shadow-orange-500/25"
            >
              <Send size={16} />
              {submitting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

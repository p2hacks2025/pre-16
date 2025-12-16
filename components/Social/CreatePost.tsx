"use client";

import React, { useState, useRef } from "react";
import { Image as ImageIcon, Send, X } from "lucide-react";
import { PostData } from "./PostCard";
import { db, storage } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { UserProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";

interface CreatePostProps {
  onPost: (newPost: PostData) => void;
  userProfile: UserProfile | null;
  isPrivate?: boolean;
}

export function CreatePost({
  onPost,
  userProfile,
  isPrivate = false,
}: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  /* 
    State for File Upload 
    - fileObj: The actual File object to upload
    - previewUrl: A local URL (blob or dataUrl) for previewing
  */
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 30MB Limit Check
      if (file.size > 30 * 1024 * 1024) {
        alert("File size must be less than 30MB.");
        return;
      }

      setFileObj(file);

      // Create preview
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        // For other files, no preview image, just show icon/name
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!content.trim() && !fileObj) return;
    if (content.length > 400) return; // Enforce limit
    setSubmitting(true);

    try {
      // 1) Submit attachment to Storage
      let attachmentData:
        | { url: string; type: string; name: string; size: number }
        | undefined = undefined;

      if (fileObj) {
        const tempId = Date.now().toString();
        // Keep original extension or name if possible, but simplify for now
        const storageRef = ref(
          storage,
          `posts/${user?.uid ?? "anon"}/${tempId}_${fileObj.name}`
        );

        await uploadBytes(storageRef, fileObj);
        const url = await getDownloadURL(storageRef);

        attachmentData = {
          url,
          type: fileObj.type,
          name: fileObj.name,
          size: fileObj.size,
        };
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
        attachment: attachmentData || null,
        timestamp: serverTimestamp(),
        likes: 0,
        visibility: isPrivate ? "private" : "public",
      });

      const newPost: PostData = {
        id: docRef.id,
        author,
        avatar,
        photoURL: photoURL || undefined,
        content: content.trim(),
        attachment: attachmentData,
        timestamp: Date.now(),
        likes: 0,
      };
      console.log("CreatePost onPost dispatch", newPost.id);
      onPost(newPost);

      // Reset form
      setContent("");
      setFileObj(null);
      setPreviewUrl(null);
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="What's burning? 🔥"
            className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/40 text-lg resize-none min-h-[80px]"
          />

          {fileObj && (
            <div className="relative inline-block mt-2">
              {/* Preview Rendering based on type */}
              {fileObj.type.startsWith("image/") && previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-32 w-auto rounded-lg border border-white/20 object-cover"
                />
              ) : fileObj.type.startsWith("video/") && previewUrl ? (
                <video
                  src={previewUrl}
                  className="h-32 w-auto rounded-lg border border-white/20 bg-black"
                  controls={false} // Just a thumbnail feel
                />
              ) : (
                <div className="h-16 flex items-center gap-3 bg-white/10 rounded-lg px-4 border border-white/20">
                  <div className="font-bold text-white text-sm truncate max-w-[150px]">
                    {fileObj.name}
                  </div>
                  <div className="text-white/50 text-xs">
                    {(fileObj.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setFileObj(null);
                  setPreviewUrl(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute -top-2 -right-2 bg-black/80 rounded-full p-1 text-white hover:bg-black transition-colors border border-white/20"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-white/10 pt-4">
            {!fileObj ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-orange-400 hover:text-orange-300 transition-colors p-2 rounded-full hover:bg-orange-500/10"
              >
                <ImageIcon size={20} />
              </button>
            ) : (
              <div />
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              // accept="image/*" // Removed to allow all files
              onChange={handleFileSelect}
            />

            <div className="flex items-center gap-3">
              <span
                className={`text-xs ${
                  content.length > 400
                    ? "text-red-500 font-bold"
                    : "text-white/40"
                }`}
              >
                {content.length}/400
              </span>
              <button
                type="submit"
                disabled={
                  submitting ||
                  (!content.trim() && !fileObj) ||
                  content.length > 400
                }
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full font-bold text-sm hover:from-orange-400 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg hover:shadow-orange-500/25"
              >
                <Send size={16} />
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

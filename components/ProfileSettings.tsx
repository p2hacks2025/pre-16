"use client";

import React, { useState } from "react";
import { UserProfile } from "@/hooks/useProfile";
import { Save, User } from "lucide-react";

interface ProfileSettingsProps {
  profile: UserProfile | null;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
}

const GRADIENT_OPTIONS = [
  { name: "Fire", value: "from-orange-500 to-red-600" },
  { name: "Ocean", value: "from-blue-500 to-cyan-600" },
  { name: "Forest", value: "from-green-400 to-emerald-600" },
  { name: "Sunset", value: "from-pink-500 to-purple-600" },
  { name: "Gold", value: "from-yellow-400 to-orange-500" },
  { name: "Night", value: "from-indigo-500 to-purple-700" },
  { name: "Rose", value: "from-rose-400 to-pink-600" },
  { name: "Electric", value: "from-cyan-400 to-blue-600" },
];

export function ProfileSettings({ profile, onSave }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [avatarGradient, setAvatarGradient] = useState(
    profile?.avatarGradient || "from-orange-500 to-red-600"
  );
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      // Storage にアップロード
      const storageRef = await import("firebase/storage").then(m => m.ref);
      const uploadBytes = await import("firebase/storage").then(m => m.uploadBytes);
      const getDownloadURL = await import("firebase/storage").then(m => m.getDownloadURL);
      const storage = await import("@/lib/firebase").then(m => m.storage);
      
      const imgRef = storageRef(storage, `avatars/${profile.uid}/${Date.now()}`);
      await uploadBytes(imgRef, file);
      const url = await getDownloadURL(imgRef);
      
      setPhotoURL(url);
    } catch (err) {
      console.error("Failed to upload image", err);
      alert("画像のアップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setSaving(true);
    try {
      await onSave({
        displayName: displayName.trim(),
        avatarGradient,
        photoURL: photoURL || undefined,
      });
    } catch (err) {
      console.error("Failed to save profile", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form
        onSubmit={handleSubmit}
        className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6"
      >
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <User size={24} className="text-orange-400" />
          <h2 className="text-2xl font-bold">プロフィール設定</h2>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label htmlFor="displayName" className="block text-sm font-medium text-white/80">
            表示名
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="ニックネームを入力"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all"
            maxLength={30}
          />
          <p className="text-xs text-white/40">{displayName.length}/30</p>
        </div>

        {/* Avatar Image Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white/80">
            プロフィール画像
          </label>
          <div className="flex items-center gap-4">
            {photoURL ? (
              <img
                src={photoURL}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div className={`w-16 h-16 rounded-full bg-liner-to-tr ${avatarGradient} flex items-center justify-center text-white font-bold text-xl`}>
                {displayName[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="flex-1 space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 disabled:opacity-50 transition-all"
              >
                {uploading ? "アップロード中..." : "画像を選択"}
              </button>
              {photoURL && (
                <button
                  type="button"
                  onClick={() => setPhotoURL("")}
                  className="ml-2 px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition-all"
                >
                  削除
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <p className="text-xs text-white/40">
                画像をアップロード
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/80">
            プレビュー
          </label>
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
            {photoURL ? (
              <img
                src={photoURL}
                alt="Preview"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div
                className={`w-12 h-12 rounded-full bg-liner-to-tr ${avatarGradient} flex items-center justify-center text-white font-bold`}
              >
                {displayName[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <p className="font-bold">{displayName || "ニックネーム"}</p>
              <p className="text-sm text-white/40">
                @{(displayName || "username").toLowerCase().replace(/\s+/g, "")}
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving || !displayName.trim()}
          className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
        >
          <Save size={18} />
          {saving ? "保存中..." : "保存"}
        </button>
      </form>
    </div>
  );
}

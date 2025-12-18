"use client";

import React, { useState } from "react";
import Image from "next/image";
import { UserProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Save, User, LogOut, X } from "lucide-react";

interface ProfileSettingsProps {
  profile: UserProfile | null;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
  onClose?: () => void;
}

export function ProfileSettings({
  profile,
  onSave,
  onClose,
}: ProfileSettingsProps) {
  const { logout } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [avatarGradient, setAvatarGradient] = useState(
    profile?.avatarGradient || "from-orange-500 to-red-600"
  );
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /* 
    Sync state with profile prop when it updates (e.g. from loading -> loaded).
    This fixes the issue where opening settings with loading profile results in empty fields. 
  */
  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setAvatarGradient(profile.avatarGradient || "from-orange-500 to-red-600");
      setPhotoURL(profile.photoURL || "");
    }
  }, [profile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      // Dynamic import usage was failing or weird, let's use the globals we likely have or will standard import
      const { ref, uploadBytes, getDownloadURL } = await import(
        "firebase/storage"
      );
      const { storage } = await import("@/lib/firebase");

      const imgRef = ref(storage, `avatars/${profile.uid}/${Date.now()}`);
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
      alert("プロフィールを更新しました"); // Add feedback
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
        className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6 relative"
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <User size={24} className="text-orange-400" />
          <h2 className="text-2xl font-bold">プロフィール設定</h2>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label
            htmlFor="displayName"
            className="block text-sm font-medium text-white/80"
          >
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
              <Image
                src={photoURL}
                alt="Avatar"
                className="rounded-full object-cover border-2 border-white/20 w-16 h-16"
                width={64}
                height={64}
                unoptimized
              />
            ) : (
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white font-bold text-xl`}
              >
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
              <p className="text-xs text-white/40">画像をアップロード</p>
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
              <Image
                src={photoURL}
                alt="Preview"
                className="rounded-full object-cover w-12 h-12"
                width={48}
                height={48}
                unoptimized
              />
            ) : (
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-white font-bold`}
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

        {/* App Settings */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          <h3 className="text-lg font-bold text-white/90">アプリ設定</h3>
          <div className="flex items-center justify-between">
            <label
              htmlFor="hideNegative"
              className="text-sm font-medium text-white/80"
            >
              ネガティブな投稿を非表示にする
            </label>
            <HideNegativeToggle />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full px-6 py-3 bg-white/5 text-red-400 rounded-lg font-bold hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            ログアウト
          </button>
        </div>
      </form>
    </div>
  );
}

function HideNegativeToggle() {
  const [enabled, setEnabled] = useState(false);

  React.useEffect(() => {
    const v = localStorage.getItem("hanabi_hide_negative") === "true";
    setEnabled(v);
  }, []);

  const toggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    localStorage.setItem("hanabi_hide_negative", String(newValue));
    // Dispatch event so other tabs/components know immediately
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${
        enabled ? "bg-orange-500" : "bg-white/20"
      }`}
    >
      <span
        className={`${
          enabled ? "translate-x-6" : "translate-x-1"
        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
      />
    </button>
  );
}

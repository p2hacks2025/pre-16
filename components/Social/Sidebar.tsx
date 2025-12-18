"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

import { Home, MoreHorizontal, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface SidebarProps {
  onPostClick?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export function Sidebar({
  onPostClick,
  soundEnabled = false,
  onToggleSound,
}: SidebarProps) {
  const { user } = useAuth();
  const { profile } = useProfile(user);

  const navItems = [{ icon: Home, label: "夜空", href: "/sns", active: true }];

  // Unused variables removed

  return (
    <div className="sticky top-0 h-screen w-[275px] shrink-0 flex flex-col justify-between px-4 py-4 border-r border-white/20 overflow-y-auto hidden lg:flex">
      <div className="flex flex-col gap-2">
        {/* Logo + Volume */}
        <div className="flex items-center justify-between w-full gap-3 mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-3xl font-black bg-gradient-to-br from-pink-500 via-orange-500 to-blue-500 bg-clip-text text-transparent tracking-tighter drop-shadow-[0_0_10px_rgba(236,72,153,0.5)] leading-none select-none"
          >
            HANABI
          </Link>
          <button
            type="button"
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? "音量ON" : "音量OFF"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSound?.();
            }}
            disabled={!onToggleSound}
            className="relative inline-flex h-10 w-10 items-center justify-center bg-black/40 text-white transition-colors hover:border-orange-400/70 hover:text-orange-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-full text-xl transition-all duration-300 ${
                item.active
                  ? "font-bold text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] bg-white/5 border border-white/10"
                  : "font-normal text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <item.icon
                size={26}
                strokeWidth={item.active ? 3 : 2}
                className={
                  item.active
                    ? "text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                    : ""
                }
              />
              <span
                className={
                  item.active
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500"
                    : ""
                }
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Post Button -> Ignite Button */}
        <button
          onClick={onPostClick}
          className="mt-6 w-full relative group overflow-hidden rounded-full p-[1px]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 animate-gradient" />
          <div className="relative bg-black/20 backdrop-blur-sm hover:bg-white/10 text-white font-black text-xl py-3 rounded-full transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.6)] group-hover:shadow-[0_0_30px_rgba(249,115,22,0.8)] border border-white/20">
            <span className="bg-gradient-to-r from-orange-200 to-white bg-clip-text text-transparent drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]">
              発火
            </span>
            <span className="text-xs font-normal text-white/70 tracking-widest">
              IGNITE
            </span>
          </div>
        </button>
      </div>

      {/* User Profile Mini-Card at Bottom */}

      {user ? (
        <Link
          href="/sns?tab=settings"
          className="mb-4 flex items-center gap-3 p-3 rounded-full hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-white/10"
        >
          {profile?.photoURL ? (
            <Image
              src={profile.photoURL}
              alt={profile.displayName}
              className="rounded-full object-cover shadow-[0_0_10px_rgba(59,130,246,0.5)] w-10 h-10"
              width={40}
              height={40}
              unoptimized
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-tr ${
                profile?.avatarGradient || "from-blue-500 to-purple-600"
              } shadow-[0_0_10px_rgba(59,130,246,0.5)]`}
            />
          )}

          <div className="flex-1 overflow-hidden">
            <p className="font-bold truncate text-white">
              {profile?.displayName || "Guest"}
            </p>
            <p className="text-white/50 text-sm truncate">
              @{user.uid.slice(0, 8)}...
            </p>
          </div>
          <MoreHorizontal size={18} className="text-white/50" />
        </Link>
      ) : (
        <div className="mb-4 flex items-center gap-3 p-3">
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div className="flex-1">
            <p className="text-white/50 text-sm">Guest User</p>
          </div>
        </div>
      )}
    </div>
  );
}

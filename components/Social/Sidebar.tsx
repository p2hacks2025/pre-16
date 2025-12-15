"use client";

import React from "react";
import Link from "next/link";
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  Users,
  User,
  MoreHorizontal,
  Feather,
} from "lucide-react";

interface SidebarProps {
  onPostClick?: () => void;
}

export function Sidebar({ onPostClick }: SidebarProps) {
  const navItems = [
    { icon: Home, label: "夜空 (Night Sky)", href: "/sns", active: true },
    { icon: Search, label: "火種を探す", href: "#" },
    { icon: Bell, label: "通知", href: "#" },
    { icon: Mail, label: "チャット", href: "#" },
  ];

  return (
    <div className="sticky top-0 h-screen w-[275px] shrink-0 flex flex-col justify-between px-4 py-4 border-r border-white/20 overflow-y-auto hidden lg:flex">
      <div className="flex flex-col gap-2">
        {/* Logo Area */}
        <Link href="/" className="flex items-center gap-2 mb-4 px-2">
          <span className="text-3xl font-black bg-gradient-to-br from-pink-500 via-orange-500 to-blue-500 bg-clip-text text-transparent tracking-tighter drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
            HANABI
          </span>
        </Link>

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
      <div className="mb-4 flex items-center gap-3 p-3 rounded-full hover:bg-white/10 cursor-pointer transition-colors border border-transparent hover:border-white/10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
        <div className="flex-1 overflow-hidden">
          <p className="font-bold truncate text-white">Current User</p>
          <p className="text-white/50 text-sm truncate">@username</p>
        </div>
        <MoreHorizontal size={18} className="text-white/50" />
      </div>
    </div>
  );
}

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
    { icon: Home, label: "ホーム", href: "/sns", active: true },
    { icon: Search, label: "話題を検索", href: "#" },
    { icon: Bell, label: "通知", href: "#" },
    { icon: Mail, label: "チャット", href: "#" },
  ];

  return (
    <div className="sticky top-0 h-screen w-[275px] shrink-0 flex flex-col justify-between px-4 py-4 border-r border-white/20 overflow-y-auto hidden lg:flex">
      <div className="flex flex-col gap-2">
        {/* Logo Area */}
        <Link href="/" className="flex items-center gap-2 mb-4 px-2">
          <span className="text-3xl font-black bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 bg-clip-text text-transparent animate-gradient tracking-tighter">
            HANABI
          </span>
        </Link>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-full text-xl transition-colors ${
                item.active ? "font-bold" : "font-normal"
              } hover:bg-white/10`}
            >
              <item.icon
                size={26}
                strokeWidth={item.active ? 3 : 2}
                className={item.active ? "fill-white text-white" : ""}
              />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Post Button */}
        <button
          onClick={onPostClick}
          className="mt-4 w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-lg py-3 rounded-full hover:from-orange-400 hover:to-red-500 transition-all shadow-lg hover:shadow-orange-500/25"
        >
          ポストする
        </button>
      </div>

      {/* User Profile Mini-Card at Bottom */}
      <div className="mb-4 flex items-center gap-3 p-3 rounded-full hover:bg-white/10 cursor-pointer transition-colors">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-600" />
        <div className="flex-1 overflow-hidden">
          <p className="font-bold truncate">Current User</p>
          <p className="text-white/50 text-sm truncate">@username</p>
        </div>
        <MoreHorizontal size={18} />
      </div>
    </div>
  );
}

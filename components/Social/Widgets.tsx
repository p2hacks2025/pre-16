"use client";

import React from "react";
import { Search } from "lucide-react";

export function Widgets() {
  return (
    <div className="hidden xl:flex flex-col gap-4 w-[350px] shrink-0 pl-8 py-4 h-screen sticky top-0 overflow-y-auto">
      {/* Search Bar */}
      <div className="sticky top-0 bg-black pb-2 z-10">
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-orange-500">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="検索"
            className="w-full bg-[#202327] outline-none border border-transparent focus:border-orange-500/50 focus:bg-black text-white pl-12 pr-4 py-3 rounded-full transition-all"
          />
        </div>
      </div>

      {/* Premium Subscribe Box */}
      <div className="bg-[#16181c] rounded-2xl p-4 flex flex-col gap-2">
        <h2 className="font-bold text-xl">プレミアムにサブスクライブ</h2>
        <p className="text-sm text-white/80">
          サブスクライブして新機能を利用しましょう。資格を満たしている場合、収益配分を受け取れます。
        </p>
        <button className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-2 px-4 rounded-full self-start hover:from-orange-400 hover:to-red-500 transition-all shadow-lg hover:shadow-orange-500/25">
          サブスクライブする
        </button>
      </div>

      {/* What's Happening */}
      <div className="bg-[#16181c] rounded-2xl pt-4">
        <h2 className="font-bold text-xl px-4 mb-4">本日のニュース</h2>

        {[
          {
            category: "イベント · ライブ",
            title: "M-1グランプリ2025審査員に後藤&駒場が初参加",
            meta: "2時間前 · エンターテイメント · 14,459件のポスト",
            img: "bg-red-500",
          },
          {
            category: "ライブ · トレンド",
            title:
              "「アイマス」20周年ライブ Day2、京セラドームで全シリーズキャスト集結",
            meta: "2日前 · エンターテイメント · 27,013件のポスト",
            img: "bg-blue-500",
          },
          {
            category: "スポーツ · トレンド",
            title: "ヴィッセル神戸、スキッベ氏を2026シーズン新監督に迎える",
            meta: "1時間前 · スポーツ · 3,879件のポスト",
            img: "bg-green-500",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors flex justify-between gap-2"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-white/50">{item.category}</span>
              <span className="font-bold text-sm leading-tight">
                {item.title}
              </span>
              <span className="text-xs text-white/50">{item.meta}</span>
            </div>
            <div className={`w-16 h-16 rounded-xl ${item.img} flex-shrink-0`} />
          </div>
        ))}
        <div className="p-4 text-orange-400 text-sm hover:bg-white/5 cursor-pointer rounded-b-2xl">
          もっと見る
        </div>
      </div>

      {/* Who to Follow */}
      <div className="bg-[#16181c] rounded-2xl pt-4">
        <h2 className="font-bold text-xl px-4 mb-4">おすすめユーザー</h2>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20" />
              <div className="flex flex-col">
                <span className="font-bold hover:underline">User {i}</span>
                <span className="text-white/50 text-sm">@user_{i}</span>
              </div>
            </div>
            <button className="bg-white text-black font-bold text-sm py-1.5 px-4 rounded-full hover:bg-white/90">
              フォロー
            </button>
          </div>
        ))}
        <div className="p-4 text-orange-400 text-sm hover:bg-white/5 cursor-pointer rounded-b-2xl">
          もっと見る
        </div>
      </div>
    </div>
  );
}

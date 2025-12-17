"use client";

import { useState } from "react";
import { UploadMode } from "@/components/UploadMode";
import { RealTimeFire } from "@/components/RealTimeFire";
import { Introduction } from "@/components/Introduction";
import { Login } from "@/components/Login";
import { ProfileSettings } from "@/components/ProfileSettings";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  Camera,
  Image as ImageIcon,
  Info,
  Users,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface NavButtonProps {
  isActive?: boolean;
  icon?: React.ElementType;
  label: string;
  onClick?: () => void;
  href?: string;
}

function NavButton({
  isActive,
  icon: Icon,
  label,
  onClick,
  href,
}: NavButtonProps) {
  const isLink = !!href;

  const content = (
    <>
      {Icon && (
        <Icon
          size={18}
          className={`transition-colors duration-300 ${
            isActive ? "text-orange-400" : "text-current"
          }`}
        />
      )}
      <span
        className={`font-medium whitespace-nowrap transition-all duration-300 hidden sm:inline ${
          isActive
            ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            : ""
        }`}
      >
        {label}
      </span>
      {isActive && (
        <div className="absolute bottom-1 left-3 sm:left-6 right-3 sm:right-6 h-[2px] bg-gradient-to-r from-orange-400 to-red-600 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
      )}
    </>
  );

const baseClasses = `relative flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-full transition-all duration-300 group overflow-hidden whitespace-nowrap text-sm sm:text-base ${
    isActive
      ? "bg-white/10 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/20"
      : "text-white/40 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/5"
  }`;

  if (isLink && href) {
    return (
      <Link href={href} className={baseClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseClasses}>
      {content}
    </button>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const { profile, updateProfile } = useProfile(user);

  const [activeTab, setActiveTab] = useState<
    "intro" | "upload" | "camera" | "login" | "settings"
  >("intro");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-black text-white selection:bg-orange-500/30">
      <div className="max-w-5xl w-full flex flex-col items-center gap-8 sm:gap-12">
        <header className="text-center space-y-4">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter bg-gradient-to-br from-orange-400 via-red-500 to-purple-600 bg-clip-text text-transparent animate-gradient drop-shadow-sm p-2">
            HANABI
          </h1>
        </header>

        {/* Tab Navigation */}
        <div className="flex p-1 sm:p-1.5 bg-black/40 rounded-full border border-white/10 backdrop-blur-xl overflow-x-auto max-w-full shadow-2xl gap-1 sm:gap-0">
          <NavButton
            isActive={activeTab === "intro"}
            icon={Info}
            label="About"
            onClick={() => setActiveTab("intro")}
          />
          <NavButton
            href="/sns"
            icon={Users}
            label="SNS"
            isActive={false} // Link is always inactive in this view
          />
          <NavButton
            isActive={activeTab === "upload"}
            icon={ImageIcon}
            label="Photo Upload"
            onClick={() => setActiveTab("upload")}
          />
          <NavButton
            isActive={activeTab === "camera"}
            icon={Camera}
            label="Real-time Camera"
            onClick={() => setActiveTab("camera")}
          />
          {!user ? (
            <NavButton
              isActive={activeTab === "login"}
              label="Login"
              onClick={() => setActiveTab("login")}
            />
          ) : (
            <NavButton
              isActive={activeTab === "settings"}
              icon={Settings}
              label="Settings"
              onClick={() => setActiveTab("settings")}
            />
          )}
        </div>

        {/* Content Area */}
        <div className="w-full flex justify-center min-h-[400px] animate-in fade-in duration-500 px-0">
          {activeTab === "intro" && <Introduction />}
          {activeTab === "upload" && <UploadMode />}
          {activeTab === "camera" && <RealTimeFire />}
          {activeTab === "login" && <Login />}
          {activeTab === "settings" &&
            (loading ? (
              <div className="text-white/70">Loading profile...</div>
            ) : user ? (
              <ProfileSettings profile={profile} onSave={updateProfile} />
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-white/70">
                  設定を変更するにはログインしてください。
                </p>
                <Login />
              </div>
            ))}
        </div>
      </div>
    </main>
  );
}

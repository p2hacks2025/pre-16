import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "firebase/auth";

export interface UserProfile {
  uid: string;
  displayName: string;
  avatarGradient: string; // Tailwind gradient classes
  photoURL?: string;
  createdAt?: number;
  updatedAt?: number;
}

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(null);

      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          // 初回ログイン時にデフォルトプロフィールを作成
          const defaultProfile: UserProfile = {
            uid: user.uid,
            displayName:
              user.displayName || user.email?.split("@")[0] || "Dragon Master",
            avatarGradient: "from-orange-500 to-red-600",
            photoURL: user.photoURL || undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setDoc(doc(db, "users", user.uid), defaultProfile);
          setProfile(defaultProfile);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Profile subscription error", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated: UserProfile = {
      ...profile!,
      ...updates,
      updatedAt: Date.now(),
    };
    await setDoc(doc(db, "users", user.uid), updated);
  };

  return { profile, loading, updateProfile };
}

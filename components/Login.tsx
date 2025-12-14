import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

export const Login = () => {
  const { user, loading } = useAuth();

  const handleLogin = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return <div className="text-white/70">Checking auth...</div>;
  }

  if (user) {
    return (
      <div className="flex flex-col items-center gap-3">
        <h2 className="text-xl font-semibold">Logged in</h2>
        <p className="text-white/70 text-sm">
          {user.displayName ?? user.email ?? "No name"}
        </p>
        <button
          onClick={handleLogout}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-bold">Login with Google</h2>
      <button
        onClick={handleLogin}
        className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
      >
        Sign in
      </button>
    </div>
  );
};
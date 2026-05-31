import { useState, useEffect } from "react";
import { getMe } from "@/services/smmApi";
import type { User } from "@/services/smmApi";
import AuthPage from "./AuthPage";
import ExecutorDashboard from "./ExecutorDashboard";
import AdvertiserDashboard from "./AdvertiserDashboard";

export default function SMMApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("smm_token");
    if (!token) { setLoading(false); return; }
    getMe().then(setUser).catch(() => localStorage.removeItem("smm_token")).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0f0e17" }}>
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <AuthPage onAuth={setUser} />;

  if (user.role === "executor") return <ExecutorDashboard user={user} onLogout={() => setUser(null)} />;

  return <AdvertiserDashboard user={user} onLogout={() => setUser(null)} />;
}

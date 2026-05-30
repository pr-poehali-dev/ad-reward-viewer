import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import HomeScreen from "@/pages/HomeScreen";
import WithdrawScreen from "@/pages/WithdrawScreen";
import HistoryScreen, { HistoryItem } from "@/pages/HistoryScreen";
import ProfileScreen, { UserProfile } from "@/pages/ProfileScreen";

const USER_SYNC_URL = "https://functions.poehali.dev/15c13869-929f-4bc3-9a17-40ae69ec35b0";

type Tab = "home" | "withdraw" | "history" | "profile";

let nextId = 1;

function getDeviceId(): string {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("device_id", id);
  }
  return id;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    deviceId: getDeviceId(),
    yoomoneyWallet: "",
    frikassaWallet: "",
  });

  useEffect(() => {
    const deviceId = getDeviceId();
    fetch(USER_SYNC_URL, {
      method: "GET",
      headers: { "X-Device-Id": deviceId },
    })
      .then((r) => r.json())
      .then((data) => {
        setBalance(data.balance || 0);
        setProfile({
          deviceId,
          yoomoneyWallet: data.yoomoney_wallet || "",
          frikassaWallet: data.frikassa_wallet || "",
        });
      })
      .catch(() => {});
  }, []);

  const handleAdWatched = (reward: number) => {
    const deviceId = getDeviceId();
    setBalance((b) => b + reward);
    setHistory((h) => [...h, { id: nextId++, amount: reward, date: new Date(), type: "ad" }]);
    fetch(USER_SYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Device-Id": deviceId },
      body: JSON.stringify({ action: "add_balance", amount: reward, device_id: deviceId }),
    }).catch(() => {});
  };

  const handleWithdrawn = (amount: number) => {
    setBalance((b) => b - amount);
    setHistory((h) => [...h, { id: nextId++, amount, date: new Date(), type: "withdraw" }]);
  };

  const handleSaveProfile = (updated: UserProfile) => {
    setProfile(updated);
    fetch(USER_SYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Device-Id": updated.deviceId },
      body: JSON.stringify({
        action: "update_profile",
        device_id: updated.deviceId,
        yoomoney_wallet: updated.yoomoneyWallet,
        frikassa_wallet: updated.frikassaWallet,
      }),
    }).catch(() => {});
  };

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "home", icon: "Play", label: "Реклама" },
    { id: "withdraw", icon: "Banknote", label: "Вывод" },
    { id: "history", icon: "ClipboardList", label: "История" },
    { id: "profile", icon: "User", label: "Профиль" },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#0f1923", fontFamily: "'Montserrat', sans-serif" }}
    >
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: "min(100vw, 390px)",
          height: "min(100vh, 844px)",
          background: "linear-gradient(160deg, #1a3a6e 0%, #0d2550 40%, #081840 100%)",
        }}
      >
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #60a5fa, transparent)", transform: "translate(40%, -40%)" }}
        />
        <div
          className="absolute bottom-20 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #818cf8, transparent)", transform: "translate(-40%, 20%)" }}
        />

        <div className="flex-1 overflow-y-auto relative z-10">
          {tab === "home" && (
            <HomeScreen balance={balance} onAdWatched={handleAdWatched} />
          )}
          {tab === "withdraw" && (
            <WithdrawScreen
              balance={balance}
              deviceId={profile.deviceId}
              frikassaWallet={profile.frikassaWallet}
              onWithdrawn={handleWithdrawn}
              onGoProfile={() => setTab("profile")}
            />
          )}
          {tab === "history" && (
            <HistoryScreen history={history} balance={balance} />
          )}
          {tab === "profile" && (
            <ProfileScreen profile={profile} onSave={handleSaveProfile} balance={balance} />
          )}
        </div>

        <div
          className="relative z-10 flex items-center justify-around px-2 py-2 border-t"
          style={{
            background: "rgba(8,24,64,0.97)",
            backdropFilter: "blur(20px)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {tabs.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200 active:scale-95"
                style={{ background: isActive ? "rgba(255,255,255,0.12)" : "transparent" }}
              >
                <Icon name={t.icon} size={20} className={isActive ? "text-white" : "text-blue-400"} />
                <span
                  className="text-xs font-bold"
                  style={{ color: isActive ? "#fff" : "rgba(147,197,253,0.7)" }}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
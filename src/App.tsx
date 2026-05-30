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
  const [showInstall, setShowInstall] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void } | null>(null);

  useEffect(() => {
    const alreadyDismissed = localStorage.getItem("install_dismissed");
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone || alreadyDismissed) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    if (ios) {
      setTimeout(() => setShowInstall(true), 2000);
    } else {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as Event & { prompt: () => void });
        setTimeout(() => setShowInstall(true), 2000);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    }
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      setShowInstall(false);
    }
  };

  const handleDismiss = () => {
    setShowInstall(false);
    localStorage.setItem("install_dismissed", "1");
  };

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

        {/* Баннер «Установи на телефон» */}
        {showInstall && (
          <div
            className="absolute bottom-20 left-3 right-3 z-50 rounded-2xl px-4 py-4 flex flex-col gap-3"
            style={{
              background: "linear-gradient(135deg, #1e3a8a, #1d4ed8)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl p-2.5">
                  <Icon name="Smartphone" size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-black text-sm">Установи на телефон!</p>
                  <p className="text-blue-200 text-xs">Работает как настоящее приложение</p>
                </div>
              </div>
              <button onClick={handleDismiss} className="text-white/40 hover:text-white/70 mt-0.5">
                <Icon name="X" size={18} />
              </button>
            </div>

            {isIOS ? (
              <div className="bg-white/10 rounded-xl px-3 py-2.5 space-y-1.5">
                <p className="text-white text-xs font-semibold">Как установить на iPhone:</p>
                <div className="flex items-center gap-2">
                  <span className="text-blue-300 text-xs">1.</span>
                  <span className="text-blue-100 text-xs">Нажмите</span>
                  <Icon name="Share" size={13} className="text-blue-300" />
                  <span className="text-blue-100 text-xs">внизу браузера</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-300 text-xs">2.</span>
                  <span className="text-blue-100 text-xs">Выберите «На экран Домой»</span>
                  <Icon name="PlusSquare" size={13} className="text-blue-300" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-300 text-xs">3.</span>
                  <span className="text-blue-100 text-xs">Нажмите «Добавить» — готово!</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="w-full py-2.5 rounded-xl font-black text-sm text-blue-700 transition-all active:scale-95"
                style={{ background: "#fff" }}
              >
                Установить приложение
              </button>
            )}
          </div>
        )}

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
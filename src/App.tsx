import { useState } from "react";
import Icon from "@/components/ui/icon";
import HomeScreen from "@/pages/HomeScreen";
import WithdrawScreen from "@/pages/WithdrawScreen";
import HistoryScreen, { HistoryItem } from "@/pages/HistoryScreen";

type Tab = "home" | "withdraw" | "history";

let nextId = 1;

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handleAdWatched = (reward: number) => {
    setBalance((b) => b + reward);
    setHistory((h) => [
      ...h,
      { id: nextId++, amount: reward, date: new Date(), type: "ad" },
    ]);
  };

  const handleWithdraw = (amount: number) => {
    setBalance((b) => b - amount);
    setHistory((h) => [
      ...h,
      { id: nextId++, amount, date: new Date(), type: "withdraw" },
    ]);
  };

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: "home", icon: "Play", label: "Реклама" },
    { id: "withdraw", icon: "Banknote", label: "Вывод" },
    { id: "history", icon: "ClipboardList", label: "История" },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#0f1923", fontFamily: "'Montserrat', sans-serif" }}
    >
      {/* Phone frame */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: "min(100vw, 390px)",
          height: "min(100vh, 844px)",
          background: "linear-gradient(160deg, #1a3a6e 0%, #0d2550 40%, #081840 100%)",
        }}
      >
        {/* Background decorations */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #60a5fa, transparent)",
            transform: "translate(40%, -40%)",
          }}
        />
        <div
          className="absolute bottom-20 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{
            background: "radial-gradient(circle, #818cf8, transparent)",
            transform: "translate(-40%, 20%)",
          }}
        />

        {/* Content */}
        <div className="flex-1 overflow-hidden relative z-10">
          {tab === "home" && (
            <HomeScreen balance={balance} onAdWatched={handleAdWatched} />
          )}
          {tab === "withdraw" && (
            <WithdrawScreen balance={balance} onWithdraw={handleWithdraw} />
          )}
          {tab === "history" && (
            <HistoryScreen history={history} balance={balance} />
          )}
        </div>

        {/* Bottom navigation */}
        <div
          className="relative z-10 flex items-center justify-around px-4 py-3 border-t"
          style={{
            background: "rgba(8, 24, 64, 0.95)",
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
                className={`flex flex-col items-center gap-1 px-5 py-2 rounded-2xl transition-all duration-200 active:scale-95 ${
                  isActive ? "bg-white/15" : ""
                }`}
              >
                <Icon
                  name={t.icon}
                  size={22}
                  className={isActive ? "text-white" : "text-blue-400"}
                />
                <span
                  className={`text-xs font-bold ${
                    isActive ? "text-white" : "text-blue-400"
                  }`}
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

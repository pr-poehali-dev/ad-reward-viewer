import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

export interface UserProfile {
  deviceId: string;
  yoomoneyWallet: string;
  frikassaWallet: string;
}

interface ProfileScreenProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  balance: number;
}

export default function ProfileScreen({ profile, onSave, balance }: ProfileScreenProps) {
  const [yoomoney, setYoomoney] = useState(profile.yoomoneyWallet);
  const [frikassa, setFrikassa] = useState(profile.frikassaWallet);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setYoomoney(profile.yoomoneyWallet);
    setFrikassa(profile.frikassaWallet);
  }, [profile]);

  const handleSave = () => {
    onSave({ ...profile, yoomoneyWallet: yoomoney.trim(), frikassaWallet: frikassa.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasChanges =
    yoomoney.trim() !== profile.yoomoneyWallet ||
    frikassa.trim() !== profile.frikassaWallet;

  return (
    <div className="flex flex-col h-full px-6 py-10 gap-6">
      <div>
        <h1 className="text-white text-2xl font-black mb-1">Профиль</h1>
        <p className="text-blue-200 text-sm">Реквизиты для вывода средств</p>
      </div>

      {/* Balance card */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
      >
        <div>
          <p className="text-blue-100 text-xs font-medium">Текущий баланс</p>
          <p className="text-white text-3xl font-black">{balance} ₽</p>
        </div>
        <div className="bg-white/20 rounded-2xl p-3">
          <Icon name="Wallet" size={28} className="text-white" />
        </div>
      </div>

      {saved && (
        <div className="bg-green-500/20 border border-green-400/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Icon name="CheckCircle" size={18} className="text-green-400" />
          <span className="text-green-300 font-semibold text-sm">Реквизиты сохранены!</span>
        </div>
      )}

      {/* YooMoney */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="rounded-xl p-1.5"
            style={{ background: "#8B5CF6" }}
          >
            <Icon name="Wallet" size={14} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">ЮМани (YooMoney)</span>
        </div>
        <input
          type="text"
          value={yoomoney}
          onChange={(e) => setYoomoney(e.target.value)}
          placeholder="Номер кошелька 410011XXXXXXXXXX"
          className="w-full rounded-2xl px-4 py-3 text-white text-sm outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            fontFamily: "'Montserrat', sans-serif",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(139,92,246,0.6)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
        />
        <p className="text-blue-300 text-xs pl-1">Формат: 410011XXXXXXXXXX (16 цифр)</p>
      </div>

      {/* Frikassa */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div
            className="rounded-xl p-1.5"
            style={{ background: "#f59e0b" }}
          >
            <Icon name="Coins" size={14} className="text-white" />
          </div>
          <span className="text-white font-bold text-sm">Фрикасса (FreeKassa)</span>
        </div>
        <input
          type="text"
          value={frikassa}
          onChange={(e) => setFrikassa(e.target.value)}
          placeholder="Номер кошелька или счёта"
          className="w-full rounded-2xl px-4 py-3 text-white text-sm outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            fontFamily: "'Montserrat', sans-serif",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(245,158,11,0.6)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.12)")}
        />
        <p className="text-blue-300 text-xs pl-1">Укажите номер счёта в системе Фрикасса</p>
      </div>

      <div className="flex-1" />

      <button
        onClick={handleSave}
        disabled={!hasChanges}
        className="w-full py-4 rounded-2xl font-black text-base transition-all duration-200 active:scale-95"
        style={{
          background: hasChanges ? "#fff" : "rgba(255,255,255,0.1)",
          color: hasChanges ? "#1d4ed8" : "rgba(255,255,255,0.3)",
        }}
      >
        Сохранить реквизиты
      </button>

      <div className="flex items-start gap-3 bg-white/5 rounded-2xl px-4 py-3">
        <Icon name="ShieldCheck" size={16} className="text-blue-300 mt-0.5 shrink-0" />
        <p className="text-blue-200 text-xs leading-relaxed">
          Реквизиты хранятся безопасно и используются только для выплат вознаграждений.
        </p>
      </div>
    </div>
  );
}

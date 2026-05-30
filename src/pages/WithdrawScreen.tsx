import { useState } from "react";
import Icon from "@/components/ui/icon";

const WITHDRAW_URL = "https://functions.poehali.dev/9040abe8-ed07-4ea4-8bba-a16baae0c220";

interface WithdrawScreenProps {
  balance: number;
  deviceId: string;
  frikassaWallet: string;
  onWithdrawn: (amount: number) => void;
  onGoProfile: () => void;
}

const AMOUNTS = [10, 25, 50, 75, 100, 150, 200];

type System = "frikassa";

const SYSTEMS: { id: System; label: string; icon: string; color: string; field: "frikassaWallet" }[] = [
  { id: "frikassa", label: "Фрикасса", icon: "Coins", color: "#f59e0b", field: "frikassaWallet" },
];

export default function WithdrawScreen({
  balance,
  deviceId,
  frikassaWallet,
  onWithdrawn,
  onGoProfile,
}: WithdrawScreenProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [system, setSystem] = useState<System>("frikassa");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error" | "no_wallet">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const wallets = { frikassa: frikassaWallet };
  const currentWallet = wallets[system];
  const hasWallet = !!currentWallet;

  const handleWithdraw = async () => {
    if (!selected || loading) return;
    if (!hasWallet) {
      setStatus("no_wallet");
      return;
    }
    if (balance < selected) {
      setErrorMsg("Недостаточно средств на балансе");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(WITHDRAW_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Device-Id": deviceId },
        body: JSON.stringify({ amount: selected, system, wallet: currentWallet, device_id: deviceId }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onWithdrawn(selected);
        setSelected(null);
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setErrorMsg(data.error || "Ошибка при выводе");
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setErrorMsg("Ошибка соединения");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-6 py-10 gap-5">
      <div>
        <h1 className="text-white text-2xl font-black mb-1">Вывод средств</h1>
        <p className="text-blue-200 text-sm">Доступно: <span className="text-white font-bold">{balance} ₽</span></p>
      </div>

      {/* Статус */}
      {status === "success" && (
        <div className="bg-green-500/20 border border-green-400/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Icon name="CheckCircle" size={18} className="text-green-400" />
          <span className="text-green-300 font-semibold text-sm">Выплата отправлена!</span>
        </div>
      )}
      {status === "error" && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Icon name="AlertCircle" size={18} className="text-red-400" />
          <span className="text-red-300 font-semibold text-sm">{errorMsg}</span>
        </div>
      )}
      {status === "no_wallet" && (
        <div
          className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3 cursor-pointer"
          style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}
          onClick={onGoProfile}
        >
          <div className="flex items-center gap-2">
            <Icon name="AlertCircle" size={18} className="text-yellow-400" />
            <span className="text-yellow-300 font-semibold text-sm">Укажите кошелёк в профиле</span>
          </div>
          <Icon name="ChevronRight" size={16} className="text-yellow-400" />
        </div>
      )}

      {/* Выбор системы */}
      <div className="grid grid-cols-2 gap-3">
        {SYSTEMS.map((s) => {
          const active = system === s.id;
          const w = wallets[s.id];
          return (
            <button
              key={s.id}
              onClick={() => { setSystem(s.id); setStatus("idle"); }}
              className="rounded-2xl p-3 flex flex-col gap-1 transition-all duration-200 active:scale-95"
              style={{
                background: active ? `${s.color}25` : "rgba(255,255,255,0.07)",
                border: `1.5px solid ${active ? s.color : "rgba(255,255,255,0.1)"}`,
              }}
            >
              <div className="flex items-center gap-2">
                <div className="rounded-lg p-1" style={{ background: s.color }}>
                  <Icon name={s.icon} size={13} className="text-white" />
                </div>
                <span className="text-white text-sm font-bold">{s.label}</span>
                {active && <Icon name="CheckCircle" size={13} className="text-green-400 ml-auto" />}
              </div>
              <span className="text-xs truncate" style={{ color: w ? "rgba(255,255,255,0.5)" : "rgba(255,100,100,0.7)" }}>
                {w ? w : "не указан"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Суммы */}
      <div className="grid grid-cols-3 gap-2 flex-1">
        {AMOUNTS.map((amount) => {
          const isSelected = selected === amount;
          const isAffordable = balance >= amount;
          return (
            <button
              key={amount}
              onClick={() => isAffordable && setSelected(isSelected ? null : amount)}
              className="rounded-2xl py-3 px-2 flex flex-col items-center gap-0.5 transition-all duration-200 active:scale-95 relative"
              style={{
                background: isSelected ? "#fff" : isAffordable ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.04)",
                border: isSelected ? "none" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span className={`text-lg font-black ${isSelected ? "text-blue-700" : isAffordable ? "text-white" : "text-white/30"}`}>
                {amount}₽
              </span>
              {!isAffordable && (
                <span className="text-[10px] text-white/25">−{amount - balance}₽</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Кнопка */}
      <button
        onClick={handleWithdraw}
        disabled={!selected || loading}
        className="w-full py-4 rounded-2xl font-black text-base transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
        style={{
          background: selected && !loading ? "#fff" : "rgba(255,255,255,0.1)",
          color: selected && !loading ? "#1d4ed8" : "rgba(255,255,255,0.3)",
        }}
      >
        {loading ? (
          <>
            <Icon name="Loader" size={18} className="animate-spin" />
            <span>Отправка...</span>
          </>
        ) : selected ? (
          `Вывести ${selected} ₽ на Фрикасса`
        ) : (
          "Выберите сумму"
        )}
      </button>

      <div className="flex items-start gap-3 bg-white/5 rounded-2xl px-4 py-3">
        <Icon name="Clock" size={14} className="text-blue-300 mt-0.5 shrink-0" />
        <p className="text-blue-200 text-xs leading-relaxed">
          Обработка 1–3 рабочих дня. Реквизиты можно изменить в разделе «Профиль».
        </p>
      </div>
    </div>
  );
}
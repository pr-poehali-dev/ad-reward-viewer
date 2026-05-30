import { useState } from "react";
import Icon from "@/components/ui/icon";

interface WithdrawScreenProps {
  balance: number;
  onWithdraw: (amount: number) => void;
}

const AMOUNTS = [10, 25, 50, 75, 100, 150, 200];

export default function WithdrawScreen({ balance, onWithdraw }: WithdrawScreenProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleWithdraw = () => {
    if (!selected) return;
    if (balance < selected) {
      setShowError(true);
      setTimeout(() => setShowError(false), 2500);
      return;
    }
    onWithdraw(selected);
    setShowSuccess(true);
    setSelected(null);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  return (
    <div className="flex flex-col h-full px-6 py-10 gap-6">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-black mb-1">Вывод средств</h1>
        <p className="text-blue-200 text-sm">Доступно: <span className="text-white font-bold">{balance} ₽</span></p>
      </div>

      {/* Alert */}
      {showSuccess && (
        <div className="bg-green-500/20 border border-green-400/30 rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in">
          <Icon name="CheckCircle" size={20} className="text-green-400" />
          <span className="text-green-300 font-semibold text-sm">Заявка на вывод отправлена!</span>
        </div>
      )}
      {showError && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-2xl px-4 py-3 flex items-center gap-3">
          <Icon name="AlertCircle" size={20} className="text-red-400" />
          <span className="text-red-300 font-semibold text-sm">Недостаточно средств на балансе</span>
        </div>
      )}

      {/* Amount grid */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {AMOUNTS.map((amount) => {
          const isSelected = selected === amount;
          const isAffordable = balance >= amount;
          return (
            <button
              key={amount}
              onClick={() => setSelected(isSelected ? null : amount)}
              className={`rounded-2xl p-4 flex flex-col items-center gap-1 transition-all duration-200 active:scale-95 relative ${
                isSelected
                  ? "bg-white text-blue-700 shadow-lg shadow-white/20"
                  : isAffordable
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-white/5 text-white/40"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Icon name="CheckCircle" size={16} className="text-blue-500" />
                </div>
              )}
              <span className={`text-2xl font-black ${isSelected ? "text-blue-700" : "text-white"}`}>
                {amount} ₽
              </span>
              {!isAffordable && (
                <span className="text-xs text-white/30">не хватает {amount - balance} ₽</span>
              )}
              {isAffordable && !isSelected && (
                <span className="text-xs text-blue-300">доступно</span>
              )}
              {isSelected && (
                <span className="text-xs text-blue-500 font-semibold">выбрано</span>
              )}
            </button>
          );
        })}
      </div>

      {/* CTA Button */}
      <button
        onClick={handleWithdraw}
        disabled={!selected}
        className={`w-full py-4 rounded-2xl font-black text-lg transition-all duration-200 active:scale-95 ${
          selected
            ? "bg-white text-blue-700 shadow-lg shadow-white/20"
            : "bg-white/10 text-white/40 cursor-not-allowed"
        }`}
      >
        {selected ? `Вывести ${selected} ₽` : "Выберите сумму"}
      </button>

      {/* Info */}
      <div className="flex items-start gap-3 bg-white/5 rounded-2xl px-4 py-3">
        <Icon name="Clock" size={16} className="text-blue-300 mt-0.5 shrink-0" />
        <p className="text-blue-200 text-xs leading-relaxed">
          Вывод средств обрабатывается в течение 1–3 рабочих дней. Минимальная сумма — 10 ₽.
        </p>
      </div>
    </div>
  );
}

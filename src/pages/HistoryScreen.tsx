import Icon from "@/components/ui/icon";

export interface HistoryItem {
  id: number;
  amount: number;
  date: Date;
  type: "ad" | "withdraw";
}

interface HistoryScreenProps {
  history: HistoryItem[];
  balance: number;
}

function formatDate(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} мин назад`;
  if (hours < 24) return `${hours} ч назад`;

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryScreen({ history, balance }: HistoryScreenProps) {
  const totalEarned = history
    .filter((h) => h.type === "ad")
    .reduce((sum, h) => sum + h.amount, 0);

  const totalWithdrawn = history
    .filter((h) => h.type === "withdraw")
    .reduce((sum, h) => sum + h.amount, 0);

  return (
    <div className="flex flex-col h-full px-6 py-10 gap-6">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-black mb-1">История</h1>
        <p className="text-blue-200 text-sm">Все ваши вознаграждения и выводы</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="TrendingUp" size={16} className="text-green-400" />
            <span className="text-blue-200 text-xs">Заработано</span>
          </div>
          <p className="text-white text-xl font-black">🪙 {totalEarned.toLocaleString("ru-RU")}</p>
        </div>
        <div className="bg-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="ArrowUpRight" size={16} className="text-orange-400" />
            <span className="text-blue-200 text-xs">Выведено</span>
          </div>
          <p className="text-white text-xl font-black">🪙 {totalWithdrawn.toLocaleString("ru-RU")}</p>
        </div>
      </div>

      {/* Balance summary */}
      <div className="bg-gradient-to-r from-blue-600/40 to-blue-500/20 border border-blue-400/20 rounded-2xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-400/20 rounded-xl p-2">
            <Icon name="Wallet" size={20} className="text-blue-300" />
          </div>
          <span className="text-blue-100 font-semibold">Текущий баланс</span>
        </div>
        <span className="text-white text-xl font-black">🪙 {balance.toLocaleString("ru-RU")}</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-2">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="bg-white/5 rounded-full p-5">
              <Icon name="ClipboardList" size={32} className="text-blue-300" />
            </div>
            <p className="text-blue-200 text-sm text-center">
              История пуста.<br />Посмотрите рекламу, чтобы начать зарабатывать!
            </p>
          </div>
        ) : (
          [...history].reverse().map((item) => (
            <div
              key={item.id}
              className="bg-white/8 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-xl p-2 ${
                    item.type === "ad" ? "bg-green-400/15" : "bg-orange-400/15"
                  }`}
                >
                  {item.type === "ad" ? (
                    <Icon name="MonitorPlay" size={18} className="text-green-400" />
                  ) : (
                    <Icon name="ArrowUpRight" size={18} className="text-orange-400" />
                  )}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">
                    {item.type === "ad" ? "Просмотр рекламы" : "Вывод средств"}
                  </p>
                  <p className="text-blue-300 text-xs">{formatDate(item.date)}</p>
                </div>
              </div>
              <span
                className={`text-base font-black ${
                  item.type === "ad" ? "text-green-400" : "text-orange-400"
                }`}
              >
                {item.type === "ad" ? "+" : "-"}🪙 {item.amount.toLocaleString("ru-RU")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
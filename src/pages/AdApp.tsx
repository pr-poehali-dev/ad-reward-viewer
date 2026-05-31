import { useState, useEffect, useRef } from "react";
import { fetchProfile, fetchHistory, watchAd, withdraw, updateProfile, COINS_TO_RUB } from "@/services/adApi";
import type { UserProfile, HistoryItem } from "@/services/adApi";
import Icon from "@/components/ui/icon";

type Screen = "home" | "history" | "withdraw";

const ADS = [
  {
    id: 1,
    brand: "Яндекс Маркет",
    title: "Скидки до 70% на электронику",
    desc: "Только сегодня! Смартфоны, ноутбуки, наушники по минимальным ценам.",
    emoji: "🛒",
    color: "#FF6600",
    bg: "linear-gradient(135deg, #ff6600, #ff9900)",
  },
  {
    id: 2,
    brand: "Сбер Банк",
    title: "Кредит за 2 минуты",
    desc: "До 5 млн рублей без справок. Одобрение онлайн.",
    emoji: "💳",
    color: "#21A038",
    bg: "linear-gradient(135deg, #21a038, #4cbb6e)",
  },
  {
    id: 3,
    brand: "Авито",
    title: "Продай ненужное — заработай!",
    desc: "Миллионы покупателей уже ждут. Размести объявление бесплатно.",
    emoji: "📦",
    color: "#00AAFF",
    bg: "linear-gradient(135deg, #00aaff, #0077cc)",
  },
  {
    id: 4,
    brand: "Wildberries",
    title: "Мегараспродажа сезона",
    desc: "Одежда, обувь, косметика. Бесплатная доставка от 1000 ₽.",
    emoji: "🛍️",
    color: "#CB11AB",
    bg: "linear-gradient(135deg, #cb11ab, #8800aa)",
  },
  {
    id: 5,
    brand: "Тинькофф",
    title: "Карта с кешбэком 5%",
    desc: "Зарабатывай на каждой покупке. Обслуживание 0 ₽.",
    emoji: "💰",
    color: "#FFDD2D",
    bg: "linear-gradient(135deg, #ffdd2d, #ffa800)",
  },
];

function formatDate(str: string) {
  const d = new Date(str);
  return d.toLocaleString("ru", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function coinsToRub(coins: number) {
  return ((coins / COINS_TO_RUB) * 10).toFixed(2);
}

export default function AdApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [adIndex, setAdIndex] = useState(0);
  const [adPlaying, setAdPlaying] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [adDone, setAdDone] = useState(false);
  const [earnedPopup, setEarnedPopup] = useState(0);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  // withdraw form
  const [wallet, setWallet] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchProfile()
      .then((p) => { setProfile(p); setBalance(p.balance); setWallet(p.frikassa_wallet || ""); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (screen === "history") {
      fetchHistory().then(setHistory);
    }
  }, [screen]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  // Запуск рекламы
  const startAd = () => {
    if (adPlaying) return;
    setAdPlaying(true);
    setAdProgress(0);
    setAdDone(false);
    let progress = 0;
    timerRef.current = setInterval(() => {
      progress += 2;
      setAdProgress(progress);
      if (progress >= 100) {
        clearInterval(timerRef.current!);
        setAdPlaying(false);
        setAdDone(true);
      }
    }, 100); // 5 секунд (100 шагов по 100ms)
  };

  // Начислить монеты
  const claimReward = async () => {
    setAdDone(false);
    try {
      const res = await watchAd();
      setBalance(res.balance);
      setEarnedPopup(res.earned);
      setAdIndex((i) => (i + 1) % ADS.length);
      setAdProgress(0);
      setTimeout(() => setEarnedPopup(0), 2000);
    } catch {
      showToast("Ошибка начисления");
    }
  };

  // Вывод
  const handleWithdraw = async () => {
    setWithdrawError("");
    if (!wallet.trim()) { setWithdrawError("Введи номер кошелька FreeKassa"); return; }
    const minCoins = COINS_TO_RUB;
    if (balance < minCoins) { setWithdrawError(`Нужно минимум ${minCoins.toLocaleString()} монет (10 ₽)`); return; }
    setWithdrawing(true);
    try {
      await updateProfile(wallet);
      const rubAmount = Math.floor(balance / COINS_TO_RUB) * 10;
      await withdraw("frikassa", wallet, rubAmount);
      showToast(`✅ Заявка на вывод ${rubAmount} ₽ отправлена!`);
      const p = await fetchProfile();
      setBalance(p.balance);
      setScreen("home");
    } catch (e: unknown) {
      setWithdrawError(e instanceof Error ? e.message : "Ошибка вывода");
    } finally {
      setWithdrawing(false);
    }
  };

  const ad = ADS[adIndex];
  const rubBalance = coinsToRub(balance);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFD700" }}>
        <div className="w-10 h-10 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ——— ЭКРАН ИСТОРИИ ———
  if (screen === "history") {
    return (
      <div className="min-h-screen" style={{ background: "#1a1a1a", color: "white" }}>
        <div className="px-4 pt-10 pb-4 flex items-center gap-3" style={{ background: "#FFD700" }}>
          <button onClick={() => setScreen("home")} className="text-yellow-900">
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h1 className="text-xl font-black text-yellow-900 flex-1">История</h1>
        </div>

        {/* Итого */}
        <div className="flex gap-3 px-4 py-4">
          <div className="flex-1 rounded-2xl p-4 text-center" style={{ background: "#2a2a2a" }}>
            <p className="text-yellow-400 text-xs mb-1">Начислено монет</p>
            <p className="text-white font-black text-xl">
              {history.filter(h => h.type === "earn").reduce((s, h) => s + h.coins, 0).toLocaleString()}
            </p>
          </div>
          <div className="flex-1 rounded-2xl p-4 text-center" style={{ background: "#2a2a2a" }}>
            <p className="text-green-400 text-xs mb-1">Выведено ₽</p>
            <p className="text-white font-black text-xl">
              {history.filter(h => h.type === "withdraw" && h.status === "success").reduce((s, h) => s + h.coins, 0)} ₽
            </p>
          </div>
        </div>

        <div className="px-4 flex flex-col gap-2 pb-10">
          {history.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <div className="text-5xl mb-3">📋</div>
              <p>История пуста. Смотри рекламу!</p>
            </div>
          )}
          {history.map((h, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "#2a2a2a" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                  style={{ background: h.type === "earn" ? "rgba(255,215,0,0.15)" : "rgba(16,185,129,0.15)" }}>
                  {h.type === "earn" ? "🪙" : "💸"}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">
                    {h.type === "earn" ? "Просмотр рекламы" : `Вывод (${h.system || ""})`}
                  </p>
                  <p className="text-gray-500 text-xs">{formatDate(h.created_at)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${h.type === "earn" ? "text-yellow-400" : "text-green-400"}`}>
                  {h.type === "earn" ? `+${h.coins.toLocaleString()} 🪙` : `-${h.coins} ₽`}
                </p>
                {h.status && (
                  <p className="text-xs" style={{ color: h.status === "success" ? "#10b981" : h.status === "failed" ? "#ef4444" : "#f59e0b" }}>
                    {h.status === "success" ? "Выплачено" : h.status === "failed" ? "Ошибка" : "В обработке"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ——— ЭКРАН ВЫВОДА ———
  if (screen === "withdraw") {
    const canWithdraw = balance >= COINS_TO_RUB;
    const rubAmount = Math.floor(balance / COINS_TO_RUB) * 10;

    return (
      <div className="min-h-screen" style={{ background: "#1a1a1a", color: "white" }}>
        <div className="px-4 pt-10 pb-4 flex items-center gap-3" style={{ background: "#FFD700" }}>
          <button onClick={() => setScreen("home")} className="text-yellow-900">
            <Icon name="ArrowLeft" size={22} />
          </button>
          <h1 className="text-xl font-black text-yellow-900 flex-1">Вывод средств</h1>
        </div>

        <div className="px-4 py-5">
          {/* Баланс */}
          <div className="rounded-2xl p-5 text-center mb-5" style={{ background: "linear-gradient(135deg, #2a2000, #3d3000)", border: "1px solid rgba(255,215,0,0.3)" }}>
            <p className="text-yellow-400 text-sm mb-1">Твой баланс</p>
            <p className="text-4xl font-black text-yellow-300">{balance.toLocaleString()} 🪙</p>
            <p className="text-yellow-600 text-sm mt-1">≈ {rubBalance} ₽</p>
          </div>

          {/* Курс */}
          <div className="rounded-2xl p-4 mb-5 flex items-center gap-3" style={{ background: "#2a2a2a" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: "rgba(255,215,0,0.1)" }}>💱</div>
            <div>
              <p className="text-white font-semibold text-sm">Курс обмена</p>
              <p className="text-gray-400 text-xs">12 000 монет = 10 рублей</p>
            </div>
          </div>

          {/* Минимум */}
          <div className={`rounded-2xl p-4 mb-5 ${canWithdraw ? "" : "opacity-70"}`}
            style={{ background: canWithdraw ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${canWithdraw ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
            <p className="text-sm font-semibold" style={{ color: canWithdraw ? "#10b981" : "#ef4444" }}>
              {canWithdraw ? `✅ Доступно к выводу: ${rubAmount} ₽` : `❌ Нужно ещё ${(COINS_TO_RUB - balance).toLocaleString()} монет`}
            </p>
            <p className="text-xs text-gray-500 mt-1">Минимум для вывода: {COINS_TO_RUB.toLocaleString()} монет (10 ₽)</p>
          </div>

          {/* FreeKassa */}
          <div className="rounded-2xl p-4 mb-2" style={{ background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">💳</span>
              <p className="text-white font-semibold text-sm">FreeKassa</p>
            </div>
            <p className="text-gray-400 text-xs mb-2">Номер кошелька / карты</p>
            <input
              value={wallet}
              onChange={e => setWallet(e.target.value)}
              placeholder="Введи номер кошелька"
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          {withdrawError && <p className="text-red-400 text-xs mb-3 px-1">{withdrawError}</p>}

          <button
            onClick={handleWithdraw}
            disabled={withdrawing || !canWithdraw}
            className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 mt-3"
            style={{
              background: canWithdraw ? "linear-gradient(135deg, #FFD700, #FFA500)" : "#333",
              color: canWithdraw ? "#1a1000" : "#666",
            }}
          >
            {withdrawing ? "Отправка заявки..." : `Вывести ${rubAmount} ₽`}
          </button>
        </div>

        {toast && (
          <div className="fixed bottom-6 left-4 right-4 text-center py-3 rounded-2xl font-semibold text-white z-50"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
            {toast}
          </div>
        )}
      </div>
    );
  }

  // ——— ГЛАВНЫЙ ЭКРАН ———
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FFD700" }}>
      {/* Шапка */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        {/* Баланс слева */}
        <div className="rounded-2xl px-4 py-2.5" style={{ background: "rgba(0,0,0,0.12)" }}>
          <p className="text-yellow-900 text-xs font-medium">Баланс</p>
          <p className="text-yellow-900 font-black text-lg leading-tight">{balance.toLocaleString()} 🪙</p>
          <p className="text-yellow-800 text-xs">≈ {rubBalance} ₽</p>
        </div>

        {/* Кнопки справа */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setScreen("history")}
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5 font-semibold text-sm transition-all active:scale-95"
            style={{ background: "rgba(0,0,0,0.12)", color: "#7a5200" }}
          >
            <Icon name="History" size={16} />
            История
          </button>
          <button
            onClick={() => setScreen("withdraw")}
            className="flex items-center gap-2 rounded-2xl px-4 py-2.5 font-semibold text-sm transition-all active:scale-95"
            style={{ background: "rgba(0,0,0,0.15)", color: "#7a5200" }}
          >
            <Icon name="Wallet" size={16} />
            Вывести
          </button>
        </div>
      </div>

      {/* Заголовок */}
      <div className="px-5 mb-4">
        <h1 className="text-2xl font-black text-yellow-900">Смотри рекламу</h1>
        <p className="text-yellow-700 text-sm">и зарабатывай монеты 🪙</p>
      </div>

      {/* Блок рекламы */}
      <div className="flex-1 flex flex-col px-5 gap-4">
        <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ background: "#1a1a1a" }}>
          {/* Шапка рекламы */}
          <div className="px-4 pt-4 pb-3 flex items-center gap-2" style={{ background: ad.bg }}>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-2xl">{ad.emoji}</div>
            <div>
              <p className="text-white/70 text-xs">Реклама</p>
              <p className="text-white font-black text-base">{ad.brand}</p>
            </div>
            <div className="ml-auto text-white/60 text-xs bg-white/10 px-2 py-1 rounded-full">Реклама</div>
          </div>

          {/* Тело рекламы */}
          <div className="px-5 py-5">
            <p className="text-white font-black text-xl mb-2">{ad.title}</p>
            <p className="text-gray-400 text-sm leading-relaxed">{ad.desc}</p>
          </div>

          {/* Прогресс и кнопка */}
          <div className="px-5 pb-5">
            {adPlaying && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Загрузка рекламы...</span>
                  <span>{Math.round(adProgress)}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${adProgress}%`, background: ad.bg }}
                  />
                </div>
              </div>
            )}

            {!adPlaying && !adDone && (
              <button
                onClick={startAd}
                className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95"
                style={{ background: ad.bg, color: "white" }}
              >
                ▶ Смотреть рекламу
              </button>
            )}

            {adDone && (
              <button
                onClick={claimReward}
                className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 animate-pulse"
                style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#1a1000" }}
              >
                🪙 Получить +100 монет
              </button>
            )}
          </div>
        </div>

        {/* Подсказка */}
        <div className="rounded-2xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(0,0,0,0.1)" }}>
          <span className="text-2xl">💡</span>
          <p className="text-yellow-900 text-xs">
            За каждую рекламу — <strong>100 монет</strong>. Смотри больше — выводи деньги!
          </p>
        </div>

        {/* Прогресс до вывода */}
        <div className="rounded-2xl px-4 py-3" style={{ background: "rgba(0,0,0,0.1)" }}>
          <div className="flex justify-between text-xs text-yellow-900 mb-1.5">
            <span>До минимального вывода</span>
            <span>{Math.min(balance, COINS_TO_RUB).toLocaleString()} / {COINS_TO_RUB.toLocaleString()} 🪙</span>
          </div>
          <div className="h-2.5 rounded-full" style={{ background: "rgba(0,0,0,0.15)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min((balance / COINS_TO_RUB) * 100, 100)}%`, background: "linear-gradient(90deg, #b45309, #92400e)" }}
            />
          </div>
          <p className="text-yellow-800 text-xs mt-1.5 text-right">
            {balance >= COINS_TO_RUB ? "✅ Можно вывести!" : `Ещё ${(COINS_TO_RUB - balance).toLocaleString()} монет`}
          </p>
        </div>
      </div>

      <div className="h-8" />

      {/* Попап +монеты */}
      {earnedPopup > 0 && (
        <div className="fixed top-1/3 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="px-8 py-4 rounded-3xl text-3xl font-black animate-bounce shadow-2xl"
            style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#1a1000" }}>
            +{earnedPopup} 🪙
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-4 right-4 text-center py-3 rounded-2xl font-semibold text-white z-50"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

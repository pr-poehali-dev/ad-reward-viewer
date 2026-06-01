import { useState, useEffect, useRef } from "react";
import { fetchProfile, fetchHistory, watchAd, withdraw, updateProfile, COINS_TO_RUB } from "@/services/adApi";
import type { UserProfile, HistoryItem } from "@/services/adApi";
import Icon from "@/components/ui/icon";
import YandexAd from "@/components/YandexAd";

const YA_BLOCK_ID = "R-A-19368143-1";

type Screen = "home" | "history" | "withdraw";

const ADS = [
  { id: 1, brand: "Яндекс Маркет", title: "Скидки до 70% на электронику", desc: "Только сегодня! Смартфоны, ноутбуки, наушники по минимальным ценам.", emoji: "🛒", bg: "linear-gradient(135deg, #ff6600, #ff9900)" },
  { id: 2, brand: "Сбер Банк", title: "Кредит за 2 минуты", desc: "До 5 млн рублей без справок. Одобрение онлайн.", emoji: "💳", bg: "linear-gradient(135deg, #21a038, #4cbb6e)" },
  { id: 3, brand: "Авито", title: "Продай ненужное — заработай!", desc: "Миллионы покупателей уже ждут. Размести объявление бесплатно.", emoji: "📦", bg: "linear-gradient(135deg, #00aaff, #0077cc)" },
  { id: 4, brand: "Wildberries", title: "Мегараспродажа сезона", desc: "Одежда, обувь, косметика. Бесплатная доставка от 1000 ₽.", emoji: "🛍️", bg: "linear-gradient(135deg, #cb11ab, #8800aa)" },
  { id: 5, brand: "Тинькофф", title: "Карта с кешбэком 5%", desc: "Зарабатывай на каждой покупке. Обслуживание 0 ₽.", emoji: "💰", bg: "linear-gradient(135deg, #ffdd2d, #ffa800)" },
];

function formatDate(str: string) {
  return new Date(str).toLocaleString("ru", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function coinsToRub(coins: number) {
  return ((coins / COINS_TO_RUB) * 10).toFixed(2);
}

/* ─── Нижняя навигация ─── */
function BottomNav({ screen, onNav }: { screen: Screen; onNav: (s: Screen) => void }) {
  const tabs: { key: Screen; icon: string; label: string }[] = [
    { key: "home",     icon: "Play",    label: "Реклама" },
    { key: "history",  icon: "History", label: "История" },
    { key: "withdraw", icon: "Wallet",  label: "Вывод"   },
  ];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex z-40"
      style={{
        background: "#111",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
      }}
    >
      {tabs.map(t => {
        const active = screen === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onNav(t.key)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all"
          >
            <Icon name={t.icon} size={22} style={{ color: active ? "#FFD700" : "#555" }} />
            <span className="text-xs font-semibold" style={{ color: active ? "#FFD700" : "#555" }}>{t.label}</span>
            {active && (
              <span className="absolute top-0 w-8 h-0.5 rounded-full" style={{ background: "#FFD700" }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}

/* ─── Скелетон загрузки ─── */
function Skeleton() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#FFD700" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl" style={{ background: "rgba(0,0,0,0.12)" }}>🪙</div>
        <div className="w-8 h-8 border-4 border-yellow-800 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}

/* ─── Главный компонент ─── */
export default function AdApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [adIndex, setAdIndex] = useState(0);
  const [adPlaying, setAdPlaying] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [adDone, setAdDone] = useState(false);
  const [earnedPopup, setEarnedPopup] = useState(0);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchProfile()
      .then((p: UserProfile) => { setBalance(p.balance); setWallet(p.frikassa_wallet || ""); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (screen === "history") fetchHistory().then(setHistory);
  }, [screen]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const startAd = () => {
    if (adPlaying) return;
    setAdPlaying(true); setAdProgress(0); setAdDone(false);
    let p = 0;
    timerRef.current = setInterval(() => {
      p += 2; setAdProgress(p);
      if (p >= 100) { clearInterval(timerRef.current!); setAdPlaying(false); setAdDone(true); }
    }, 100);
  };

  const claimReward = async () => {
    setAdDone(false);
    try {
      const res = await watchAd();
      setBalance(res.balance);
      setEarnedPopup(res.earned);
      setAdIndex(i => (i + 1) % ADS.length);
      setAdProgress(0);
      setTimeout(() => setEarnedPopup(0), 1800);
    } catch { showToast("Ошибка начисления"); }
  };

  const handleWithdraw = async () => {
    setWithdrawError("");
    if (!wallet.trim()) { setWithdrawError("Введи номер кошелька FreeKassa"); return; }
    if (balance < COINS_TO_RUB) { setWithdrawError(`Нужно минимум ${COINS_TO_RUB.toLocaleString()} монет`); return; }
    setWithdrawing(true);
    try {
      await updateProfile(wallet);
      const rub = Math.floor(balance / COINS_TO_RUB) * 10;
      await withdraw("frikassa", wallet, rub);
      showToast(`✅ Заявка на ${rub} ₽ отправлена!`);
      const p = await fetchProfile();
      setBalance(p.balance);
      setScreen("home");
    } catch (e: unknown) {
      setWithdrawError(e instanceof Error ? e.message : "Ошибка вывода");
    } finally { setWithdrawing(false); }
  };

  const ad = ADS[adIndex];
  const rubBalance = coinsToRub(balance);
  const pct = Math.min((balance / COINS_TO_RUB) * 100, 100);

  if (loading) return <Skeleton />;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: "#0d0d0d", color: "white" }}>

      {/* ══ СТАТУС-БАР (имитация) ══ */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 text-xs font-semibold"
        style={{ height: "calc(44px + env(safe-area-inset-top, 0px))", paddingTop: "env(safe-area-inset-top, 0px)", background: "#FFD700", color: "#7a5200" }}
      >
        <span className="text-base font-black">CoinAds</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black">{balance.toLocaleString()} 🪙</span>
          <span className="opacity-60">≈ {rubBalance} ₽</span>
        </div>
      </div>

      {/* ══ КОНТЕНТ (скроллится) ══ */}
      <div className="flex-1 overflow-y-auto pb-24" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>

        {/* ─── ГЛАВНЫЙ ЭКРАН ─── */}
        {screen === "home" && (
          <div className="flex flex-col">

            {/* Яндекс реклама */}
            <div className="mx-4 mt-4 rounded-3xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", minHeight: 200 }}>
              <div className="px-1 pt-1">
                <YandexAd
                  blockId={YA_BLOCK_ID}
                  onLoad={() => { setAdPlaying(false); setAdDone(false); }}
                />
              </div>
              {/* Прогресс поверх */}
              {adPlaying && (
                <div className="px-4 pb-4">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#2a2a2a" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${adProgress}%`, background: "linear-gradient(90deg, #FFD700, #FFA500)" }} />
                  </div>
                  <p className="text-gray-600 text-xs mt-1.5 text-right">{Math.round(adProgress)}%</p>
                </div>
              )}
            </div>

            {/* Кнопка действия */}
            <div className="px-4 mt-3">
              {!adPlaying && !adDone && (
                <button onClick={startAd}
                  className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95"
                  style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#1a1000", boxShadow: "0 8px 24px rgba(255,215,0,0.25)" }}>
                  ▶ Смотреть рекламу
                </button>
              )}
              {adPlaying && (
                <div className="w-full py-4 rounded-2xl text-center font-semibold text-gray-500"
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
                  ⏳ Загрузка рекламы...
                </div>
              )}
              {adDone && (
                <button onClick={claimReward}
                  className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95"
                  style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#1a1000", boxShadow: "0 8px 24px rgba(255,215,0,0.3)" }}>
                  🪙 Забрать +100 монет
                </button>
              )}
            </div>

            {/* Карточки статистики */}
            <div className="grid grid-cols-2 gap-3 px-4 mt-4">
              <div className="rounded-2xl p-4" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
                <p className="text-gray-500 text-xs mb-1">За просмотр</p>
                <p className="text-yellow-400 font-black text-2xl">+100 🪙</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
                <p className="text-gray-500 text-xs mb-1">Курс</p>
                <p className="text-green-400 font-black text-xl">12k 🪙</p>
                <p className="text-gray-500 text-xs">= 10 ₽</p>
              </div>
            </div>

            {/* Прогресс до вывода */}
            <div className="mx-4 mt-3 rounded-2xl p-4" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-400 text-sm font-semibold">До вывода</p>
                <p className="text-yellow-400 text-sm font-bold">{Math.min(balance, COINS_TO_RUB).toLocaleString()} / {COINS_TO_RUB.toLocaleString()}</p>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: "#2a2a2a" }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: "linear-gradient(90deg, #FFD700, #FFA500)" }} />
              </div>
              <p className="text-xs mt-2 text-right" style={{ color: balance >= COINS_TO_RUB ? "#10b981" : "#666" }}>
                {balance >= COINS_TO_RUB ? "✅ Можно вывести!" : `Ещё ${(COINS_TO_RUB - balance).toLocaleString()} монет`}
              </p>
            </div>

            {/* Второй рекламный блок */}
            <div className="mx-4 mt-3 mb-2 rounded-3xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <p className="text-gray-600 text-xs px-4 pt-3 pb-1">Реклама</p>
              <YandexAd blockId={YA_BLOCK_ID} suffix="2" />
            </div>

          </div>
        )}

        {/* ─── ИСТОРИЯ ─── */}
        {screen === "history" && (
          <div>
            {/* Статкарточки */}
            <div className="grid grid-cols-2 gap-3 px-4 pt-4">
              <div className="rounded-2xl p-4 text-center" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
                <p className="text-yellow-400 text-xs mb-1">Заработано</p>
                <p className="text-white font-black text-xl">
                  {history.filter(h => h.type === "earn").reduce((s, h) => s + h.coins, 0).toLocaleString()} 🪙
                </p>
              </div>
              <div className="rounded-2xl p-4 text-center" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
                <p className="text-green-400 text-xs mb-1">Выведено</p>
                <p className="text-white font-black text-xl">
                  {history.filter(h => h.type === "withdraw" && h.status === "success").reduce((s, h) => s + h.coins, 0)} ₽
                </p>
              </div>
            </div>

            {/* Список */}
            <div className="px-4 mt-4 flex flex-col gap-2">
              {history.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-3">📋</div>
                  <p className="text-gray-500">История пуста — смотри рекламу!</p>
                </div>
              ) : history.map((h, i) => (
                <div key={i} className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ background: "#1a1a1a", border: "1px solid #222" }}>
                  <div className="w-10 h-10 flex-shrink-0 rounded-2xl flex items-center justify-center text-xl"
                    style={{ background: h.type === "earn" ? "rgba(255,215,0,0.1)" : "rgba(16,185,129,0.1)" }}>
                    {h.type === "earn" ? "🪙" : "💸"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">
                      {h.type === "earn" ? "Просмотр рекламы" : `Вывод (${h.system || "frikassa"})`}
                    </p>
                    <p className="text-gray-600 text-xs">{formatDate(h.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm" style={{ color: h.type === "earn" ? "#FFD700" : "#10b981" }}>
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
        )}

        {/* ─── ВЫВОД ─── */}
        {screen === "withdraw" && (() => {
          const canWithdraw = balance >= COINS_TO_RUB;
          const rubAmount = Math.floor(balance / COINS_TO_RUB) * 10;
          return (
            <div className="px-4 pt-4">
              {/* Баланс-карточка */}
              <div className="rounded-3xl p-6 text-center mb-4"
                style={{ background: "linear-gradient(135deg, #2a1f00, #1a1200)", border: "1px solid rgba(255,215,0,0.2)" }}>
                <p className="text-yellow-600 text-sm mb-1">Твой баланс</p>
                <p className="text-5xl font-black text-yellow-400">{balance.toLocaleString()}</p>
                <p className="text-yellow-600 text-2xl mt-1">🪙</p>
                <p className="text-yellow-700 text-sm mt-2">≈ {rubBalance} ₽</p>
              </div>

              {/* Статус вывода */}
              <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
                style={{ background: canWithdraw ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${canWithdraw ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}` }}>
                <span className="text-2xl">{canWithdraw ? "✅" : "⏳"}</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: canWithdraw ? "#10b981" : "#ef4444" }}>
                    {canWithdraw ? `Доступно к выводу: ${rubAmount} ₽` : "Недостаточно монет"}
                  </p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {canWithdraw ? "Нажми кнопку ниже для вывода" : `Нужно ещё ${(COINS_TO_RUB - balance).toLocaleString()} монет`}
                  </p>
                </div>
              </div>

              {/* Курс */}
              <div className="rounded-2xl px-4 py-3 mb-4 flex items-center justify-between"
                style={{ background: "#1a1a1a", border: "1px solid #222" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">💱</span>
                  <p className="text-gray-400 text-sm">Курс обмена</p>
                </div>
                <p className="text-white font-bold text-sm">12 000 🪙 = 10 ₽</p>
              </div>

              {/* Кошелёк */}
              <div className="rounded-2xl p-4 mb-2" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">💳</span>
                  <p className="text-white font-semibold text-sm">FreeKassa — кошелёк</p>
                </div>
                <input
                  value={wallet}
                  onChange={e => setWallet(e.target.value)}
                  placeholder="Номер кошелька / карты"
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                  style={{ background: "#111", border: "1px solid #2a2a2a" }}
                />
              </div>

              {withdrawError && (
                <p className="text-red-400 text-xs mb-3 px-1">{withdrawError}</p>
              )}

              <button
                onClick={handleWithdraw}
                disabled={withdrawing || !canWithdraw}
                className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 mt-2"
                style={{
                  background: canWithdraw ? "linear-gradient(135deg, #FFD700, #FFA500)" : "#1e1e1e",
                  color: canWithdraw ? "#1a1000" : "#444",
                  border: canWithdraw ? "none" : "1px solid #2a2a2a",
                }}
              >
                {withdrawing ? "Отправка..." : canWithdraw ? `Вывести ${rubAmount} ₽` : "Недостаточно монет"}
              </button>
            </div>
          );
        })()}
      </div>

      {/* ══ НИЖНЯЯ НАВИГАЦИЯ ══ */}
      <BottomNav screen={screen} onNav={setScreen} />

      {/* ══ ПОПАП +МОНЕТЫ ══ */}
      {earnedPopup > 0 && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="px-10 py-5 rounded-3xl font-black text-4xl animate-bounce shadow-2xl"
            style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", color: "#1a1000" }}>
            +{earnedPopup} 🪙
          </div>
        </div>
      )}

      {/* ══ ТОСТ ══ */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 text-center py-3 rounded-2xl font-semibold text-white z-50 text-sm"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
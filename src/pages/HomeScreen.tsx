import { useEffect, useState, useRef } from "react";
import Icon from "@/components/ui/icon";

interface HomeScreenProps {
  balance: number;
  onAdWatched: (reward: number) => void;
}

type Phase = "idle" | "countdown" | "watching" | "reward";

const COUNTDOWN = 10;
const AD_DURATION = 30;
const REWARD = 2;

// После одобрения AdSense замените на свои реальные значения:
// const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX";
// const ADSENSE_SLOT   = "XXXXXXXXXX";
const ADSENSE_READY = false;

export default function HomeScreen({ balance, onAdWatched }: HomeScreenProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(COUNTDOWN);
  const [adCount, setAdCount] = useState(AD_DURATION);
  const [showReward, setShowReward] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const circumference = 2 * Math.PI * 80;

  const progress =
    phase === "countdown"
      ? ((COUNTDOWN - count) / COUNTDOWN) * circumference
      : phase === "watching"
        ? circumference
        : 0;

  const startCountdown = () => {
    if (phase !== "idle") return;
    setPhase("countdown");
    setCount(COUNTDOWN);
    setShowReward(false);
  };

  useEffect(() => {
    if (phase === "countdown") {
      intervalRef.current = setInterval(() => {
        setCount((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setPhase("watching");
            setAdCount(AD_DURATION);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (phase === "watching") {
      intervalRef.current = setInterval(() => {
        setAdCount((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setPhase("reward");
            setShowReward(true);
            onAdWatched(REWARD);
            setTimeout(() => {
              setPhase("idle");
              setCount(COUNTDOWN);
              setShowReward(false);
            }, 2500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  return (
    <div className="flex flex-col items-center justify-between h-full px-6 py-10 relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <div>
          <p className="text-blue-200 text-xs font-medium uppercase tracking-widest">Баланс</p>
          <p className="text-white text-2xl font-black">{balance} ₽</p>
        </div>
        <div className="bg-white/10 rounded-2xl px-4 py-2 flex items-center gap-2">
          <Icon name="Zap" size={16} className="text-yellow-300" />
          <span className="text-white text-sm font-semibold">+{REWARD} ₽ / реклама</span>
        </div>
      </div>

      {/* Central Circle */}
      <div className="flex flex-col items-center gap-8">
        <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
          {/* Glow */}
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-opacity duration-500"
            style={{
              background:
                phase === "reward"
                  ? "radial-gradient(circle, #fbbf24, #f59e0b)"
                  : phase === "watching"
                    ? "radial-gradient(circle, #34d399, #10b981)"
                    : "radial-gradient(circle, #93c5fd, #3b82f6)",
            }}
          />

          {/* SVG ring */}
          <svg width="220" height="220" className="absolute top-0 left-0 -rotate-90">
            <circle
              cx="110" cy="110" r="80"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            <circle
              cx="110" cy="110" r="80"
              fill="none"
              stroke={phase === "reward" ? "#fbbf24" : phase === "watching" ? "#34d399" : "#60a5fa"}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              style={{ transition: "stroke-dashoffset 0.9s ease, stroke 0.4s ease" }}
            />
          </svg>

          {/* Inner circle */}
          <div
            className="relative z-10 rounded-full flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-300 active:scale-95"
            style={{
              width: 160,
              height: 160,
              background:
                phase === "reward"
                  ? "linear-gradient(135deg, #f59e0b, #fbbf24)"
                  : phase === "watching"
                    ? "linear-gradient(135deg, #059669, #34d399)"
                    : "linear-gradient(135deg, #1d4ed8, #3b82f6)",
              boxShadow:
                phase === "reward"
                  ? "0 0 40px rgba(251,191,36,0.5)"
                  : phase === "watching"
                    ? "0 0 40px rgba(52,211,153,0.5)"
                    : "0 0 40px rgba(96,165,250,0.3)",
            }}
            onClick={startCountdown}
          >
            {phase === "idle" && (
              <>
                <Icon name="Play" size={36} className="text-white mb-1" />
                <span className="text-white text-xs font-bold uppercase tracking-wider">Смотреть</span>
              </>
            )}
            {phase === "countdown" && (
              <>
                <span className="text-white text-5xl font-black leading-none">{count}</span>
                <span className="text-blue-100 text-xs font-medium mt-1">до рекламы</span>
              </>
            )}
            {phase === "watching" && (
              <>
                <Icon name="MonitorPlay" size={32} className="text-white mb-1" />
                <span className="text-white text-3xl font-black">{adCount}</span>
                <span className="text-green-100 text-xs font-medium">секунд</span>
              </>
            )}
            {phase === "reward" && (
              <>
                <span className="text-white text-3xl mb-1">🎉</span>
                <span className="text-white text-xl font-black">+{REWARD} ₽</span>
                <span className="text-yellow-100 text-xs font-medium">начислено!</span>
              </>
            )}
          </div>
        </div>

        {/* Status text */}
        <div className="text-center">
          {phase === "idle" && (
            <p className="text-blue-200 text-base font-medium">
              Нажми на кружок, чтобы<br />
              <span className="text-white font-bold">начать просмотр рекламы</span>
            </p>
          )}
          {phase === "countdown" && (
            <p className="text-blue-200 text-base font-medium">
              Реклама начнётся через<br />
              <span className="text-white font-bold">{count} секунд</span>
            </p>
          )}
          {phase === "watching" && (
            <p className="text-green-300 text-base font-medium">
              Смотрите рекламу...<br />
              <span className="text-white font-bold">не закрывайте экран</span>
            </p>
          )}
          {phase === "reward" && (
            <p className="text-yellow-300 text-lg font-bold">
              Вознаграждение начислено!
            </p>
          )}
        </div>
      </div>

      {/* Ad block */}
      {phase === "watching" && (
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {ADSENSE_READY ? (
            /* Реальный блок AdSense — раскомментируйте после одобрения аккаунта */
            <div className="w-full h-[100px] flex items-center justify-center bg-white/5">
              {/* <ins
                className="adsbygoogle"
                style={{ display: "block", width: "100%", height: "100px" }}
                data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                data-ad-slot="XXXXXXXXXX"
                data-ad-format="horizontal"
              /> */}
              <span className="text-white/30 text-xs">AdSense блок</span>
            </div>
          ) : (
            /* Заглушка — убрать после подключения AdSense */
            <div
              className="w-full flex flex-col items-center justify-center gap-2 py-4 px-4"
              style={{ background: "rgba(255,255,255,0.05)", minHeight: 90 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/50 text-[10px] uppercase tracking-widest font-bold">Реклама</span>
              </div>
              <div className="w-full rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.08)", height: 56 }}>
                <div className="flex items-center h-full px-4 gap-3">
                  <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }} />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="h-2.5 rounded-full w-3/4" style={{ background: "rgba(255,255,255,0.2)" }} />
                    <div className="h-2 rounded-full w-1/2" style={{ background: "rgba(255,255,255,0.1)" }} />
                  </div>
                  <div className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ background: "#6366f1" }}>
                    Узнать
                  </div>
                </div>
              </div>
              <p className="text-white/25 text-[10px]">Здесь будет реклама Google AdSense</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom hint */}
      {phase !== "watching" && (
        <div className="flex items-center gap-2 bg-white/10 rounded-2xl px-5 py-3">
          <Icon name="Info" size={16} className="text-blue-200" />
          <p className="text-blue-100 text-xs">Каждый просмотр = {REWARD} ₽ на баланс</p>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState, useRef } from "react";
import Icon from "@/components/ui/icon";

declare global {
  interface Window {
    yaContextCb: (() => void)[];
    Ya: { Context: { AdvManager: { render: (opts: object) => void } } };
  }
}

interface HomeScreenProps {
  balance: number;
  onAdWatched: (reward: number) => void;
}

type Phase = "idle" | "countdown" | "watching" | "reward";

const COUNTDOWN = 10;
const AD_DURATION = 30;
const REWARD = 1000;

const YA_BLOCK_TOP    = "R-A-325912287-1";
const YA_BLOCK_MIDDLE = "R-A-325912287-2";
const YA_BLOCK_BOTTOM = "R-A-325912287-3";

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

  const renderYaAd = () => {
    window.yaContextCb = window.yaContextCb || [];
    [
      { blockId: YA_BLOCK_TOP,    renderTo: "ya-ad-top" },
      { blockId: YA_BLOCK_MIDDLE, renderTo: "ya-ad-middle" },
      { blockId: YA_BLOCK_BOTTOM, renderTo: "ya-ad-bottom" },
    ].forEach(({ blockId, renderTo }) => {
      window.yaContextCb.push(() => {
        window.Ya.Context.AdvManager.render({ blockId, renderTo, async: true });
      });
    });
  };

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
      renderYaAd();
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

  const AdBanner = ({ id }: { id: string }) => (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", minHeight: 80 }}
    >
      <div className="flex items-center gap-1.5 px-3 pt-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
        <span className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Реклама</span>
      </div>
      <div id={id} className="w-full" />
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-between h-full px-4 py-6 gap-3 relative overflow-hidden">

      {/* Верхний баннер — всегда виден */}
      <AdBanner id="ya-ad-top" />

      {/* Header */}
      <div className="w-full flex items-center justify-between px-2">
        <div>
          <p className="text-blue-200 text-xs font-medium uppercase tracking-widest">Баланс</p>
          <p className="text-white text-2xl font-black">🪙 {balance.toLocaleString("ru-RU")}</p>
        </div>
        <div className="bg-white/10 rounded-2xl px-4 py-2 flex items-center gap-2">
          <Icon name="Zap" size={16} className="text-yellow-300" />
          <span className="text-white text-sm font-semibold">+{REWARD.toLocaleString("ru-RU")} 🪙 / реклама</span>
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
                <span className="text-white text-xl font-black">+{REWARD.toLocaleString("ru-RU")} 🪙</span>
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

      {/* Средний баннер — только во время просмотра */}
      {phase === "watching" && <AdBanner id="ya-ad-middle" />}

      {/* Нижний баннер — всегда виден */}
      <AdBanner id="ya-ad-bottom" />
    </div>
  );
}
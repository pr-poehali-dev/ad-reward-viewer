import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { Station } from "@/data/stations";

interface RadioPlayerProps {
  station: Station | null;
  onClose: () => void;
}

export default function RadioPlayer({ station, onClose }: RadioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!station) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    const audio = new Audio(station.streamUrl);
    audio.volume = volume;
    audioRef.current = audio;
    setIsLoading(true);
    setIsPlaying(false);

    audio.addEventListener("canplay", () => {
      setIsLoading(false);
      audio.play();
      setIsPlaying(true);
    });
    audio.addEventListener("error", () => {
      setIsLoading(false);
      setIsPlaying(false);
    });
    audio.load();

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [station]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      audio.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  if (!station) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-3"
      style={{
        background: "linear-gradient(to top, #0d0d1a 80%, transparent)",
      }}
    >
      <div
        className="rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{
          background: "linear-gradient(135deg, #1a1a3e, #12122b)",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          boxShadow: "0 0 30px rgba(139, 92, 246, 0.15)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: "rgba(139, 92, 246, 0.2)" }}
        >
          {station.logo}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{station.name}</p>
          <p className="text-purple-300 text-xs truncate">{station.genre}</p>
        </div>

        <div className="flex items-center gap-1">
          <Icon name="Volume2" size={14} className="text-purple-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolume}
            className="w-16 accent-purple-500"
          />
        </div>

        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Icon name={isPlaying ? "Pause" : "Play"} size={16} className="text-white" />
          )}
        </button>

        <button
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.src = "";
            }
            setIsPlaying(false);
            onClose();
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-purple-400 hover:text-white transition-colors"
        >
          <Icon name="X" size={16} />
        </button>
      </div>

      {isPlaying && (
        <div className="flex justify-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full"
              style={{
                height: `${8 + Math.random() * 12}px`,
                background: "linear-gradient(to top, #8b5cf6, #06b6d4)",
                animation: `equalize ${0.5 + i * 0.15}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

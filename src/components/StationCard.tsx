import Icon from "@/components/ui/icon";
import { Station } from "@/data/stations";

interface StationCardProps {
  station: Station;
  isPlaying: boolean;
  isFavorite: boolean;
  onPlay: (station: Station) => void;
  onFavorite: (id: number) => void;
}

export default function StationCard({ station, isPlaying, isFavorite, onPlay, onFavorite }: StationCardProps) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all active:scale-95"
      style={{
        background: isPlaying
          ? "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(6,182,212,0.15))"
          : "rgba(255,255,255,0.04)",
        border: isPlaying
          ? "1px solid rgba(139,92,246,0.5)"
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: isPlaying ? "0 0 20px rgba(139,92,246,0.2)" : "none",
      }}
      onClick={() => onPlay(station)}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 relative"
        style={{ background: "rgba(139, 92, 246, 0.15)" }}
      >
        {station.logo}
        {isPlaying && (
          <div
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{station.name}</p>
        <p className="text-purple-300 text-xs truncate">{station.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(139,92,246,0.2)", color: "#c4b5fd" }}
          >
            {station.genre}
          </span>
          {station.listeners && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Icon name="Users" size={10} />
              {station.listeners.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(station.id);
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
          style={{ color: isFavorite ? "#f472b6" : "rgba(255,255,255,0.3)" }}
        >
          <Icon name={isFavorite ? "Heart" : "Heart"} size={16} />
        </button>

        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: isPlaying
              ? "linear-gradient(135deg, #8b5cf6, #06b6d4)"
              : "rgba(139,92,246,0.2)",
          }}
        >
          <Icon
            name={isPlaying ? "Pause" : "Play"}
            size={14}
            className="text-white"
          />
        </div>
      </div>
    </div>
  );
}

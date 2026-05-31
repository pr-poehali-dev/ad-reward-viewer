import { useState } from "react";
import Icon from "@/components/ui/icon";
import { GENRES } from "@/data/stations";

interface AddStationModalProps {
  onClose: () => void;
  onAdd: (station: { name: string; genre: string; description: string; streamUrl: string; logo: string }) => void;
}

const EMOJIS = ["📻", "🎵", "🎸", "🎷", "🎺", "🎻", "🥁", "🎛️", "⚡", "🎙️", "🌊", "🔥", "🌟", "🎤", "🎧"];

export default function AddStationModal({ onClose, onAdd }: AddStationModalProps) {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("Поп");
  const [description, setDescription] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [logo, setLogo] = useState("📻");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return setError("Введите название станции");
    if (!streamUrl.trim()) return setError("Введите ссылку на поток");
    if (!streamUrl.startsWith("http")) return setError("Ссылка должна начинаться с http");
    setError("");
    onAdd({ name: name.trim(), genre, description: description.trim() || genre, streamUrl: streamUrl.trim(), logo });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl px-5 pt-5 pb-8 flex flex-col gap-4"
        style={{
          background: "linear-gradient(160deg, #1a1a3e, #0d0d1a)",
          border: "1px solid rgba(139,92,246,0.3)",
          borderBottom: "none",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Добавить станцию</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Emoji picker */}
        <div>
          <p className="text-gray-400 text-xs mb-2">Иконка</p>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setLogo(e)}
                className="w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all"
                style={{
                  background: logo === e ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.06)",
                  border: logo === e ? "1px solid rgba(139,92,246,0.7)" : "1px solid transparent",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <p className="text-gray-400 text-xs mb-1">Название *</p>
          <input
            type="text"
            placeholder="Например: Моё Радио"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Genre */}
        <div>
          <p className="text-gray-400 text-xs mb-1">Жанр</p>
          <div className="flex flex-wrap gap-2">
            {GENRES.filter((g) => g !== "Все").map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: genre === g ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)",
                  border: genre === g ? "1px solid rgba(139,92,246,0.6)" : "1px solid rgba(255,255,255,0.07)",
                  color: genre === g ? "#c4b5fd" : "#6b7280",
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-gray-400 text-xs mb-1">Описание</p>
          <input
            type="text"
            placeholder="Краткое описание станции"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Stream URL */}
        <div>
          <p className="text-gray-400 text-xs mb-1">Ссылка на поток *</p>
          <input
            type="url"
            placeholder="https://stream.example.com/radio.mp3"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          <p className="text-gray-600 text-xs mt-1">Прямая ссылка на MP3/AAC поток радиостанции</p>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
        >
          Добавить станцию
        </button>
      </div>
    </div>
  );
}

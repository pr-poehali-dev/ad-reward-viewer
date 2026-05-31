import { useState, useMemo } from "react";
import Icon from "@/components/ui/icon";
import StationCard from "@/components/StationCard";
import RadioPlayer from "@/components/RadioPlayer";
import AddStationModal from "@/components/AddStationModal";
import { stations as defaultStations, GENRES, Station } from "@/data/stations";

type TabType = "catalog" | "favorites";

let nextCustomId = 1000;

function loadCustomStations(): Station[] {
  try {
    return JSON.parse(localStorage.getItem("radio_custom_stations") || "[]");
  } catch {
    return [];
  }
}

export default function RadioPage() {
  const [activeTab, setActiveTab] = useState<TabType>("catalog");
  const [selectedGenre, setSelectedGenre] = useState("Все");
  const [search, setSearch] = useState("");
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customStations, setCustomStations] = useState<Station[]>(loadCustomStations);
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("radio_favorites") || "[]");
    } catch {
      return [];
    }
  });

  const allStations = useMemo(() => [...defaultStations, ...customStations], [customStations]);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      localStorage.setItem("radio_favorites", JSON.stringify(next));
      return next;
    });
  };

  const handleAddStation = (data: { name: string; genre: string; description: string; streamUrl: string; logo: string }) => {
    const newStation: Station = {
      id: nextCustomId++,
      ...data,
      country: "Пользователь",
    };
    const updated = [...customStations, newStation];
    setCustomStations(updated);
    localStorage.setItem("radio_custom_stations", JSON.stringify(updated));
  };

  const filtered = useMemo(() => {
    let list = activeTab === "favorites" ? allStations.filter((s) => favorites.includes(s.id)) : allStations;
    if (selectedGenre !== "Все") list = list.filter((s) => s.genre === selectedGenre);
    if (search.trim()) list = list.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.genre.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [activeTab, selectedGenre, search, favorites, allStations]);

  return (
    <div
      className="min-h-screen"
      style={{ background: "#0d0d1a", fontFamily: "'Inter', sans-serif", color: "white" }}
    >
      {/* Hero */}
      <div
        className="relative overflow-hidden px-5 pt-12 pb-8"
        style={{ background: "linear-gradient(135deg, #1a0a3e 0%, #0d0d1a 60%)" }}
      >
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)", transform: "translate(30%, -30%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)", transform: "translate(-30%, 30%)" }}
        />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
              >
                <Icon name="Radio" size={16} className="text-white" />
              </div>
              <span className="text-purple-300 text-sm font-medium">Онлайн Радио</span>
            </div>
            <h1 className="text-3xl font-black text-white mt-2 leading-tight">
              Слушай музыку<br />
              <span style={{ background: "linear-gradient(135deg, #a78bfa, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                прямо сейчас
              </span>
            </h1>
            <p className="text-gray-400 text-sm mt-2">{allStations.length} станций из разных стран</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 mt-2"
            style={{
              background: "rgba(139,92,246,0.2)",
              border: "1px solid rgba(139,92,246,0.4)",
              color: "#c4b5fd",
            }}
          >
            <Icon name="Plus" size={14} />
            Добавить
          </button>
        </div>

        {/* Hero image */}
        <div className="mt-5 rounded-2xl overflow-hidden h-36 relative">
          <img
            src="https://cdn.poehali.dev/projects/18a334c5-1480-4d1d-9432-4965a035ddb3/files/e9efbc5e-aa7e-411a-b052-f99fa4569e50.jpg"
            alt="Radio"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, #0d0d1a 0%, transparent 50%, #0d0d1a 100%)" }}
          />
        </div>
      </div>

      {/* Search */}
      <div className="px-5 mt-4">
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Icon name="Search" size={16} className="text-purple-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Поиск по названию или жанру..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-500"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-gray-500 hover:text-white">
              <Icon name="X" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-4 flex gap-2">
        {(["catalog", "favorites"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: activeTab === t ? "linear-gradient(135deg, #8b5cf6, #06b6d4)" : "rgba(255,255,255,0.06)",
              color: activeTab === t ? "white" : "#9ca3af",
              border: activeTab === t ? "none" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Icon name={t === "catalog" ? "LayoutGrid" : "Heart"} size={14} />
            {t === "catalog" ? "Каталог" : `Избранное${favorites.length > 0 ? ` (${favorites.length})` : ""}`}
          </button>
        ))}
      </div>

      {/* Genre filter */}
      {activeTab === "catalog" && (
        <div className="mt-4 px-5">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: selectedGenre === g ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.05)",
                  border: selectedGenre === g ? "1px solid rgba(139,92,246,0.6)" : "1px solid rgba(255,255,255,0.07)",
                  color: selectedGenre === g ? "#c4b5fd" : "#6b7280",
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Station list */}
      <div className="px-5 mt-5 flex flex-col gap-3 pb-36">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">{activeTab === "favorites" ? "💜" : "🔍"}</div>
            <p className="text-gray-400 text-sm mb-4">
              {activeTab === "favorites" ? "Нет избранных станций" : "Ничего не найдено"}
            </p>
            {activeTab === "catalog" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd" }}
              >
                + Добавить станцию
              </button>
            )}
          </div>
        ) : (
          filtered.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              isPlaying={currentStation?.id === station.id}
              isFavorite={favorites.includes(station.id)}
              onPlay={setCurrentStation}
              onFavorite={toggleFavorite}
            />
          ))
        )}
      </div>

      {/* Player */}
      <RadioPlayer
        station={currentStation}
        onClose={() => setCurrentStation(null)}
      />

      {/* Add Station Modal */}
      {showAddModal && (
        <AddStationModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddStation}
        />
      )}
    </div>
  );
}

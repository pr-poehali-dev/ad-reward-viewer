import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import StationCard from "@/components/StationCard";
import RadioPlayer from "@/components/RadioPlayer";
import AddStationModal from "@/components/AddStationModal";
import { fetchByGenre, searchStations, GENRES, Station } from "@/services/radioBrowser";

type TabType = "catalog" | "favorites";

function loadFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem("radio_favorites_v2") || "[]"); } catch { return []; }
}
function loadFavoriteStations(): Station[] {
  try { return JSON.parse(localStorage.getItem("radio_fav_stations") || "[]"); } catch { return []; }
}
function loadCustomStations(): Station[] {
  try { return JSON.parse(localStorage.getItem("radio_custom_v2") || "[]"); } catch { return []; }
}

export default function RadioPage() {
  const [activeTab, setActiveTab] = useState<TabType>("catalog");
  const [selectedGenre, setSelectedGenre] = useState("Все");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [favoriteStations, setFavoriteStations] = useState<Station[]>(loadFavoriteStations);
  const [customStations] = useState<Station[]>(loadCustomStations);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (genre: string, query: string) => {
    setIsLoading(true);
    try {
      let result: Station[];
      if (query.trim()) {
        result = await searchStations(query);
      } else {
        result = await fetchByGenre(genre);
      }
      setStations([...customStations, ...result]);
    } catch {
      setStations(customStations);
    } finally {
      setIsLoading(false);
    }
  }, [customStations]);

  useEffect(() => {
    load(selectedGenre, search);
  }, [selectedGenre, search, load]);

  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val), 500);
  };

  const toggleFavorite = (station: Station) => {
    setFavorites((prev) => {
      const isFav = prev.includes(station.id);
      const nextIds = isFav ? prev.filter((f) => f !== station.id) : [...prev, station.id];
      const nextStations = isFav
        ? favoriteStations.filter((s) => s.id !== station.id)
        : [...favoriteStations, station];
      localStorage.setItem("radio_favorites_v2", JSON.stringify(nextIds));
      localStorage.setItem("radio_fav_stations", JSON.stringify(nextStations));
      setFavoriteStations(nextStations);
      return nextIds;
    });
  };

  const handleAddStation = (data: { name: string; genre: string; description: string; streamUrl: string; logo: string }) => {
    const newStation: Station = {
      id: "custom_" + Date.now(),
      country: "Мои станции",
      favicon: "",
      votes: 0,
      listeners: 0,
      ...data,
    };
    const updated = [...customStations, newStation];
    localStorage.setItem("radio_custom_v2", JSON.stringify(updated));
    setStations((prev) => [newStation, ...prev]);
  };

  const displayStations = activeTab === "favorites" ? favoriteStations : stations;

  return (
    <div className="min-h-screen" style={{ background: "#0d0d1a", fontFamily: "'Inter', sans-serif", color: "white" }}>

      {/* Hero */}
      <div className="relative overflow-hidden px-5 pt-12 pb-8" style={{ background: "linear-gradient(135deg, #1a0a3e 0%, #0d0d1a 60%)" }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #8b5cf6, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none" style={{ background: "radial-gradient(circle, #06b6d4, transparent)", transform: "translate(-30%, 30%)" }} />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
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
            <p className="text-gray-400 text-sm mt-2">30 000+ станций со всего мира</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 mt-2"
            style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd" }}
          >
            <Icon name="Plus" size={14} />
            Добавить
          </button>
        </div>

        <div className="mt-5 rounded-2xl overflow-hidden h-36 relative">
          <img
            src="https://cdn.poehali.dev/projects/18a334c5-1480-4d1d-9432-4965a035ddb3/files/e9efbc5e-aa7e-411a-b052-f99fa4569e50.jpg"
            alt="Radio"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #0d0d1a 0%, transparent 50%, #0d0d1a 100%)" }} />
        </div>
      </div>

      {/* Search */}
      <div className="px-5 mt-4">
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Icon name="Search" size={16} className="text-purple-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Поиск среди 30 000+ станций..."
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-500"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(""); setSearch(""); }} className="text-gray-500 hover:text-white">
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
      {activeTab === "catalog" && !search && (
        <div className="mt-4 px-5">
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
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
        {isLoading && activeTab === "catalog" ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl p-4 flex items-center gap-3 animate-pulse" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-12 h-12 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-3 rounded-full w-2/3" style={{ background: "rgba(255,255,255,0.08)" }} />
                <div className="h-2 rounded-full w-1/2" style={{ background: "rgba(255,255,255,0.05)" }} />
              </div>
            </div>
          ))
        ) : displayStations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">{activeTab === "favorites" ? "💜" : "🔍"}</div>
            <p className="text-gray-400 text-sm">
              {activeTab === "favorites" ? "Нет избранных станций" : "Ничего не найдено"}
            </p>
          </div>
        ) : (
          displayStations.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              isPlaying={currentStation?.id === station.id}
              isFavorite={favorites.includes(station.id)}
              onPlay={setCurrentStation}
              onFavorite={() => toggleFavorite(station)}
            />
          ))
        )}
      </div>

      <RadioPlayer station={currentStation} onClose={() => setCurrentStation(null)} />

      {showAddModal && (
        <AddStationModal onClose={() => setShowAddModal(false)} onAdd={handleAddStation} />
      )}
    </div>
  );
}

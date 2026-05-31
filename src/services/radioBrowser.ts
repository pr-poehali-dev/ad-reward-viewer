const FALLBACK_SERVERS = [
  "https://de1.api.radio-browser.info/json",
  "https://nl1.api.radio-browser.info/json",
  "https://at1.api.radio-browser.info/json",
  "https://fi1.api.radio-browser.info/json",
];

let API_BASE = FALLBACK_SERVERS[0];

async function getWorkingServer(): Promise<string> {
  for (const server of FALLBACK_SERVERS) {
    try {
      const res = await fetch(`${server}/stats`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) return server;
    } catch {
      continue;
    }
  }
  return FALLBACK_SERVERS[0];
}

let serverInitialized = false;
async function ensureServer() {
  if (serverInitialized) return;
  serverInitialized = true;
  API_BASE = await getWorkingServer();
}

export interface RadioStation {
  stationuuid: string;
  name: string;
  url_resolved: string;
  favicon: string;
  tags: string;
  country: string;
  votes: number;
  clickcount: number;
  codec: string;
  bitrate: number;
  lastcheckok: number;
}

export interface Station {
  id: string;
  name: string;
  genre: string;
  country: string;
  description: string;
  streamUrl: string;
  logo: string;
  favicon: string;
  votes: number;
  listeners: number;
}

const GENRE_MAP: Record<string, string[]> = {
  "Поп": ["pop", "dance", "hits", "top40", "charts"],
  "Рок": ["rock", "alternative", "indie", "metal", "punk", "grunge"],
  "Джаз": ["jazz", "blues", "soul", "swing", "bebop"],
  "Электронная": ["electronic", "techno", "house", "trance", "edm", "chillout", "chill", "lounge", "ambient"],
  "Классика": ["classical", "classic", "opera", "symphony", "orchestra"],
  "Новости": ["news", "talk", "information", "speech"],
  "Хип-хоп": ["hip-hop", "hiphop", "hip hop", "rap", "rnb", "r&b"],
  "Регги": ["reggae", "reggaeton", "dancehall"],
  "Кантри": ["country", "folk", "bluegrass"],
};

const GENRE_EMOJIS: Record<string, string> = {
  "Поп": "🎵",
  "Рок": "🎸",
  "Джаз": "🎷",
  "Электронная": "🎛️",
  "Классика": "🎻",
  "Новости": "📻",
  "Хип-хоп": "🎤",
  "Регги": "🌿",
  "Кантри": "🤠",
  "Другое": "🎧",
};

function detectGenre(tags: string, name: string): string {
  const combined = (tags + " " + name).toLowerCase();
  for (const [genre, keywords] of Object.entries(GENRE_MAP)) {
    if (keywords.some((kw) => combined.includes(kw))) return genre;
  }
  return "Другое";
}

function mapStation(raw: RadioStation): Station {
  const genre = detectGenre(raw.tags, raw.name);
  return {
    id: raw.stationuuid,
    name: raw.name.trim(),
    genre,
    country: raw.country || "Неизвестно",
    description: raw.tags ? raw.tags.split(",").slice(0, 3).join(", ") : genre,
    streamUrl: raw.url_resolved,
    logo: GENRE_EMOJIS[genre] || "🎧",
    favicon: raw.favicon || "",
    votes: raw.votes,
    listeners: raw.clickcount,
  };
}

async function apiFetch(path: string): Promise<RadioStation[]> {
  await ensureServer();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "User-Agent": "RadioCatalog/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  return res.json();
}

export async function fetchTopStations(limit = 40): Promise<Station[]> {
  const data = await apiFetch(`/stations/search?limit=${limit}&hidebroken=true&order=votes&reverse=true`);
  return data.filter((s) => s.lastcheckok === 1 && s.url_resolved).map(mapStation);
}

export async function fetchByGenre(genre: string, limit = 40): Promise<Station[]> {
  if (genre === "Все") return fetchTopStations(limit);
  const keywords = GENRE_MAP[genre] || [];
  if (!keywords.length) return [];
  const tag = keywords[0];
  const data = await apiFetch(`/stations/bytag/${encodeURIComponent(tag)}?limit=${limit}&hidebroken=true&order=votes&reverse=true`);
  return data.filter((s) => s.lastcheckok === 1 && s.url_resolved).map(mapStation);
}

export async function searchStations(query: string, limit = 30): Promise<Station[]> {
  const data = await apiFetch(`/stations/search?name=${encodeURIComponent(query)}&limit=${limit}&hidebroken=true&order=votes&reverse=true`);
  return data.filter((s) => s.lastcheckok === 1 && s.url_resolved).map(mapStation);
}

export async function fetchByCountry(countrycode: string, genre: string, limit = 40): Promise<Station[]> {
  const tag = genre !== "Все" ? (GENRE_MAP[genre]?.[0] || "") : "";
  const tagParam = tag ? `&tag=${encodeURIComponent(tag)}` : "";
  const data = await apiFetch(`/stations/search?countrycode=${encodeURIComponent(countrycode)}${tagParam}&limit=${limit}&hidebroken=true&order=votes&reverse=true`);
  return data.filter((s) => s.lastcheckok === 1 && s.url_resolved).map(mapStation);
}

export const GENRES = ["Все", "Поп", "Рок", "Джаз", "Электронная", "Классика", "Новости", "Хип-хоп", "Регги", "Кантри"];

export const COUNTRIES: { label: string; code: string; flag: string }[] = [
  { label: "Все страны", code: "", flag: "🌍" },
  { label: "Россия", code: "RU", flag: "🇷🇺" },
  { label: "США", code: "US", flag: "🇺🇸" },
  { label: "Великобритания", code: "GB", flag: "🇬🇧" },
  { label: "Германия", code: "DE", flag: "🇩🇪" },
  { label: "Франция", code: "FR", flag: "🇫🇷" },
  { label: "Испания", code: "ES", flag: "🇪🇸" },
  { label: "Италия", code: "IT", flag: "🇮🇹" },
  { label: "Япония", code: "JP", flag: "🇯🇵" },
  { label: "Бразилия", code: "BR", flag: "🇧🇷" },
];
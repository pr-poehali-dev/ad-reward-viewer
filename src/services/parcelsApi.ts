const BASE = "https://functions.poehali.dev/8bf00bd5-f5d0-427b-91db-7ec3ecee3e31";

export function getDeviceId(): string {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = "d_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("device_id", id);
  }
  return id;
}

function h() {
  return { "Content-Type": "application/json", "X-Device-Id": getDeviceId() };
}

async function req(path: string, method = "GET", body?: object) {
  const res = await fetch(`${BASE}${path}`, {
    method, headers: h(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка");
  return data;
}

export interface Parcel {
  id: number;
  track: string;
  title: string;
  carrier: string;
  carrier_name: string;
  status: "pending" | "in_transit" | "delivered" | "unknown";
  status_text: string;
  last_event: string;
  last_update: string;
  delivered: boolean;
  created_at: string;
  events?: TrackEvent[];
}

export interface TrackEvent {
  date: string;
  location: string;
  description: string;
}

export const CARRIERS = [
  { id: "auto",         name: "Определить автоматически", emoji: "🔍" },
  { id: "pochta",       name: "Почта России",              emoji: "📮" },
  { id: "cainiao",      name: "Cainiao / AliExpress",      emoji: "📦" },
  { id: "sdek",         name: "СДЭК",                      emoji: "🚚" },
  { id: "wildberries",  name: "Wildberries",                emoji: "🛍️" },
  { id: "ozon",         name: "Ozon",                       emoji: "🔵" },
  { id: "universal",    name: "Другой",                     emoji: "🌍" },
];

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  pending:    { label: "Ожидает",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  emoji: "⏳" },
  in_transit: { label: "В пути",    color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  emoji: "✈️" },
  delivered:  { label: "Доставлен", color: "#10b981", bg: "rgba(16,185,129,0.12)",  emoji: "✅" },
  unknown:    { label: "Нет данных",color: "#6b7280", bg: "rgba(107,114,128,0.12)", emoji: "❓" },
};

export const fetchParcels = () => req("/list");
export const addParcel = (track: string, title: string, carrier: string) =>
  req("/add", "POST", { track, title, carrier: carrier === "auto" ? undefined : carrier });
export const refreshParcel = (id: number) => req("/refresh", "POST", { id });
export const deleteParcel = (id: number) => req("/delete", "DELETE", { id });
export const getDetail = (id: number) => req(`/detail?id=${id}`);

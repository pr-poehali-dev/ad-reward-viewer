const USER_SYNC_URL = "https://functions.poehali.dev/15c13869-929f-4bc3-9a17-40ae69ec35b0";
const WITHDRAW_URL = "https://functions.poehali.dev/9040abe8-ed07-4ea4-8bba-a16baae0c220";

export const COINS_TO_RUB = 12000; // 12000 монет = 10 руб

// Генерируем или берём device_id из localStorage
export function getDeviceId(): string {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = "d_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("device_id", id);
  }
  return id;
}

function headers() {
  return { "Content-Type": "application/json", "X-Device-Id": getDeviceId() };
}

export interface UserProfile {
  id: number;
  balance: number;
  yoomoney_wallet: string;
  frikassa_wallet: string;
  coins_to_rub: number;
  coins_per_ad: number;
}

export interface HistoryItem {
  type: "earn" | "withdraw";
  coins: number;
  system?: string;
  status?: string;
  created_at: string;
}

export async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch(USER_SYNC_URL + "/", { headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
  return data;
}

export async function watchAd(): Promise<{ balance: number; earned: number }> {
  const res = await fetch(USER_SYNC_URL + "/", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ action: "watch_ad" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка");
  return data;
}

export async function fetchHistory(): Promise<HistoryItem[]> {
  const res = await fetch(USER_SYNC_URL + "/history", { headers: headers() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка");
  return data;
}

export async function updateProfile(frikassa_wallet: string, yoomoney_wallet = "") {
  const res = await fetch(USER_SYNC_URL + "/", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ action: "update_profile", frikassa_wallet, yoomoney_wallet }),
  });
  return res.json();
}

export async function withdraw(system: "frikassa" | "yoomoney", wallet: string, amount: number) {
  const res = await fetch(WITHDRAW_URL + "/", {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ system, wallet, amount }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка вывода");
  return data;
}

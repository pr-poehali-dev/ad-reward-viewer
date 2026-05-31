const AUTH_URL = "https://functions.poehali.dev/30e067c6-cd60-41f1-a877-385c379d50e6";
const TASKS_URL = "https://functions.poehali.dev/aca03559-f0f2-4eb8-9075-b989dc913835";
const API_URL = "https://functions.poehali.dev/82e30c9a-1ba9-4eea-9a4f-94178da40ea8";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "executor" | "advertiser";
  balance: number;
  avatar: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  platform: string;
  task_type: string;
  link: string;
  reward: number;
  total_slots: number;
  filled_slots: number;
  status: string;
  created_at: string;
  advertiser_name?: string;
  my_status?: string | null;
  pending_count?: number;
}

export interface Execution {
  id: number;
  task_id: number;
  title: string;
  platform: string;
  task_type: string;
  reward: number;
  status: string;
  proof_url?: string;
  created_at: string;
  name?: string;
  avatar?: string;
  executor_id?: number;
}

export interface Transaction {
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

function getToken() {
  return localStorage.getItem("smm_token") || "";
}

function authHeaders() {
  return { "Content-Type": "application/json", "X-Session-Token": getToken() };
}

async function call(url: string, path: string, method = "GET", body?: object) {
  const res = await fetch(`${url}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка сервера");
  return data;
}

// Auth
export async function register(email: string, password: string, name: string, role: string, avatar: string) {
  const data = await call(AUTH_URL, "/register", "POST", { email, password, name, role, avatar });
  localStorage.setItem("smm_token", data.token);
  return data as User;
}

export async function login(email: string, password: string) {
  const data = await call(AUTH_URL, "/login", "POST", { email, password });
  localStorage.setItem("smm_token", data.token);
  return data as User;
}

export async function getMe(): Promise<User> {
  return call(AUTH_URL, "/me");
}

export function logout() {
  localStorage.removeItem("smm_token");
}

// Tasks
export async function fetchTasks(platform = "", task_type = ""): Promise<Task[]> {
  const q = new URLSearchParams();
  if (platform) q.set("platform", platform);
  if (task_type) q.set("task_type", task_type);
  return call(TASKS_URL, `/list?${q}`);
}

export async function fetchMyTasks(): Promise<Task[]> {
  return call(TASKS_URL, "/my");
}

export async function createTask(data: {
  title: string; description: string; platform: string;
  task_type: string; link: string; reward: number; total_slots: number;
}) {
  return call(TASKS_URL, "/create", "POST", data);
}

export async function setTaskStatus(task_id: number, status: string) {
  return call(TASKS_URL, "/status", "PUT", { task_id, status });
}

// API (balance + executions)
export async function fetchBalance(): Promise<{ balance: number; transactions: Transaction[] }> {
  return call(API_URL, "/balance");
}

export async function topUp(amount: number) {
  return call(API_URL, "/topup", "POST", { amount });
}

export async function submitTask(task_id: number, proof_url: string) {
  return call(API_URL, "/submit", "POST", { task_id, proof_url });
}

export async function fetchMyExecutions(): Promise<Execution[]> {
  return call(API_URL, "/my-executions");
}

export async function fetchForTask(task_id: number): Promise<Execution[]> {
  return call(API_URL, `/for-task?task_id=${task_id}`);
}

export async function reviewExecution(execution_id: number, action: "approve" | "reject") {
  return call(API_URL, "/review", "POST", { execution_id, action });
}

export const PLATFORMS = ["ВКонтакте", "Telegram", "YouTube", "Instagram", "TikTok", "Twitter/X", "Одноклассники"];
export const TASK_TYPES = ["Подписка", "Лайк", "Репост", "Комментарий", "Просмотр", "Отзыв"];
export const PLATFORM_ICONS: Record<string, string> = {
  "ВКонтакте": "💙", "Telegram": "✈️", "YouTube": "▶️",
  "Instagram": "📸", "TikTok": "🎵", "Twitter/X": "🐦", "Одноклассники": "🟠",
};
export const TYPE_ICONS: Record<string, string> = {
  "Подписка": "➕", "Лайк": "❤️", "Репост": "🔄",
  "Комментарий": "💬", "Просмотр": "👁️", "Отзыв": "⭐",
};
export const AVATARS = ["😊", "😎", "🤩", "🦊", "🐺", "🐸", "🦁", "🐯", "🦄", "🐉", "🤖", "👾"];

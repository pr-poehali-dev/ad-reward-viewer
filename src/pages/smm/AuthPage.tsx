import { useState } from "react";
import { login, register, AVATARS } from "@/services/smmApi";
import type { User } from "@/services/smmApi";
import Icon from "@/components/ui/icon";

interface Props { onAuth: (user: User) => void; }

export default function AuthPage({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<"executor" | "advertiser">("executor");
  const [avatar, setAvatar] = useState("😊");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      let user: User;
      if (mode === "login") {
        user = await login(email, password);
      } else {
        user = await register(email, password, name, role, avatar);
      }
      onAuth(user);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <Icon name="TrendingUp" size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">SMMBoost</h1>
          <p className="text-gray-400 text-sm mt-1">Заработок на социальных сетях</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}>
          {/* Tabs */}
          <div className="flex gap-2 mb-6 rounded-xl p-1" style={{ background: "rgba(0,0,0,0.3)" }}>
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: mode === m ? "rgba(99,102,241,0.8)" : "transparent", color: mode === m ? "white" : "#9ca3af" }}>
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          {/* Role (only register) */}
          {mode === "register" && (
            <>
              <div className="flex gap-2 mb-4">
                {([["executor", "💼", "Исполнитель", "Выполняю задания"], ["advertiser", "📢", "Рекламодатель", "Создаю задания"]] as const).map(([r, icon, label, desc]) => (
                  <button key={r} onClick={() => setRole(r)}
                    className="flex-1 rounded-xl p-3 text-left transition-all"
                    style={{ background: role === r ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.04)", border: `1px solid ${role === r ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.08)"}` }}>
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-white text-xs font-bold">{label}</div>
                    <div className="text-gray-500 text-xs">{desc}</div>
                  </button>
                ))}
              </div>

              <div className="mb-4">
                <p className="text-gray-400 text-xs mb-2">Выбери аватар</p>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map((a) => (
                    <button key={a} onClick={() => setAvatar(a)}
                      className="w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all"
                      style={{ background: avatar === a ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.05)", border: avatar === a ? "1px solid #6366f1" : "1px solid transparent" }}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <input value={name} onChange={e => setName(e.target.value)} placeholder="Имя"
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none mb-3"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </>
          )}

          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email"
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none mb-3"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />

          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Пароль" type="password"
            className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none mb-4"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
            onKeyDown={e => e.key === "Enter" && submit()} />

          {error && <p className="text-red-400 text-xs mb-3 text-center">{error}</p>}

          <button onClick={submit} disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            {loading ? "Загрузка..." : mode === "login" ? "Войти" : "Создать аккаунт"}
          </button>
        </div>
      </div>
    </div>
  );
}

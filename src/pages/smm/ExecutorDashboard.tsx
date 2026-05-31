import { useState, useEffect } from "react";
import { fetchTasks, fetchMyExecutions, fetchBalance, submitTask, logout, PLATFORMS, TASK_TYPES, PLATFORM_ICONS, TYPE_ICONS } from "@/services/smmApi";
import type { User, Task, Execution, Transaction } from "@/services/smmApi";
import Icon from "@/components/ui/icon";

interface Props { user: User; onLogout: () => void; }

type Tab = "tasks" | "my" | "wallet";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: "На проверке", color: "#f59e0b" },
  approved: { label: "Одобрено",    color: "#10b981" },
  rejected: { label: "Отклонено",   color: "#ef4444" },
};

export default function ExecutorDashboard({ user, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(user.balance);
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitModal, setSubmitModal] = useState<Task | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    if (tab === "tasks") {
      setLoading(true);
      fetchTasks(filterPlatform, filterType).then(setTasks).finally(() => setLoading(false));
    }
    if (tab === "my") fetchMyExecutions().then(setExecutions);
    if (tab === "wallet") fetchBalance().then(d => { setBalance(d.balance); setTransactions(d.transactions); });
  }, [tab, filterPlatform, filterType]);

  const handleSubmit = async () => {
    if (!submitModal) return;
    setSubmitError("");
    setSubmitLoading(true);
    try {
      await submitTask(submitModal.id, proofUrl);
      showToast("✅ Задание отправлено на проверку!");
      setSubmitModal(null);
      setProofUrl("");
      fetchTasks(filterPlatform, filterType).then(setTasks);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#0f0e17", color: "white" }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-5" style={{ background: "linear-gradient(135deg, #1a1040, #0f0e17)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: "rgba(99,102,241,0.2)" }}>{user.avatar}</div>
            <div>
              <p className="font-bold text-white">{user.name}</p>
              <p className="text-xs text-indigo-300">💼 Исполнитель</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl px-3 py-2 text-center" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
              <p className="text-indigo-300 text-xs">Баланс</p>
              <p className="text-white font-black text-sm">{balance.toFixed(2)} ₽</p>
            </div>
            <button onClick={() => { logout(); onLogout(); }} className="text-gray-500 hover:text-white"><Icon name="LogOut" size={18} /></button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-2 mb-4">
        {([["tasks","Задания","Briefcase"],["my","Мои работы","CheckCircle"],["wallet","Кошелёк","Wallet"]] as const).map(([t, label, icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 flex flex-col items-center py-2.5 rounded-xl text-xs font-semibold transition-all gap-1"
            style={{ background: tab === t ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)", color: tab === t ? "#a5b4fc" : "#6b7280", border: tab === t ? "1px solid rgba(99,102,241,0.5)" : "1px solid transparent" }}>
            <Icon name={icon} size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {tab === "tasks" && (
        <div className="px-4">
          {/* Filters */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <button onClick={() => setFilterPlatform("")}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: !filterPlatform ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)", color: !filterPlatform ? "#a5b4fc" : "#6b7280", border: !filterPlatform ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.07)" }}>
              Все платформы
            </button>
            {PLATFORMS.map(p => (
              <button key={p} onClick={() => setFilterPlatform(filterPlatform === p ? "" : p)}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{ background: filterPlatform === p ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)", color: filterPlatform === p ? "#a5b4fc" : "#6b7280", border: filterPlatform === p ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.07)" }}>
                {PLATFORM_ICONS[p]} {p}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            <button onClick={() => setFilterType("")}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{ background: !filterType ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)", color: !filterType ? "#a5b4fc" : "#6b7280", border: !filterType ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.07)" }}>
              Все типы
            </button>
            {TASK_TYPES.map(t => (
              <button key={t} onClick={() => setFilterType(filterType === t ? "" : t)}
                className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{ background: filterType === t ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.05)", color: filterType === t ? "#a5b4fc" : "#6b7280", border: filterType === t ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.07)" }}>
                {TYPE_ICONS[t]} {t}
              </button>
            ))}
          </div>

          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl p-4 mb-3 animate-pulse" style={{ background: "rgba(255,255,255,0.04)", height: 110 }} />
            ))
          ) : tasks.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <p>Нет доступных заданий</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pb-24">
              {tasks.map(task => (
                <div key={task.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{PLATFORM_ICONS[task.platform] || "📱"}</span>
                      <div>
                        <p className="text-white font-semibold text-sm">{task.title}</p>
                        <p className="text-gray-400 text-xs">{task.platform} · {TYPE_ICONS[task.task_type]} {task.task_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-black text-base">+{task.reward} ₽</p>
                      <p className="text-gray-500 text-xs">{task.filled_slots}/{task.total_slots} мест</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">{task.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 h-1.5 rounded-full mr-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(task.filled_slots / task.total_slots) * 100}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
                    </div>
                    {task.my_status ? (
                      <span className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{ background: `${STATUS_LABEL[task.my_status]?.color}22`, color: STATUS_LABEL[task.my_status]?.color }}>
                        {STATUS_LABEL[task.my_status]?.label}
                      </span>
                    ) : (
                      <button onClick={() => { setSubmitModal(task); setProofUrl(""); setSubmitError(""); }}
                        className="text-xs px-4 py-1.5 rounded-xl font-semibold text-white transition-all active:scale-95"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                        Выполнить
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My executions tab */}
      {tab === "my" && (
        <div className="px-4 flex flex-col gap-3 pb-24">
          {executions.length === 0 ? (
            <div className="text-center py-16 text-gray-500"><div className="text-4xl mb-3">📋</div><p>Ты ещё не брался за задания</p></div>
          ) : executions.map(ex => (
            <div key={ex.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-white font-semibold text-sm">{ex.title}</p>
                <p className="text-green-400 font-bold">+{ex.reward} ₽</p>
              </div>
              <p className="text-gray-400 text-xs mb-2">{PLATFORM_ICONS[ex.platform]} {ex.platform} · {TYPE_ICONS[ex.task_type]} {ex.task_type}</p>
              <span className="text-xs px-3 py-1 rounded-full font-medium"
                style={{ background: `${STATUS_LABEL[ex.status]?.color}22`, color: STATUS_LABEL[ex.status]?.color }}>
                {STATUS_LABEL[ex.status]?.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Wallet tab */}
      {tab === "wallet" && (
        <div className="px-4 pb-24">
          <div className="rounded-2xl p-5 mb-4 text-center" style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", border: "1px solid rgba(99,102,241,0.3)" }}>
            <p className="text-indigo-300 text-sm mb-1">Твой баланс</p>
            <p className="text-4xl font-black text-white">{balance.toFixed(2)} ₽</p>
          </div>
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">История операций</p>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-600"><div className="text-4xl mb-2">💸</div><p>Операций пока нет</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div>
                    <p className="text-white text-sm">{tx.description}</p>
                    <p className="text-gray-500 text-xs">{new Date(tx.created_at).toLocaleDateString("ru")}</p>
                  </div>
                  <p className={`font-bold ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount} ₽
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit modal */}
      {submitModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setSubmitModal(null)}>
          <div className="w-full max-w-md rounded-t-3xl p-6" style={{ background: "#1a1a2e" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-black text-lg mb-1">{submitModal.title}</h3>
            <p className="text-indigo-300 text-sm mb-3">{PLATFORM_ICONS[submitModal.platform]} {submitModal.platform} · {TYPE_ICONS[submitModal.task_type]} {submitModal.task_type}</p>
            <p className="text-gray-300 text-sm mb-4">{submitModal.description}</p>
            <a href={submitModal.link} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-indigo-400 text-sm mb-4 underline">
              <Icon name="ExternalLink" size={14} /> Открыть ссылку
            </a>
            <p className="text-gray-400 text-xs mb-2">Ссылка на доказательство (скриншот, профиль и т.д.) — необязательно</p>
            <input value={proofUrl} onChange={e => setProofUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none mb-3"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }} />
            {submitError && <p className="text-red-400 text-xs mb-3">{submitError}</p>}
            <button onClick={handleSubmit} disabled={submitLoading}
              className="w-full py-3 rounded-xl font-bold text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              {submitLoading ? "Отправка..." : `Сдать задание · +${submitModal.reward} ₽`}
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-4 right-4 text-center py-3 rounded-2xl font-semibold text-white z-50"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

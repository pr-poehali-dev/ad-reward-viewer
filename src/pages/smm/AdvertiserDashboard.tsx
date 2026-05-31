import { useState, useEffect } from "react";
import { fetchMyTasks, createTask, setTaskStatus, fetchForTask, reviewExecution, fetchBalance, topUp, logout, PLATFORMS, TASK_TYPES, PLATFORM_ICONS, TYPE_ICONS } from "@/services/smmApi";
import type { User, Task, Execution, Transaction } from "@/services/smmApi";
import Icon from "@/components/ui/icon";

interface Props { user: User; onLogout: () => void; }
type Tab = "tasks" | "create" | "wallet";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: "На проверке", color: "#f59e0b" },
  approved: { label: "Одобрено",    color: "#10b981" },
  rejected: { label: "Отклонено",   color: "#ef4444" },
};

export default function AdvertiserDashboard({ user, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [balance, setBalance] = useState(user.balance);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [topupAmount, setTopupAmount] = useState("500");
  const [topupLoading, setTopupLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);

  // Create form
  const [form, setForm] = useState({ title: "", description: "", platform: PLATFORMS[0], task_type: TASK_TYPES[0], link: "", reward: "10", total_slots: "10" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  useEffect(() => {
    if (tab === "tasks") fetchMyTasks().then(setTasks);
    if (tab === "wallet") fetchBalance().then(d => { setBalance(d.balance); setTransactions(d.transactions); });
  }, [tab]);

  useEffect(() => {
    if (selectedTask) fetchForTask(selectedTask.id).then(setExecutions);
  }, [selectedTask]);

  const handleCreate = async () => {
    setCreateError("");
    setCreateLoading(true);
    try {
      await createTask({ ...form, reward: parseFloat(form.reward), total_slots: parseInt(form.total_slots) });
      showToast("✅ Задание создано!");
      setTab("tasks");
      fetchMyTasks().then(setTasks);
      setForm({ title: "", description: "", platform: PLATFORMS[0], task_type: TASK_TYPES[0], link: "", reward: "10", total_slots: "10" });
    } catch (e: unknown) {
      setCreateError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleTopup = async () => {
    setTopupLoading(true);
    try {
      const res = await topUp(parseFloat(topupAmount));
      setBalance(res.balance);
      showToast(`✅ Пополнено на ${topupAmount} ₽`);
      fetchBalance().then(d => setTransactions(d.transactions));
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setTopupLoading(false);
    }
  };

  const handleReview = async (exec_id: number, action: "approve" | "reject") => {
    await reviewExecution(exec_id, action);
    showToast(action === "approve" ? "✅ Одобрено, деньги переведены" : "❌ Отклонено");
    if (selectedTask) fetchForTask(selectedTask.id).then(setExecutions);
    fetchMyTasks().then(setTasks);
  };

  const toggleTask = async (task: Task, status: string) => {
    await setTaskStatus(task.id, status === "active" ? "paused" : "active");
    fetchMyTasks().then(setTasks);
  };

  const totalCost = parseFloat(form.reward || "0") * parseInt(form.total_slots || "0");

  return (
    <div className="min-h-screen" style={{ background: "#0f0e17", color: "white" }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-5" style={{ background: "linear-gradient(135deg, #0c1a0f, #0f0e17)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: "rgba(16,185,129,0.2)" }}>{user.avatar}</div>
            <div>
              <p className="font-bold text-white">{user.name}</p>
              <p className="text-xs text-emerald-300">📢 Рекламодатель</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl px-3 py-2 text-center" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <p className="text-emerald-300 text-xs">Баланс</p>
              <p className="text-white font-black text-sm">{balance.toFixed(2)} ₽</p>
            </div>
            <button onClick={() => { logout(); onLogout(); }} className="text-gray-500 hover:text-white"><Icon name="LogOut" size={18} /></button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 gap-2 mb-4">
        {([["tasks","Мои задания","ListChecks"],["create","Создать","PlusCircle"],["wallet","Кошелёк","Wallet"]] as const).map(([t, label, icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 flex flex-col items-center py-2.5 rounded-xl text-xs font-semibold transition-all gap-1"
            style={{ background: tab === t ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.05)", color: tab === t ? "#6ee7b7" : "#6b7280", border: tab === t ? "1px solid rgba(16,185,129,0.5)" : "1px solid transparent" }}>
            <Icon name={icon} size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {tab === "tasks" && (
        <div className="px-4 pb-24">
          {tasks.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">📭</div>
              <p className="mb-4">Заданий пока нет</p>
              <button onClick={() => setTab("create")}
                className="px-5 py-2.5 rounded-xl font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                Создать первое задание
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tasks.map(task => (
                <div key={task.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-semibold text-sm">{task.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{PLATFORM_ICONS[task.platform]} {task.platform} · {TYPE_ICONS[task.task_type]} {task.task_type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">{task.reward} ₽/шт</p>
                      <p className="text-gray-500 text-xs">{task.filled_slots}/{task.total_slots}</p>
                    </div>
                  </div>

                  <div className="flex-1 h-1.5 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(task.filled_slots / task.total_slots) * 100}%`, background: "linear-gradient(90deg, #10b981, #059669)" }} />
                  </div>

                  <div className="flex items-center gap-2">
                    {task.pending_count ? (
                      <button onClick={() => setSelectedTask(task)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-medium"
                        style={{ background: "rgba(245,158,11,0.2)", color: "#fbbf24" }}>
                        <Icon name="Clock" size={12} /> {task.pending_count} на проверке
                      </button>
                    ) : (
                      <button onClick={() => setSelectedTask(task)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-medium"
                        style={{ background: "rgba(255,255,255,0.07)", color: "#9ca3af" }}>
                        <Icon name="Users" size={12} /> Исполнители
                      </button>
                    )}
                    <button onClick={() => toggleTask(task, task.status)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-medium ml-auto transition-all"
                      style={{ background: task.status === "active" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: task.status === "active" ? "#6ee7b7" : "#fca5a5" }}>
                      <Icon name={task.status === "active" ? "Pause" : "Play"} size={12} />
                      {task.status === "active" ? "Пауза" : "Запустить"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create tab */}
      {tab === "create" && (
        <div className="px-4 pb-24">
          <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <p className="text-emerald-300 text-sm font-semibold mb-1">💰 Стоимость задания</p>
            <p className="text-white font-black text-2xl">{isNaN(totalCost) ? 0 : totalCost.toFixed(2)} ₽</p>
            <p className="text-gray-400 text-xs mt-1">Твой баланс: {balance.toFixed(2)} ₽</p>
          </div>

          {[
            { label: "Название задания", key: "title", placeholder: "Подпишись на наш канал в Telegram" },
            { label: "Описание", key: "description", placeholder: "Подробное описание что нужно сделать..." },
            { label: "Ссылка", key: "link", placeholder: "https://t.me/yourchannel" },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="mb-3">
              <p className="text-gray-400 text-xs mb-1">{label}</p>
              {key === "description" ? (
                <textarea value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder} rows={3}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
              ) : (
                <input value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
              )}
            </div>
          ))}

          <div className="mb-3">
            <p className="text-gray-400 text-xs mb-1">Платформа</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => setForm(f => ({ ...f, platform: p }))}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{ background: form.platform === p ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.05)", color: form.platform === p ? "#6ee7b7" : "#6b7280", border: form.platform === p ? "1px solid rgba(16,185,129,0.5)" : "1px solid rgba(255,255,255,0.07)" }}>
                  {PLATFORM_ICONS[p]} {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <p className="text-gray-400 text-xs mb-1">Тип задания</p>
            <div className="flex flex-wrap gap-2">
              {TASK_TYPES.map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, task_type: t }))}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{ background: form.task_type === t ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.05)", color: form.task_type === t ? "#6ee7b7" : "#6b7280", border: form.task_type === t ? "1px solid rgba(16,185,129,0.5)" : "1px solid rgba(255,255,255,0.07)" }}>
                  {TYPE_ICONS[t]} {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <p className="text-gray-400 text-xs mb-1">Награда за выполнение, ₽</p>
              <input type="number" value={form.reward} onChange={e => setForm(f => ({ ...f, reward: e.target.value }))} min="1"
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-xs mb-1">Кол-во исполнителей</p>
              <input type="number" value={form.total_slots} onChange={e => setForm(f => ({ ...f, total_slots: e.target.value }))} min="1"
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
            </div>
          </div>

          {createError && <p className="text-red-400 text-xs mb-3">{createError}</p>}

          <button onClick={handleCreate} disabled={createLoading}
            className="w-full py-3 rounded-xl font-bold text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
            {createLoading ? "Создание..." : `Создать задание · ${isNaN(totalCost) ? 0 : totalCost.toFixed(2)} ₽`}
          </button>
        </div>
      )}

      {/* Wallet tab */}
      {tab === "wallet" && (
        <div className="px-4 pb-24">
          <div className="rounded-2xl p-5 mb-4 text-center" style={{ background: "linear-gradient(135deg, #064e3b, #065f46)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <p className="text-emerald-300 text-sm mb-1">Твой баланс</p>
            <p className="text-4xl font-black text-white">{balance.toFixed(2)} ₽</p>
          </div>

          <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-gray-400 text-xs mb-2">Пополнить баланс (демо)</p>
            <div className="flex gap-2 mb-3">
              {["100","500","1000","2000"].map(a => (
                <button key={a} onClick={() => setTopupAmount(a)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: topupAmount === a ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.05)", color: topupAmount === a ? "#6ee7b7" : "#9ca3af" }}>
                  {a} ₽
                </button>
              ))}
            </div>
            <input type="number" value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none mb-3"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
            <button onClick={handleTopup} disabled={topupLoading}
              className="w-full py-2.5 rounded-xl font-bold text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              {topupLoading ? "Пополнение..." : `Пополнить на ${topupAmount} ₽`}
            </button>
          </div>

          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">История операций</p>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-600"><div className="text-3xl mb-2">💸</div><p>Операций пока нет</p></div>
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

      {/* Executions modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setSelectedTask(null)}>
          <div className="w-full max-w-md rounded-t-3xl p-6 max-h-[75vh] overflow-y-auto" style={{ background: "#1a1a2e" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold">Исполнители</h3>
              <button onClick={() => setSelectedTask(null)} className="text-gray-500"><Icon name="X" size={18} /></button>
            </div>
            {executions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Никто ещё не взялся за задание</p>
            ) : executions.map(ex => (
              <div key={ex.id} className="rounded-xl p-3 mb-2 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.05)" }}>
                <span className="text-xl">{ex.avatar}</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{ex.name}</p>
                  {ex.proof_url && <a href={ex.proof_url} target="_blank" rel="noreferrer" className="text-indigo-400 text-xs underline">Доказательство</a>}
                </div>
                {ex.status === "pending" ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleReview(ex.id, "approve")}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-green-400 hover:bg-green-900/30 transition-all">
                      <Icon name="Check" size={16} />
                    </button>
                    <button onClick={() => handleReview(ex.id, "reject")}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:bg-red-900/30 transition-all">
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full"
                    style={{ background: `${STATUS_LABEL[ex.status]?.color}22`, color: STATUS_LABEL[ex.status]?.color }}>
                    {STATUS_LABEL[ex.status]?.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-4 right-4 text-center py-3 rounded-2xl font-semibold text-white z-50"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

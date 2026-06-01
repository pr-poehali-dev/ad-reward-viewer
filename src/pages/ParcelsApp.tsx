import { useState, useEffect } from "react";
import {
  fetchParcels, addParcel, refreshParcel, deleteParcel, getDetail,
  CARRIERS, STATUS_CONFIG,
} from "@/services/parcelsApi";
import type { Parcel, TrackEvent } from "@/services/parcelsApi";
import Icon from "@/components/ui/icon";

type Screen = "list" | "add" | "detail";

function timeAgo(str: string) {
  const diff = Date.now() - new Date(str).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} дн назад`;
}

/* ── Нижняя навигация ── */
function BottomNav({ screen, onNav, count }: { screen: Screen; onNav: (s: Screen) => void; count: number }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex z-40"
      style={{ background: "#111", borderTop: "1px solid #1e1e1e", paddingBottom: "env(safe-area-inset-bottom,8px)" }}>
      {([
        ["list", "Package", `Посылки${count ? ` (${count})` : ""}`],
        ["add",  "PlusCircle", "Добавить"],
      ] as const).map(([key, icon, label]) => {
        const active = screen === key;
        return (
          <button key={key} onClick={() => onNav(key)}
            className="flex-1 flex flex-col items-center py-3 gap-1">
            <Icon name={icon} size={22} style={{ color: active ? "#6366f1" : "#444" }} />
            <span className="text-xs font-semibold" style={{ color: active ? "#6366f1" : "#444" }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ── Карточка посылки ── */
function ParcelCard({ parcel, onOpen, onRefresh, onDelete }: {
  parcel: Parcel;
  onOpen: () => void;
  onRefresh: () => void;
  onDelete: () => void;
}) {
  const st = STATUS_CONFIG[parcel.status] || STATUS_CONFIG.unknown;
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#161616", border: "1px solid #222" }}>
      {/* Верхняя полоска статуса */}
      <div className="h-1" style={{ background: st.color, opacity: 0.7 }} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Иконка статуса */}
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
            style={{ background: st.bg }}>
            {st.emoji}
          </div>

          {/* Основное */}
          <div className="flex-1 min-w-0" onClick={onOpen} style={{ cursor: "pointer" }}>
            <p className="text-white font-bold text-sm truncate">{parcel.title}</p>
            <p className="text-gray-500 text-xs mt-0.5 font-mono">{parcel.track}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: st.bg, color: st.color }}>
                {st.label}
              </span>
              <span className="text-gray-600 text-xs">{parcel.carrier_name}</span>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={async () => { setRefreshing(true); await onRefresh(); setRefreshing(false); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: "#1e1e1e" }}>
              <Icon name="RefreshCw" size={14} style={{ color: refreshing ? "#6366f1" : "#555" }}
                className={refreshing ? "animate-spin" : ""} />
            </button>
            <button onClick={async () => { setDeleting(true); await onDelete(); }}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: "#1e1e1e" }}>
              <Icon name="Trash2" size={14} style={{ color: deleting ? "#ef4444" : "#555" }} />
            </button>
          </div>
        </div>

        {/* Последнее событие */}
        {parcel.last_event && (
          <div className="mt-3 rounded-xl px-3 py-2" style={{ background: "#0d0d0d" }}>
            <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{parcel.last_event}</p>
          </div>
        )}

        <p className="text-gray-700 text-xs mt-2 text-right">Обновлено {timeAgo(parcel.last_update)}</p>
      </div>
    </div>
  );
}

/* ── Экран деталей ── */
function DetailScreen({ parcel, onBack, onRefresh }: {
  parcel: Parcel;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [detail, setDetail] = useState<Parcel | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const st = STATUS_CONFIG[parcel.status] || STATUS_CONFIG.unknown;

  useEffect(() => {
    getDetail(parcel.id).then(setDetail);
  }, [parcel.id]);

  const events: TrackEvent[] = detail?.events || [];

  const doRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    const d = await getDetail(parcel.id);
    setDetail(d);
    setRefreshing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#0d0d0d" }}>
      {/* Шапка */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4"
        style={{ background: "#111", borderBottom: "1px solid #1e1e1e" }}>
        <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "#1e1e1e" }}>
          <Icon name="ArrowLeft" size={18} style={{ color: "#aaa" }} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold truncate">{parcel.title}</p>
          <p className="text-gray-500 text-xs font-mono">{parcel.track}</p>
        </div>
        <button onClick={doRefresh} disabled={refreshing}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "#1e1e1e" }}>
          <Icon name="RefreshCw" size={16} style={{ color: "#6366f1" }}
            className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Статус */}
        <div className="mx-4 mt-4 rounded-2xl p-4 flex items-center gap-3"
          style={{ background: st.bg, border: `1px solid ${st.color}33` }}>
          <span className="text-3xl">{st.emoji}</span>
          <div>
            <p className="font-black text-lg" style={{ color: st.color }}>{st.label}</p>
            <p className="text-sm text-gray-300">{parcel.status_text}</p>
          </div>
        </div>

        {/* Инфо */}
        <div className="grid grid-cols-2 gap-3 mx-4 mt-3">
          {[
            ["Перевозчик", parcel.carrier_name],
            ["Трек-номер", parcel.track],
            ["Добавлена", new Date(parcel.created_at).toLocaleDateString("ru")],
            ["Обновлено", timeAgo(parcel.last_update)],
          ].map(([label, val]) => (
            <div key={label} className="rounded-xl p-3" style={{ background: "#161616", border: "1px solid #222" }}>
              <p className="text-gray-600 text-xs mb-1">{label}</p>
              <p className="text-white text-sm font-semibold truncate">{val}</p>
            </div>
          ))}
        </div>

        {/* Timeline событий */}
        <div className="mx-4 mt-4">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">История событий</p>
          {events.length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm">Нет данных о движении</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {events.map((ev, i) => (
                <div key={i} className="flex gap-3">
                  {/* Линия */}
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                      style={{ background: i === 0 ? "#6366f1" : "#2a2a2a", border: i === 0 ? "2px solid #818cf8" : "2px solid #333" }} />
                    {i < events.length - 1 && <div className="w-0.5 flex-1 mt-1" style={{ background: "#222" }} />}
                  </div>
                  {/* Контент */}
                  <div className="pb-5 flex-1">
                    <p className="text-white text-sm font-medium leading-snug">{ev.description}</p>
                    {ev.location && <p className="text-gray-500 text-xs mt-0.5">📍 {ev.location}</p>}
                    {ev.date && <p className="text-gray-700 text-xs mt-0.5">{ev.date}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Главный компонент ── */
export default function ParcelsApp() {
  const [screen, setScreen] = useState<Screen>("list");
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Parcel | null>(null);

  // Форма добавления
  const [track, setTrack] = useState("");
  const [title, setTitle] = useState("");
  const [carrier, setCarrier] = useState("auto");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const load = () => fetchParcels().then(setParcels).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    setAddError("");
    if (!track.trim()) { setAddError("Введи трек-номер"); return; }
    setAdding(true);
    try {
      await addParcel(track.trim().toUpperCase(), title.trim() || `Посылка ${track.slice(0, 8)}`, carrier);
      showToast("✅ Посылка добавлена!");
      setTrack(""); setTitle(""); setCarrier("auto");
      setScreen("list");
      load();
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : "Ошибка");
    } finally { setAdding(false); }
  };

  const handleRefresh = async (id: number) => {
    try {
      await refreshParcel(id);
      await load();
    } catch { showToast("Не удалось обновить"); }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteParcel(id);
      await load();
      showToast("Удалено");
    } catch { showToast("Ошибка удаления"); }
  };

  const active = parcels.filter(p => !p.delivered);
  const delivered = parcels.filter(p => p.delivered);

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#0d0d0d", color: "white" }}>

      {/* Шапка */}
      <div className="flex-shrink-0 flex items-center justify-between px-5"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
          paddingBottom: 12,
          background: "linear-gradient(135deg, #1a1040, #111)",
          borderBottom: "1px solid #1e1e1e",
        }}>
        <div>
          <h1 className="text-xl font-black text-white">Мои посылки</h1>
          <p className="text-indigo-400 text-xs">{active.length} в пути · {delivered.length} доставлено</p>
        </div>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
          style={{ background: "rgba(99,102,241,0.2)" }}>📦</div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto pb-24" style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}>

        {/* ── СПИСОК ── */}
        {screen === "list" && (
          <div className="px-4 pt-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="rounded-2xl mb-3 animate-pulse" style={{ background: "#161616", height: 110 }} />
              ))
            ) : parcels.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-white font-bold text-lg mb-1">Посылок пока нет</p>
                <p className="text-gray-500 text-sm mb-6">Добавь трек-номер чтобы следить за доставкой</p>
                <button onClick={() => setScreen("add")}
                  className="px-6 py-3 rounded-2xl font-bold text-white transition-all active:scale-95"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                  Добавить посылку
                </button>
              </div>
            ) : (
              <>
                {active.length > 0 && (
                  <>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">В пути — {active.length}</p>
                    <div className="flex flex-col gap-3 mb-5">
                      {active.map(p => (
                        <ParcelCard key={p.id} parcel={p}
                          onOpen={() => { setDetail(p); }}
                          onRefresh={() => handleRefresh(p.id)}
                          onDelete={() => handleDelete(p.id)} />
                      ))}
                    </div>
                  </>
                )}
                {delivered.length > 0 && (
                  <>
                    <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Доставлено — {delivered.length}</p>
                    <div className="flex flex-col gap-3">
                      {delivered.map(p => (
                        <ParcelCard key={p.id} parcel={p}
                          onOpen={() => { setDetail(p); }}
                          onRefresh={() => handleRefresh(p.id)}
                          onDelete={() => handleDelete(p.id)} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── ДОБАВИТЬ ── */}
        {screen === "add" && (
          <div className="px-4 pt-4">
            <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <p className="text-indigo-300 text-sm">💡 Вставь трек-номер из письма или личного кабинета магазина</p>
            </div>

            {/* Трек-номер */}
            <div className="mb-3">
              <p className="text-gray-500 text-xs mb-1.5">Трек-номер *</p>
              <input value={track} onChange={e => setTrack(e.target.value)}
                placeholder="Например: RR123456789CN"
                className="w-full rounded-xl px-4 py-3.5 text-white font-mono outline-none"
                style={{ background: "#161616", border: "1px solid #2a2a2a", fontSize: 14 }} />
            </div>

            {/* Название */}
            <div className="mb-3">
              <p className="text-gray-500 text-xs mb-1.5">Название (необязательно)</p>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Например: Наушники с AliExpress"
                className="w-full rounded-xl px-4 py-3.5 text-white outline-none"
                style={{ background: "#161616", border: "1px solid #2a2a2a", fontSize: 14 }} />
            </div>

            {/* Перевозчик */}
            <div className="mb-5">
              <p className="text-gray-500 text-xs mb-1.5">Перевозчик</p>
              <div className="flex flex-wrap gap-2">
                {CARRIERS.map(c => (
                  <button key={c.id} onClick={() => setCarrier(c.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                    style={{
                      background: carrier === c.id ? "rgba(99,102,241,0.25)" : "#161616",
                      border: `1px solid ${carrier === c.id ? "rgba(99,102,241,0.6)" : "#2a2a2a"}`,
                      color: carrier === c.id ? "#a5b4fc" : "#666",
                    }}>
                    <span>{c.emoji}</span> {c.name}
                  </button>
                ))}
              </div>
            </div>

            {addError && <p className="text-red-400 text-sm mb-3">{addError}</p>}

            <button onClick={handleAdd} disabled={adding}
              className="w-full py-4 rounded-2xl font-black text-lg text-white transition-all active:scale-95"
              style={{ background: adding ? "#2a2a2a" : "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: adding ? "none" : "0 8px 24px rgba(99,102,241,0.3)" }}>
              {adding ? "⏳ Ищем посылку..." : "Добавить и найти"}
            </button>
          </div>
        )}
      </div>

      {/* Нижняя навигация */}
      <BottomNav screen={screen} onNav={setScreen} count={active.length} />

      {/* Детали посылки */}
      {detail && (
        <DetailScreen parcel={detail}
          onBack={() => setDetail(null)}
          onRefresh={() => handleRefresh(detail.id)} />
      )}

      {/* Тост */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 text-center py-3 rounded-2xl font-semibold text-white z-50 text-sm"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Pencil, Check, X, CheckSquare } from 'lucide-react';
import { fetchHabits, addHabit, updateHabit, removeHabit, fetchWeek, toggleDay } from '@/lib/api';

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

function getWeekMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Dom
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export default function ChecklistSemanalPage() {
  const monday = getWeekMonday();
  const weekKey = toKey(monday);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toKey(today);

  const [habits, setHabits] = useState([]);
  const [checks, setChecks] = useState({});
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    try {
      const [h, w] = await Promise.all([fetchHabits(), fetchWeek(weekKey)]);
      setHabits(h);
      setChecks(w);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [weekKey]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await addHabit(newName.trim());
      setHabits(res.habits);
      setNewName('');
    } catch (err) { alert(err.message); }
    finally { setAdding(false); }
  };

  const handleRemove = async (id) => {
    try {
      const res = await removeHabit(id);
      setHabits(res.habits);
    } catch (err) { alert(err.message); }
  };

  const handleEdit = async (id) => {
    if (!editName.trim()) return;
    try {
      const res = await updateHabit(id, editName.trim());
      setHabits(res.habits);
      setEditingId(null);
    } catch (err) { alert(err.message); }
  };

  const handleToggle = async (habitId, dayIndex) => {
    try {
      const res = await toggleDay(weekKey, habitId, dayIndex);
      setChecks(res.week);
    } catch (err) { alert(err.message); }
  };

  const isChecked = (habitId, dayIndex) =>
    Array.isArray(checks[habitId]) && checks[habitId].includes(dayIndex);

  // Counts per habit
  const doneCount = (habitId) => (checks[habitId] || []).length;

  // Header dates
  const firstDay = weekDays[0];
  const lastDay = weekDays[6];
  const sameMonth = firstDay.getMonth() === lastDay.getMonth();
  const rangeLabel = sameMonth
    ? `${firstDay.getDate()}–${lastDay.getDate()} de ${MONTH_NAMES[firstDay.getMonth()]} ${firstDay.getFullYear()}`
    : `${firstDay.getDate()} ${MONTH_NAMES[firstDay.getMonth()]} – ${lastDay.getDate()} ${MONTH_NAMES[lastDay.getMonth()]} ${lastDay.getFullYear()}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <CheckSquare size={20} strokeWidth={2.2} />
          </span>
          Checklist Semanal
        </h1>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
          {rangeLabel} · {habits.length} hábito{habits.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Add habit */}
      <div className="flex gap-2 mb-6 p-4 rounded-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <input
          type="text" value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Adicionar hábito (ex: Beber 2L de água)..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--text-primary)' }}
          autoFocus
        />
        <button onClick={handleAdd} disabled={!newName.trim() || adding}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent)' }}>
          {adding
            ? <span className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
            : <Plus size={16} strokeWidth={2.4} />}
          Adicionar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-20">
          <CheckSquare size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-secondary)' }} />
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
            Nenhum hábito ainda. Adicione um acima!
          </p>
        </div>
      ) : (
        <div className="card-surface rounded-xl overflow-hidden">
          {/* Grid header */}
          <div className="grid border-b border-[var(--border-soft)]"
            style={{ gridTemplateColumns: '1fr repeat(7, 56px)' }}>
            <div className="px-5 py-3 text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}>
              Hábito
            </div>
            {weekDays.map((d, i) => {
              const key = toKey(d);
              const isToday = key === todayKey;
              return (
                <div key={i} className="flex flex-col items-center justify-center py-3 gap-0.5">
                  <span className="text-xs font-semibold"
                    style={{ color: isToday ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    {DAY_LABELS[i]}
                  </span>
                  <span className={`text-xs tabular-nums font-bold w-6 h-6 rounded-full flex items-center justify-center`}
                    style={{
                      background: isToday ? 'var(--accent)' : 'transparent',
                      color: isToday ? 'white' : 'var(--text-secondary)',
                    }}>
                    {d.getDate()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Habit rows */}
          {habits.map((habit, idx) => {
            const done = doneCount(habit.id);
            const isEditing = editingId === habit.id;
            return (
              <div
                key={habit.id}
                className={`group grid border-b border-[var(--border-soft)] last:border-b-0 transition-colors hover:bg-[var(--bg-hover)]/40 ${idx % 2 === 1 ? 'bg-[var(--bg-subtle)]/40' : ''}`}
                style={{ gridTemplateColumns: '1fr repeat(7, 56px)' }}
              >
                {/* Habit name */}
                <div className="flex items-center gap-2 px-5 py-3 min-w-0">
                  {isEditing ? (
                    <>
                      <input
                        type="text" value={editName} onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEdit(habit.id); if (e.key === 'Escape') setEditingId(null); }}
                        autoFocus
                        className="flex-1 min-w-0 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                      <button onClick={() => handleEdit(habit.id)} className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--success)' }}><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}><X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm truncate" style={{ color: 'var(--text-primary)' }} title={habit.name}>
                        {habit.name}
                      </span>
                      <span className="text-xs font-semibold shrink-0 tabular-nums px-1.5 py-0.5 rounded-full"
                        style={{ background: done > 0 ? 'var(--accent-soft)' : 'transparent', color: done > 0 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                        {done}/7
                      </span>
                      <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => { setEditingId(habit.id); setEditName(habit.name); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        ><Pencil size={13} /></button>
                        <button onClick={() => handleRemove(habit.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ color: 'var(--text-secondary)' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                        ><Trash2 size={13} /></button>
                      </div>
                    </>
                  )}
                </div>

                {/* Day cells */}
                {weekDays.map((d, dayIdx) => {
                  const checked = isChecked(habit.id, dayIdx);
                  const dayDate = toKey(d);
                  const isPast = dayDate < todayKey;
                  return (
                    <div key={dayIdx} className="flex items-center justify-center py-3">
                      <button
                        onClick={() => handleToggle(habit.id, dayIdx)}
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                        style={{
                          background: checked ? 'var(--accent)' : 'transparent',
                          borderColor: checked ? 'var(--accent)' : isPast ? 'var(--border)' : 'var(--border)',
                          opacity: !checked && isPast ? 0.4 : 1,
                        }}
                        title={checked ? 'Desmarcar' : 'Marcar como feito'}
                      >
                        {checked && <Check size={14} color="white" strokeWidth={3} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Footer summary */}
          <div className="px-5 py-3 flex items-center justify-between border-t border-[var(--border-soft)]"
            style={{ background: 'var(--bg-subtle)' }}>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Total da semana
            </span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--accent)' }}>
              {Object.values(checks).reduce((s, days) => s + (days?.length || 0), 0)} / {habits.length * 7} marcações
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

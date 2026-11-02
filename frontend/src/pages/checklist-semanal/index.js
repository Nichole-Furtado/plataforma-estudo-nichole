import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Trash2, Pencil, Check, X, CheckSquare,
  ChevronLeft, ChevronRight, CalendarDays,
} from 'lucide-react';
import { fetchHabits, addHabit, updateHabit, removeHabit, fetchWeek, toggleDay } from '@/lib/api';

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DAY_INITIALS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; // Seg..Dom

const pad = (n) => String(n).padStart(2, '0');

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Os dados ficam guardados por semana no backend (segunda-feira como chave).
 * Esta tela mostra o mês inteiro, então cada dia do mês é traduzido para a
 * semana a que pertence + o índice do dia (0=Seg … 6=Dom). Assim a grade
 * mensal e a visão semanal leem e escrevem exatamente os mesmos dados.
 */
function dayRef(year, month, day) {
  const d = new Date(year, month - 1, day);
  const dow = d.getDay();                  // 0=Dom
  const dayIdx = dow === 0 ? 6 : dow - 1;  // 0=Seg … 6=Dom
  const monday = new Date(d);
  monday.setDate(d.getDate() - dayIdx);
  const weekKey = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
  return { weekKey, dayIdx, weekday: dayIdx };
}

// ── Month Picker (mesmo da Planilha Financeira) ────────────────────────────────

function MonthPicker({ month, year, onChange }) {
  const [open, setOpen] = useState(false);
  const [pickYear, setPickYear] = useState(year);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    setPickYear(year);
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, year]);

  const select = (m) => {
    onChange(m, pickYear);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1 card-surface rounded-xl px-1.5 py-1.5">
        <button
          onClick={() => { const d = new Date(year, month - 2, 1); onChange(d.getMonth() + 1, d.getFullYear()); }}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1.5 font-semibold text-sm min-w-[160px] justify-center px-2 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-all duration-200"
        >
          <CalendarDays size={14} className="text-[var(--accent)]" />
          {MONTH_NAMES[month - 1]} {year}
        </button>
        <button
          onClick={() => { const d = new Date(year, month, 1); onChange(d.getMonth() + 1, d.getFullYear()); }}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200"
          aria-label="Próximo mês"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 card-surface rounded-xl shadow-lg border border-[var(--border)] p-3"
          style={{ minWidth: 220 }}
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              onClick={() => setPickYear(y => y - 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="font-semibold text-sm tabular-nums">{pickYear}</span>
            <button
              onClick={() => setPickYear(y => y + 1)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {MONTH_SHORT.map((name, i) => {
              const m = i + 1;
              const active = m === month && pickYear === year;
              return (
                <button
                  key={m}
                  onClick={() => select(m)}
                  className="py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                  style={{
                    background: active ? 'var(--accent)' : 'transparent',
                    color: active ? 'white' : 'var(--text-secondary)',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function ChecklistPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [habits, setHabits] = useState([]);
  const [weeks, setWeeks] = useState({});   // { weekKey: { habitId: [0..6] } }
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const todayDay = now.getDate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Um mês cobre 5 ou 6 semanas — busca cada uma delas uma única vez.
      const keys = [...new Set(
        Array.from({ length: getDaysInMonth(year, month) }, (_, i) => dayRef(year, month, i + 1).weekKey)
      )];
      const [h, ...weekData] = await Promise.all([
        fetchHabits(),
        ...keys.map((k) => fetchWeek(k).catch(() => ({}))),
      ]);
      setHabits(h);
      setWeeks(Object.fromEntries(keys.map((k, i) => [k, weekData[i] || {}])));
    } catch (err) {
      console.error('Erro ao carregar checklist:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

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

  const handleRemove = async (id, name) => {
    if (!confirm(`Remover o hábito "${name}"? As marcações dele serão perdidas.`)) return;
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

  const handleToggle = async (habitId, day) => {
    const { weekKey, dayIdx } = dayRef(year, month, day);
    try {
      const res = await toggleDay(weekKey, habitId, dayIdx);
      setWeeks((prev) => ({ ...prev, [weekKey]: res.week }));
    } catch (err) { alert(err.message); }
  };

  const isChecked = (habitId, day) => {
    const { weekKey, dayIdx } = dayRef(year, month, day);
    const list = weeks[weekKey]?.[habitId];
    return Array.isArray(list) && list.includes(dayIdx);
  };

  // Conta só os dias deste mês — a semana guardada pode invadir o mês vizinho.
  const habitStats = (habitId) => {
    const checked = days.filter((d) => isChecked(habitId, d)).length;
    return { checked, total: daysInMonth, percent: Math.round((checked / daysInMonth) * 100) };
  };

  const totalChecks = habits.reduce((s, h) => s + habitStats(h.id).checked, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <CheckSquare size={20} strokeWidth={2.2} />
            </span>
            Checklist Mensal
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            Marque seus hábitos dia a dia — {daysInMonth} dias em {MONTH_NAMES[month - 1]} ·{' '}
            {habits.length} hábito{habits.length !== 1 ? 's' : ''}
          </p>
        </div>
        <MonthPicker
          month={month}
          year={year}
          onChange={(m, y) => { setMonth(m); setYear(y); }}
        />
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
        />
        <button onClick={handleAdd} disabled={!newName.trim() || adding}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
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
        <div className="card-surface rounded-2xl p-12 text-center">
          <CheckSquare size={36} className="mx-auto mb-4 opacity-30" style={{ color: 'var(--text-secondary)' }} />
          <h2 className="text-xl font-semibold mb-2">Nenhum hábito cadastrado</h2>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
            Adicione um hábito acima para começar a marcar os dias.
          </p>
        </div>
      ) : (
        <div className="card-surface rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="sticky left-0 z-20 bg-[var(--bg-card)] text-left px-3 py-3 font-semibold text-[var(--text-secondary)] min-w-[150px]">
                    Hábito
                  </th>
                  {days.map((day) => {
                    const { weekday } = dayRef(year, month, day);
                    const isToday = isCurrentMonth && day === todayDay;
                    const isWeekend = weekday >= 5;
                    return (
                      <th
                        key={day}
                        className={`px-0 py-2 text-center font-medium w-[30px] ${
                          isToday ? 'bg-[var(--accent)]/10' : ''
                        }`}
                      >
                        <span className="block text-[10px] leading-tight"
                          style={{ color: isToday ? 'var(--accent)' : isWeekend ? 'var(--error)' : 'var(--text-secondary)' }}>
                          {DAY_INITIALS[weekday]}
                        </span>
                        <span className="block text-xs tabular-nums"
                          style={{ color: isToday ? 'var(--accent)' : 'var(--text-secondary)' }}>
                          {pad(day)}
                        </span>
                      </th>
                    );
                  })}
                  <th className="sticky right-0 z-20 bg-[var(--bg-card)] px-3 py-3 text-center font-semibold text-[var(--text-secondary)] min-w-[78px] border-l border-[var(--border)]">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {habits.map((habit, hi) => {
                  const stats = habitStats(habit.id);
                  const isEditing = editingId === habit.id;
                  return (
                    <tr
                      key={habit.id}
                      className={`group border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-hover)]/40 transition-colors ${
                        hi % 2 === 1 ? 'bg-[var(--bg-subtle)]/40' : ''
                      }`}
                    >
                      <td className="sticky left-0 z-10 bg-[var(--bg-card)] px-3 py-2.5 font-medium min-w-[150px]">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text" value={editName} onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleEdit(habit.id); if (e.key === 'Escape') setEditingId(null); }}
                              autoFocus
                              className="flex-1 min-w-0 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                            />
                            <button onClick={() => handleEdit(habit.id)} className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--success)' }}><Check size={14} /></button>
                            <button onClick={() => setEditingId(null)} className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}><X size={14} /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full shrink-0 bg-[var(--accent)]" />
                            <span className="truncate max-w-[140px]" title={habit.name}>{habit.name}</span>
                            <div className="flex items-center gap-0.5 ml-auto sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => { setEditingId(habit.id); setEditName(habit.name); }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] transition-colors"
                                title="Renomear"><Pencil size={13} /></button>
                              <button onClick={() => handleRemove(habit.id, habit.name)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--bg-hover)] transition-colors"
                                title="Remover"><Trash2 size={13} /></button>
                            </div>
                          </div>
                        )}
                      </td>

                      {days.map((day) => {
                        const checked = isChecked(habit.id, day);
                        const isToday = isCurrentMonth && day === todayDay;
                        const isFuture = isCurrentMonth && day > todayDay;
                        return (
                          <td key={day} className={`px-0 py-2.5 text-center ${isToday ? 'bg-[var(--accent)]/5' : ''}`}>
                            <button
                              onClick={() => handleToggle(habit.id, day)}
                              className={`w-7 h-7 rounded-md border transition-all duration-150 flex items-center justify-center mx-auto ${
                                checked
                                  ? 'bg-[var(--success)] border-[var(--success)] text-white shadow-sm shadow-[var(--success)]/30'
                                  : 'border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--bg-hover)]'
                              }`}
                              style={{ opacity: !checked && isFuture ? 0.45 : 1 }}
                              title={`${habit.name} — dia ${day}`}
                            >
                              {checked && <Check size={14} strokeWidth={3} />}
                            </button>
                          </td>
                        );
                      })}

                      <td className="sticky right-0 z-10 bg-[var(--bg-card)] px-3 py-2.5 text-center border-l border-[var(--border)]">
                        <div className="flex flex-col items-center">
                          <span className={`font-bold text-sm ${
                            stats.percent >= 80 ? 'text-[var(--success)]'
                              : stats.percent >= 50 ? 'text-[var(--warning)]'
                              : 'text-[var(--error)]'
                          }`}>
                            {stats.percent}%
                          </span>
                          <span className="text-xs text-[var(--text-secondary)] tabular-nums">
                            {stats.checked}/{stats.total}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Resumo */}
          <div className="border-t border-[var(--border)] px-4 py-3 flex flex-wrap items-center gap-6"
            style={{ background: 'var(--bg-subtle)' }}>
            <span className="text-sm text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">{habits.length}</strong> hábito{habits.length !== 1 ? 's' : ''}
            </span>
            <span className="text-sm text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">{daysInMonth}</strong> dias no mês
            </span>
            <span className="text-sm text-[var(--text-secondary)]">
              <strong className="text-[var(--success)]">{totalChecks}</strong> de {habits.length * daysInMonth} marcações
            </span>
            {isCurrentMonth && (
              <span className="text-sm font-medium text-[var(--accent)]">Hoje: dia {todayDay}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

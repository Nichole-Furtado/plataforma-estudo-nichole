import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Trash2, Pencil, Check, X, CheckSquare,
  ChevronLeft, ChevronRight, CalendarDays, TrendingUp, TrendingDown, Scale, Clock,
} from 'lucide-react';
import {
  fetchHabits, addHabit, updateHabit, removeHabit,
  fetchWeek, setDayState, fetchChecklistSummary,
  fetchRoutine, addRoutineActivity, removeRoutineActivity, setRoutineHours,
} from '@/lib/api';

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DAY_INITIALS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; // Seg..Dom
const HORIZONS = [3, 6, 12];

const pad = (n) => String(n).padStart(2, '0');

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

const labelMonth = (yearMonth) => {
  const [y, m] = String(yearMonth).split('-').map(Number);
  if (!y || !m) return '';
  return `${MONTH_SHORT[m - 1]}/${String(y).slice(2)}`;
};

/**
 * Os dados ficam guardados por semana no backend (segunda-feira como chave).
 * Cada dia do mês é traduzido para a semana a que pertence + o índice do dia
 * (0=Seg … 6=Dom), então a grade mensal lê e escreve os mesmos dados.
 */
function dayRef(year, month, day) {
  const d = new Date(year, month - 1, day);
  const dow = d.getDay();
  const dayIdx = dow === 0 ? 6 : dow - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - dayIdx);
  return {
    weekKey: `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`,
    dayIdx,
  };
}

const normalizeEntry = (entry) => {
  if (Array.isArray(entry)) return { done: entry, miss: [] };
  return { done: entry?.done || [], miss: entry?.miss || [] };
};

/**
 * Pontuação de uma marcação (igual à do servidor):
 *   hábito bom  → feito soma, não feito tira
 *   hábito ruim → feito tira, não feito soma
 * "Erro" é toda marcação que tira pontos.
 */
function scoreFor(habit, st) {
  if (st === 'none') return 0;
  const good = habit.type !== 'ruim';
  const positive = good ? st === 'done' : st === 'miss';
  return positive ? habit.points : -habit.points;
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

  const select = (m) => { onChange(m, pickYear); setOpen(false); };

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
        <div className="absolute right-0 top-full mt-2 z-50 card-surface rounded-xl shadow-lg border border-[var(--border)] p-3" style={{ minWidth: 220 }}>
          <div className="flex items-center justify-between mb-3 px-1">
            <button onClick={() => setPickYear(y => y - 1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"><ChevronLeft size={15} /></button>
            <span className="font-semibold text-sm tabular-nums">{pickYear}</span>
            <button onClick={() => setPickYear(y => y + 1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"><ChevronRight size={15} /></button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {MONTH_SHORT.map((name, i) => {
              const m = i + 1;
              const active = m === month && pickYear === year;
              return (
                <button key={m} onClick={() => select(m)}
                  className="py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                  style={{ background: active ? 'var(--accent)' : 'transparent', color: active ? 'white' : 'var(--text-secondary)' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >{name}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Seletor de tipo (boa / ruim) ───────────────────────────────────────────────

function TypeToggle({ value, onChange, size = 'md' }) {
  const opts = [
    { key: 'boa', label: 'Boa', color: 'var(--success)' },
    { key: 'ruim', label: 'Ruim', color: 'var(--error)' },
  ];
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1.5 text-xs';
  return (
    <div className="flex items-center gap-1 shrink-0">
      {opts.map((o) => {
        const active = value === o.key;
        return (
          <button key={o.key} type="button" onClick={() => onChange(o.key)}
            className={`${pad} rounded-lg font-semibold transition-all`}
            style={{
              background: active ? o.color : 'var(--bg-subtle)',
              color: active ? 'white' : 'var(--text-secondary)',
            }}
          >{o.label}</button>
        );
      })}
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function ChecklistPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [habits, setHabits] = useState([]);
  const [weeks, setWeeks] = useState({});
  const [loading, setLoading] = useState(true);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('boa');
  const [newPoints, setNewPoints] = useState('1');
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('boa');
  const [editPoints, setEditPoints] = useState('1');

  const [horizon, setHorizon] = useState(6);
  const [summary, setSummary] = useState([]);
  const [summaryError, setSummaryError] = useState(null);

  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const yearMonth = `${year}-${pad(month)}`;

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const todayDay = now.getDate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
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

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetchChecklistSummary(yearMonth, horizon);
      setSummary(res.months || []);
      setSummaryError(null);
    } catch (err) {
      setSummary([]);
      setSummaryError(err.message || 'Não foi possível carregar os pontos por mês.');
    }
  }, [yearMonth, horizon]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const stateOf = (habitId, day) => {
    const { weekKey, dayIdx } = dayRef(year, month, day);
    const e = normalizeEntry(weeks[weekKey]?.[habitId]);
    if (e.done.includes(dayIdx)) return 'done';
    if (e.miss.includes(dayIdx)) return 'miss';
    return 'none';
  };

  // Clicar percorre: vazio → feito → não feito → vazio
  const nextState = (st) => (st === 'none' ? 'done' : st === 'done' ? 'miss' : 'none');

  const handleCycle = async (habitId, day) => {
    const { weekKey, dayIdx } = dayRef(year, month, day);
    const target = nextState(stateOf(habitId, day));
    try {
      const res = await setDayState(weekKey, habitId, dayIdx, target);
      setWeeks((prev) => ({ ...prev, [weekKey]: res.week }));
      loadSummary();
    } catch (err) { alert(err.message); }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await addHabit(newName.trim(), newType, parseInt(newPoints, 10) || 1);
      setHabits(res.habits);
      setNewName(''); setNewType('boa'); setNewPoints('1');
      loadSummary();
    } catch (err) { alert(err.message); }
    finally { setAdding(false); }
  };

  const startEdit = (habit) => {
    setEditingId(habit.id);
    setEditName(habit.name);
    setEditType(habit.type || 'boa');
    setEditPoints(String(habit.points ?? 1));
  };

  const handleEdit = async (id) => {
    if (!editName.trim()) return;
    try {
      const res = await updateHabit(id, {
        name: editName.trim(),
        type: editType,
        points: parseInt(editPoints, 10) || 1,
      });
      setHabits(res.habits);
      setEditingId(null);
      loadSummary();
    } catch (err) { alert(err.message); }
  };

  const handleRemove = async (id, name) => {
    if (!confirm(`Remover o hábito "${name}"? As marcações dele serão perdidas.`)) return;
    try {
      const res = await removeHabit(id);
      setHabits(res.habits);
      loadSummary();
    } catch (err) { alert(err.message); }
  };

  // Estatísticas do mês visível, calculadas na tela para responder na hora.
  const habitStats = (habit) => {
    let points = 0, done = 0, miss = 0, errors = 0, acertos = 0;
    for (const d of days) {
      const st = stateOf(habit.id, d);
      if (st === 'none') continue;
      if (st === 'done') done++; else miss++;
      const s = scoreFor(habit, st);
      points += s;
      if (s < 0) errors++; else acertos++;
    }
    return { points, done, miss, errors, acertos, max: habit.points * daysInMonth };
  };

  const monthTotals = habits.reduce((acc, h) => {
    const s = habitStats(h);
    acc.points += s.points; acc.done += s.done; acc.miss += s.miss;
    acc.errors += s.errors; acc.acertos += s.acertos; acc.max += s.max;
    return acc;
  }, { points: 0, done: 0, miss: 0, errors: 0, acertos: 0, max: 0 });

  const maxAbsPoints = summary.reduce((m, s) => Math.max(m, Math.abs(s.points)), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <CheckSquare size={20} strokeWidth={2.2} />
            </span>
            Checklist Mensal
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            Clique num dia para alternar: vazio → feito → não feito. {daysInMonth} dias em{' '}
            {MONTH_NAMES[month - 1]} · {habits.length} hábito{habits.length !== 1 ? 's' : ''}
          </p>
        </div>
        <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>

      {/* Resumo do mês */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card-surface hover-lift rounded-xl p-5 relative overflow-hidden">
          <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: monthTotals.points >= 0 ? 'var(--success)' : 'var(--error)' }} />
          <div className="flex items-center gap-4">
            <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}>
              <Scale size={20} strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-0.5">Pontos do mês</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: monthTotals.points >= 0 ? 'var(--success)' : 'var(--error)' }}>
                {monthTotals.points}
              </p>
            </div>
          </div>
        </div>
        <div className="card-surface hover-lift rounded-xl p-5 relative overflow-hidden">
          <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: 'var(--success)' }} />
          <div className="flex items-center gap-4">
            <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'color-mix(in srgb, var(--success) 14%, transparent)', color: 'var(--success)' }}>
              <TrendingUp size={20} strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-0.5">Acertos</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--success)' }}>
                {monthTotals.acertos}
              </p>
            </div>
          </div>
        </div>
        <div className="card-surface hover-lift rounded-xl p-5 relative overflow-hidden">
          <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: 'var(--error)' }} />
          <div className="flex items-center gap-4">
            <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'color-mix(in srgb, var(--error) 14%, transparent)', color: 'var(--error)' }}>
              <TrendingDown size={20} strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-0.5">Erros</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--error)' }}>{monthTotals.errors}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pontos por mês */}
      <div className="card-surface rounded-xl overflow-hidden mb-6">
        <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-soft)]">
          <h2 className="flex items-center gap-2.5 text-base font-semibold">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}>
              <CalendarDays size={16} strokeWidth={2.2} />
            </span>
            Pontos por mês
          </h2>
          <div className="flex items-center gap-1">
            {HORIZONS.map((h) => (
              <button key={h} onClick={() => setHorizon(h)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                style={h === horizon
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
              >{h} meses</button>
            ))}
          </div>
        </div>

        {summaryError ? (
          <p className="px-5 py-6 text-sm" style={{ color: 'var(--text-secondary)' }}>{summaryError}</p>
        ) : summary.length === 0 ? (
          <p className="px-5 py-6 text-sm" style={{ color: 'var(--text-secondary)' }}>Sem dados ainda.</p>
        ) : (
          <div className="px-2 pb-3">
            <div className="flex items-center gap-2 px-3 pb-1.5 text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
              <span className="w-14 shrink-0">Mês</span>
              <span className="flex-1 hidden md:block" />
              <span className="w-[76px] shrink-0 text-right hidden sm:block" style={{ color: 'var(--success)' }}>Acertos</span>
              <span className="w-[76px] shrink-0 text-right" style={{ color: 'var(--error)' }}>Erros</span>
              <span className="w-[84px] shrink-0 text-right font-semibold">Pontos</span>
            </div>
            <ul>
              {summary.map((s) => {
                const current = s.yearMonth === yearMonth;
                const acertos = s.marks - s.errors;
                return (
                  <li key={s.yearMonth}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]/50 ${current ? 'bg-[var(--accent-soft)]/40' : ''}`}>
                    <span className="w-14 shrink-0 text-xs font-semibold tabular-nums"
                      style={{ color: current ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      {labelMonth(s.yearMonth)}
                    </span>
                    <div className="flex-1 hidden md:block h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: maxAbsPoints > 0 ? `${(Math.abs(s.points) / maxAbsPoints) * 100}%` : '0%',
                          background: s.points >= 0 ? 'var(--success)' : 'var(--error)',
                        }} />
                    </div>
                    <span className="w-[76px] shrink-0 text-right text-xs tabular-nums hidden sm:block text-[var(--text-secondary)]">
                      {acertos}
                    </span>
                    <span className="w-[76px] shrink-0 text-right text-xs tabular-nums" style={{ color: s.errors > 0 ? 'var(--error)' : 'var(--text-secondary)' }}>
                      {s.errors}
                    </span>
                    <span className="w-[84px] shrink-0 text-right text-sm font-bold tabular-nums"
                      style={{ color: s.points >= 0 ? 'var(--success)' : 'var(--error)' }}>
                      {s.points}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Adicionar hábito */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6 p-4 rounded-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <input
          type="text" value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Adicionar hábito (ex: Beber 2L de água)..."
          className="flex-1 bg-transparent text-sm outline-none px-1"
          style={{ color: 'var(--text-primary)' }}
        />
        <div className="flex items-center gap-2">
          <TypeToggle value={newType} onChange={setNewType} />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pontos:</span>
            <input type="number" min="0" max="999" value={newPoints}
              onChange={e => setNewPoints(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="w-16 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm text-center tabular-nums focus:outline-none focus:border-[var(--accent)] transition-all"
            />
          </div>
          <button onClick={handleAdd} disabled={!newName.trim() || adding}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ background: 'var(--accent)' }}>
            {adding
              ? <span className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
              : <Plus size={16} strokeWidth={2.4} />}
            Adicionar
          </button>
        </div>
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
                  <th className="sticky left-0 z-20 bg-[var(--bg-card)] text-left px-3 py-3 font-semibold text-[var(--text-secondary)] min-w-[215px]">
                    Hábito
                  </th>
                  {days.map((day) => {
                    const { dayIdx } = dayRef(year, month, day);
                    const isToday = isCurrentMonth && day === todayDay;
                    const isWeekend = dayIdx >= 5;
                    return (
                      <th key={day}
                        className={`px-0 py-2 text-center font-medium w-[30px] ${isToday ? 'bg-[var(--accent)]/10' : ''}`}>
                        <span className="block text-[10px] leading-tight"
                          style={{ color: isToday ? 'var(--accent)' : isWeekend ? 'var(--error)' : 'var(--text-secondary)' }}>
                          {DAY_INITIALS[dayIdx]}
                        </span>
                        <span className="block text-xs tabular-nums"
                          style={{ color: isToday ? 'var(--accent)' : 'var(--text-secondary)' }}>
                          {pad(day)}
                        </span>
                      </th>
                    );
                  })}
                  <th className="sticky right-0 z-20 bg-[var(--bg-card)] px-3 py-3 text-center font-semibold text-[var(--text-secondary)] min-w-[86px] border-l border-[var(--border)]">
                    Pontos
                  </th>
                </tr>
              </thead>
              <tbody>
                {habits.map((habit, hi) => {
                  const stats = habitStats(habit);
                  const isEditing = editingId === habit.id;
                  const bad = habit.type === 'ruim';
                  return (
                    <tr key={habit.id}
                      className={`group border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-hover)]/40 transition-colors ${hi % 2 === 1 ? 'bg-[var(--bg-subtle)]/40' : ''}`}>
                      <td className="sticky left-0 z-10 bg-[var(--bg-card)] px-3 py-2.5 font-medium min-w-[215px]">
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleEdit(habit.id); if (e.key === 'Escape') setEditingId(null); }}
                                autoFocus
                                className="flex-1 min-w-0 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-[var(--accent)] transition-all"
                              />
                              <button onClick={() => handleEdit(habit.id)} className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--success)' }}><Check size={14} /></button>
                              <button onClick={() => setEditingId(null)} className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ color: 'var(--text-secondary)' }}><X size={14} /></button>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <TypeToggle value={editType} onChange={setEditType} size="sm" />
                              <input type="number" min="0" max="999" value={editPoints}
                                onChange={e => setEditPoints(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleEdit(habit.id); }}
                                className="w-14 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-1 py-0.5 text-[11px] text-center tabular-nums focus:outline-none focus:border-[var(--accent)]"
                              />
                              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>pts</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                              style={{
                                background: bad ? 'color-mix(in srgb, var(--error) 14%, transparent)' : 'color-mix(in srgb, var(--success) 14%, transparent)',
                                color: bad ? 'var(--error)' : 'var(--success)',
                              }}
                              title={bad ? 'Hábito ruim: fazer tira pontos' : 'Hábito bom: fazer soma pontos'}>
                              {bad ? 'RUIM' : 'BOA'}
                            </span>
                            <span className="truncate max-w-[150px]" title={habit.name}>{habit.name}</span>
                            <span className="text-[11px] tabular-nums shrink-0" style={{ color: 'var(--text-secondary)' }}>
                              {habit.points}pt
                            </span>
                            <div className="flex items-center gap-0.5 ml-auto sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => startEdit(habit)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] transition-colors"
                                title="Editar nome, tipo e pontos"><Pencil size={13} /></button>
                              <button onClick={() => handleRemove(habit.id, habit.name)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--bg-hover)] transition-colors"
                                title="Remover"><Trash2 size={13} /></button>
                            </div>
                          </div>
                        )}
                      </td>

                      {days.map((day) => {
                        const st = stateOf(habit.id, day);
                        const isToday = isCurrentMonth && day === todayDay;
                        const isFuture = isCurrentMonth && day > todayDay;
                        const done = st === 'done';
                        const miss = st === 'miss';
                        return (
                          <td key={day} className={`px-0 py-2.5 text-center ${isToday ? 'bg-[var(--accent)]/5' : ''}`}>
                            <button
                              onClick={() => handleCycle(habit.id, day)}
                              className="w-7 h-7 rounded-md border transition-all duration-150 flex items-center justify-center mx-auto"
                              style={{
                                background: done ? 'var(--success)' : miss ? 'var(--error)' : 'transparent',
                                borderColor: done ? 'var(--success)' : miss ? 'var(--error)' : 'var(--border)',
                                color: 'white',
                                opacity: st === 'none' && isFuture ? 0.45 : 1,
                              }}
                              title={`${habit.name} — dia ${day}: ${done ? 'feito' : miss ? 'não feito' : 'sem marcação'}`}
                            >
                              {done && <Check size={14} strokeWidth={3} />}
                              {miss && <X size={14} strokeWidth={3} />}
                            </button>
                          </td>
                        );
                      })}

                      <td className="sticky right-0 z-10 bg-[var(--bg-card)] px-3 py-2.5 text-center border-l border-[var(--border)]">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-sm tabular-nums"
                            style={{ color: stats.points >= 0 ? 'var(--success)' : 'var(--error)' }}>
                            {stats.points}
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary)] tabular-nums">
                            {stats.errors > 0 ? `${stats.errors} erro${stats.errors > 1 ? 's' : ''}` : 'sem erros'}
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
              <strong className="text-[var(--success)]">{monthTotals.done}</strong> feitos ·{' '}
              <strong className="text-[var(--error)]">{monthTotals.miss}</strong> não feitos
            </span>
            <span className="text-sm text-[var(--text-secondary)]">
              Máximo possível: <strong className="text-[var(--text-primary)]">{monthTotals.max}</strong> pontos
            </span>
            {isCurrentMonth && (
              <span className="text-sm font-medium text-[var(--accent)]">Hoje: dia {todayDay}</span>
            )}
          </div>
        </div>
      )}

      {/* Rotina do dia — como as 24 horas foram divididas */}
      <RoutineSection year={year} month={month} daysInMonth={daysInMonth} />
    </div>
  );
}

// ── Rotina do dia (24 horas) ──────────────────────────────────────────────────

// Paleta categórica em ordem fixa (validada para fundo claro). A partir do
// nono item a cor vira cinza — repetir um tom faria duas atividades diferentes
// parecerem a mesma no gráfico.
const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const colorFor = (i) => SERIES[i] || 'var(--text-secondary)';

const fmtH = (h) => {
  if (!h) return '0h';
  const whole = Math.floor(h);
  const half = h - whole >= 0.5;
  if (whole === 0) return '30min';
  return `${whole}h${half ? '30' : ''}`;
};

function DayBar({ segments, scaleTo }) {
  const used = segments.reduce((s, x) => s + x.hours, 0);
  const free = Math.max(0, 24 - used);
  const total = Math.max(scaleTo || 24, used);
  const parts = [
    ...segments.filter((s) => s.hours > 0),
    ...(free > 0 ? [{ id: '__free', name: 'Livre', hours: free, color: 'var(--bg-secondary)' }] : []),
  ];

  if (parts.length === 0) {
    return (
      <div className="h-7 rounded-md" style={{ background: 'var(--bg-secondary)' }} />
    );
  }

  return (
    <div className="flex gap-[2px] h-7 rounded-md overflow-hidden">
      {parts.map((s) => (
        <div
          key={s.id}
          title={`${s.name}: ${fmtH(s.hours)}`}
          style={{ width: `${(s.hours / total) * 100}%`, background: s.color }}
          className="h-full"
        />
      ))}
    </div>
  );
}

function Legend({ segments, free }) {
  const items = [
    ...segments.filter((s) => s.hours > 0),
    ...(free > 0 ? [{ id: '__free', name: 'Livre', hours: free, color: 'var(--bg-secondary)' }] : []),
  ];
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5">
      {items.map((s) => (
        <span key={s.id} className="flex items-center gap-1.5 text-xs">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0"
            style={{ background: s.color, outline: s.id === '__free' ? '1px solid var(--border)' : 'none' }} />
          <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
          <strong className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{fmtH(s.hours)}</strong>
        </span>
      ))}
    </div>
  );
}

function RoutineSection({ year, month, daysInMonth }) {
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const monthKey = `${year}-${pad(month)}`;

  const [day, setDay] = useState(isCurrentMonth ? today.getDate() : 1);
  const [activities, setActivities] = useState([]);
  const [days, setDays] = useState({});
  const [average, setAverage] = useState({});
  const [filledDays, setFilledDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  // Ao trocar de mês, volta para hoje (se for o mês atual) ou para o dia 1.
  useEffect(() => {
    const d = new Date();
    const current = year === d.getFullYear() && month === d.getMonth() + 1;
    setDay(current ? d.getDate() : 1);
  }, [year, month]);

  const refresh = useCallback(async (showSpinner) => {
    if (showSpinner) setLoading(true);
    try {
      const r = await fetchRoutine(monthKey);
      setActivities(r.activities || []);
      setDays(r.days || {});
      setAverage(r.average || {});
      setFilledDays(r.filledDays || 0);
      setError(null);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar a rotina.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => { refresh(true); }, [refresh]);

  const dateKey = `${monthKey}-${pad(day)}`;
  const dayHours = days[String(day)] || {};

  const segments = activities.map((a, i) => ({
    id: a.id,
    name: a.name,
    hours: Number(dayHours[a.id] || 0),
    color: colorFor(i),
  }));
  const used = segments.reduce((s, x) => s + x.hours, 0);
  const free = Math.max(0, 24 - used);
  const over = used > 24;

  const avgSegments = activities.map((a, i) => ({
    id: a.id,
    name: a.name,
    hours: Number(average[a.id] || 0),
    color: colorFor(i),
  }));
  const avgUsed = avgSegments.reduce((s, x) => s + x.hours, 0);

  const handleHours = async (activityId, value) => {
    const hours = value === '' ? 0 : Number(value);
    try {
      const res = await setRoutineHours(dateKey, activityId, hours);
      setDays((prev) => ({ ...prev, [String(day)]: res.day }));
      refresh(false);
    } catch (err) { alert(err.message); }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await addRoutineActivity(newName.trim());
      setActivities(res.activities);
      setNewName('');
    } catch (err) { alert(err.message); }
    finally { setAdding(false); }
  };

  const handleRemove = async (id, name) => {
    if (!confirm(`Remover "${name}"? As horas lançadas em todos os dias serão perdidas.`)) return;
    try {
      await removeRoutineActivity(id);
      refresh(false);
    } catch (err) { alert(err.message); }
  };

  const weekdayLabel = new Date(year, month - 1, day)
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '');

  return (
    <div className="card-surface rounded-2xl overflow-hidden mt-6">
      <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-soft)]">
        <div>
          <h2 className="flex items-center gap-2.5 text-base font-semibold">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}>
              <Clock size={16} strokeWidth={2.2} />
            </span>
            Rotina do dia
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Quantas das 24 horas foram para cada atividade.
          </p>
        </div>

        {/* Navegação de dia dentro do mês */}
        <div className="flex items-center gap-1 rounded-xl px-1.5 py-1.5" style={{ background: 'var(--bg-subtle)' }}>
          <button onClick={() => setDay((d) => Math.max(1, d - 1))} disabled={day <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-30"
            aria-label="Dia anterior"><ChevronLeft size={16} /></button>
          <span className="font-semibold text-sm min-w-[104px] text-center tabular-nums">
            {pad(day)}/{pad(month)} · {weekdayLabel}
          </span>
          <button onClick={() => setDay((d) => Math.min(daysInMonth, d + 1))} disabled={day >= daysInMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all disabled:opacity-30"
            aria-label="Próximo dia"><ChevronRight size={16} /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : error ? (
        <p className="px-5 py-6 text-sm" style={{ color: 'var(--text-secondary)' }}>{error}</p>
      ) : (
        <>
          {/* Gráfico do dia */}
          <div className="px-5 pt-4 pb-5 border-b border-[var(--border-soft)]">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Dia {pad(day)}
              </span>
              <span className="text-xs tabular-nums" style={{ color: over ? 'var(--error)' : 'var(--text-secondary)' }}>
                {fmtH(used)} de 24h {over ? '· passou de 24h' : free > 0 ? `· ${fmtH(free)} livres` : '· dia completo'}
              </span>
            </div>
            <DayBar segments={segments} />
            <Legend segments={segments} free={free} />
          </div>

          {/* Horas por atividade */}
          {activities.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Clock size={26} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Nenhuma atividade ainda. Adicione abaixo (ex: Trabalho, Sono, Academia).
              </p>
            </div>
          ) : (
            <ul className="px-2 py-2">
              {activities.map((a, i) => (
                <li key={a.id} className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-hover)]/50 transition-colors">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: colorFor(i) }} />
                  <span className="flex-1 text-sm truncate" title={a.name}>{a.name}</span>
                  <input
                    type="number" min="0" max="24" step="0.5"
                    value={dayHours[a.id] ?? ''}
                    onChange={(e) => handleHours(a.id, e.target.value)}
                    placeholder="0"
                    className="w-20 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-2 py-1 text-sm text-center tabular-nums focus:outline-none focus:border-[var(--accent)] transition-all"
                  />
                  <span className="text-xs w-5" style={{ color: 'var(--text-secondary)' }}>h</span>
                  <button onClick={() => handleRemove(a.id, a.name)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--bg-hover)] transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                    title="Remover atividade"><Trash2 size={13} /></button>
                </li>
              ))}
            </ul>
          )}

          {/* Adicionar atividade */}
          <div className="px-5 py-3 flex gap-2 border-t border-[var(--border-soft)]">
            <input
              type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Nova atividade (ex: Trabalho, Sono, Academia)..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
            <button onClick={handleAdd} disabled={!newName.trim() || adding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              style={{ background: 'var(--accent)' }}>
              <Plus size={15} strokeWidth={2.4} /> Adicionar
            </button>
          </div>

          {/* Média do mês */}
          {filledDays > 0 && (
            <div className="px-5 py-4" style={{ background: 'var(--bg-subtle)' }}>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                  Média do mês
                </span>
                <span className="text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                  {fmtH(Math.round(avgUsed * 2) / 2)} por dia · {filledDays} de {daysInMonth} dias preenchidos
                </span>
              </div>
              <DayBar segments={avgSegments} />
              <Legend segments={avgSegments} free={Math.max(0, 24 - avgUsed)} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

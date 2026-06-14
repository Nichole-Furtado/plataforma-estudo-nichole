import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Scale,
  Plus, Pencil, Trash2, Check, X, Inbox, CreditCard, Pin, CalendarDays,
} from 'lucide-react';
import {
  fetchFinanceiro, addFinanceiroEntry, updateFinanceiroEntry, removeFinanceiroEntry,
  fetchRendasFixas, addRendaFixa, updateRendaFixa, removeRendaFixa,
  fetchGastosFixos, addGastoFixo, updateGastoFixo, removeGastoFixo,
} from '@/lib/api';

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const brl = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

const tint = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

// ── Month Picker ───────────────────────────────────────────────────────────────

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
          {/* Year navigation */}
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
          {/* Month grid */}
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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [fixedIncomes, setFixedIncomes] = useState([]);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, fixed, fixedExp] = await Promise.all([
        fetchFinanceiro(yearMonth),
        fetchRendasFixas(),
        fetchGastosFixos(),
      ]);
      setIncomes(data.incomes || []);
      setExpenses(data.expenses || []);
      setFixedIncomes(fixed || []);
      setFixedExpenses(fixedExp || []);
    } catch (err) {
      console.error('Erro ao carregar financeiro:', err);
    } finally {
      setLoading(false);
    }
  }, [yearMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  const applyData = (data) => {
    setIncomes(data.incomes || []);
    setExpenses(data.expenses || []);
  };

  const handleAdd = async (type, description, value, extras = {}) => {
    try {
      const res = await addFinanceiroEntry(yearMonth, type, description, value, extras);
      applyData(res.data);
    } catch (err) { alert(err.message); }
  };

  const handleUpdate = async (id, patch) => {
    try {
      const res = await updateFinanceiroEntry(yearMonth, id, patch);
      applyData(res.data);
    } catch (err) { alert(err.message); }
  };

  const handleRemove = async (id) => {
    try {
      const res = await removeFinanceiroEntry(yearMonth, id);
      applyData(res.data);
    } catch (err) { alert(err.message); }
  };

  const totalFixed = fixedIncomes.filter(e => e.active !== false).reduce((s, e) => s + (e.value || 0), 0);
  const totalFixedExp = fixedExpenses.filter(e => e.active !== false).reduce((s, e) => s + (e.value || 0), 0);
  const totalIncome = totalFixed + incomes.filter(e => e.active !== false).reduce((s, e) => s + (e.value || 0), 0);
  const totalExpense = totalFixedExp + expenses.filter(e => e.active !== false).reduce((s, e) => s + (e.value || 0), 0);
  const balance = totalIncome - totalExpense;
  const spentPct = totalIncome > 0 ? Math.min(100, Math.round((totalExpense / totalIncome) * 100)) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Planilha Financeira</h1>
          <p className="text-[var(--text-secondary)] mt-1.5 text-sm">
            Registre suas rendas e gastos do mês e acompanhe o saldo automaticamente.
          </p>
        </div>
        <MonthPicker
          month={month}
          year={year}
          onChange={(m, y) => { setMonth(m); setYear(y); }}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Renda Total" value={brl(totalIncome)} Icon={TrendingUp} color="var(--success)" delay={0} />
        <SummaryCard label="Gastos Totais" value={brl(totalExpense)} Icon={TrendingDown} color="var(--error)" delay={70} />
        <SummaryCard
          label="Saldo"
          value={brl(balance)}
          Icon={Scale}
          color={balance >= 0 ? 'var(--success)' : 'var(--error)'}
          delay={140}
        />
      </div>

      {/* Barra de uso da renda */}
      {totalIncome > 0 && (
        <div className="card-surface rounded-xl px-5 py-4 mb-6 fade-in-up" style={{ animationDelay: '180ms' }}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--text-secondary)]">Gastos sobre a renda</span>
            <span className="font-semibold tabular-nums" style={{
              color: spentPct >= 100 ? 'var(--error)' : spentPct >= 80 ? 'var(--warning)' : 'var(--success)',
            }}>
              {spentPct}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{
              width: `${spentPct}%`,
              background: spentPct >= 100 ? 'var(--error)' : spentPct >= 80 ? 'var(--warning)' : 'var(--success)',
            }} />
          </div>
        </div>
      )}

      {/* Fixos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <FixedSection
          title="Rendas Fixas"
          color="var(--success)"
          items={fixedIncomes}
          total={totalFixed}
          placeholder="Ex: Salário, Freelance mensal, Aluguel recebido..."
          emptyText="Nenhuma renda fixa cadastrada."
          onAdd={async (desc, val) => { const r = await addRendaFixa(desc, val); setFixedIncomes(r.fixed); }}
          onUpdate={async (id, patch) => { const r = await updateRendaFixa(id, patch); setFixedIncomes(r.fixed); }}
          onRemove={async (id) => { const r = await removeRendaFixa(id); setFixedIncomes(r.fixed); }}
          delay={160}
        />
        <FixedSection
          title="Gastos Fixos"
          color="var(--error)"
          items={fixedExpenses}
          total={totalFixedExp}
          placeholder="Ex: Aluguel, Streaming, Plano de saúde..."
          emptyText="Nenhum gasto fixo cadastrado."
          onAdd={async (desc, val) => { const r = await addGastoFixo(desc, val); setFixedExpenses(r.fixedExpenses); }}
          onUpdate={async (id, patch) => { const r = await updateGastoFixo(id, patch); setFixedExpenses(r.fixedExpenses); }}
          onRemove={async (id) => { const r = await removeGastoFixo(id); setFixedExpenses(r.fixedExpenses); }}
          delay={200}
        />
      </div>

      {/* Lançamentos mensais */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-7 h-7 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EntrySection
            title="Rendas"
            Icon={TrendingUp}
            accent="var(--success)"
            type="income"
            entries={incomes}
            total={incomes.filter(e => e.active !== false).reduce((s, e) => s + (e.value || 0), 0)}
            placeholder="Ex: Bônus, Freelance, Poupança..."
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
            delay={220}
          />
          <EntrySection
            title="Gastos"
            Icon={TrendingDown}
            accent="var(--error)"
            type="expense"
            entries={expenses}
            total={expenses.filter(e => e.active !== false).reduce((s, e) => s + (e.value || 0), 0)}
            placeholder="Ex: Mercado, Gasolina, Lazer..."
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
            delay={290}
          />
        </div>
      )}
    </div>
  );
}

// ── Fixed Section (Rendas Fixas / Gastos Fixos) ────────────────────────────────

function FixedSection({ title, color, items, total, placeholder, emptyText, onAdd, onUpdate, onRemove, delay = 0 }) {
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [open, setOpen] = useState(true);

  const submit = async () => {
    if (!desc.trim()) return;
    try { await onAdd(desc.trim(), parseFloat(val) || 0); setDesc(''); setVal(''); }
    catch (err) { alert(err.message); }
  };

  return (
    <div className="card-surface rounded-xl overflow-hidden fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-5 py-4 flex items-center justify-between border-b border-[var(--border-soft)] hover:bg-[var(--bg-hover)]/40 transition-colors"
      >
        <h2 className="text-base font-semibold flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: tint(color, 14), color }}>
            <Pin size={15} strokeWidth={2.2} />
          </span>
          {title}
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            ({items.filter(e => e.active !== false).length}/{items.length}) · todo mês
          </span>
        </h2>
        <div className="flex items-center gap-3">
          <span className="font-bold tabular-nums" style={{ color }}>{brl(total)}</span>
          <ChevronRight size={16} style={{
            color: 'var(--text-secondary)',
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s',
          }} />
        </div>
      </button>

      {open && (
        <>
          <div className="px-5 py-3 border-b border-[var(--border-soft)] flex flex-col sm:flex-row gap-2">
            <input
              type="text" value={desc} onChange={e => setDesc(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} placeholder={placeholder}
              className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
              style={{ color: 'var(--text-primary)' }}
            />
            <input
              type="number" step="0.01" min="0" value={val} onChange={e => setVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} placeholder="0,00"
              className="w-full sm:w-28 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm tabular-nums focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
              style={{ color: 'var(--text-primary)' }}
            />
            <button
              onClick={submit} disabled={!desc.trim()}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              style={{ background: color }}
            >
              <Plus size={15} strokeWidth={2.4} /> Adicionar
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-8 px-5">
              <Pin size={22} className="mx-auto mb-2 opacity-30" style={{ color }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{emptyText}</p>
            </div>
          ) : (
            <ul>
              {items.map((entry, i) => (
                <FixedEntryRow key={entry.id} entry={entry} color={color} striped={i % 2 === 1}
                  onUpdate={onUpdate} onRemove={onRemove} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function FixedEntryRow({ entry, color, striped, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(entry.description);
  const [val, setVal] = useState(entry.value);

  const save = () => { onUpdate(entry.id, { description: desc, value: parseFloat(val) || 0 }); setEditing(false); };
  const cancel = () => { setDesc(entry.description); setVal(entry.value); setEditing(false); };

  return (
    <li className={`group flex items-center gap-2 px-5 py-3 border-b border-[var(--border-soft)] last:border-b-0 transition-colors hover:bg-[var(--bg-hover)]/50 ${striped ? 'bg-[var(--bg-subtle)]/60' : ''}`}>
      {editing ? (
        <>
          <input type="text" value={desc} onChange={e => setDesc(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()} autoFocus
            className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
          />
          <input type="number" step="0.01" value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="w-24 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:border-[var(--accent)] transition-all"
          />
          <button onClick={save} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ color: 'var(--success)' }}><Check size={16} /></button>
          <button onClick={cancel} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ color: 'var(--text-secondary)' }}><X size={16} /></button>
        </>
      ) : (
        <>
          <button
            onClick={() => onUpdate(entry.id, { active: entry.active === false })}
            title={entry.active === false ? 'Ativar' : 'Desativar temporariamente'}
            className="shrink-0 w-4 h-4 rounded-full border-2 transition-all hover:scale-110"
            style={{ background: entry.active === false ? 'transparent' : color, borderColor: entry.active === false ? 'var(--border)' : color }}
          />
          <Pin size={12} className="shrink-0 opacity-40" style={{ color }} />
          <span className="flex-1 text-sm truncate" style={{
            color: entry.active === false ? 'var(--text-secondary)' : 'var(--text-primary)',
            textDecoration: entry.active === false ? 'line-through' : 'none',
            opacity: entry.active === false ? 0.6 : 1,
          }}>
            {entry.description}
          </span>
          <span className="text-sm font-semibold tabular-nums" style={{
            color: entry.active === false ? 'var(--text-secondary)' : color,
            opacity: entry.active === false ? 0.5 : 1,
          }}>
            {brl(entry.value)}
          </span>
          <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            ><Pencil size={15} /></button>
            <button onClick={() => onRemove(entry.id)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            ><Trash2 size={15} /></button>
          </div>
        </>
      )}
    </li>
  );
}

// ── Summary Card ───────────────────────────────────────────────────────────────

function SummaryCard({ label, value, Icon, color, delay = 0 }) {
  return (
    <div className="card-surface hover-lift rounded-xl p-5 relative overflow-hidden fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: color }} />
      <div className="flex items-center gap-4">
        <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint(color, 14), color }}>
          <Icon size={20} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-0.5">{label}</p>
          <p className="text-2xl font-bold tabular-nums truncate" style={{ color }}>{value}</p>
        </div>
      </div>
    </div>
  );
}

// ── Entry Section (lançamentos mensais) ────────────────────────────────────────

function EntrySection({ title, Icon, accent, type, entries, total, placeholder, onAdd, onUpdate, onRemove, delay = 0 }) {
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [parcelas, setParcelas] = useState('');
  const [parcelaAtual, setParcelaAtual] = useState('1');

  const totalParcelas = parseInt(parcelas) || 1;

  const submit = () => {
    if (!desc.trim()) return;
    const extras = totalParcelas > 1
      ? { parcelas: totalParcelas, parcelaAtual: parseInt(parcelaAtual) || 1 }
      : {};
    onAdd(type, desc.trim(), parseFloat(val) || 0, extras);
    setDesc(''); setVal(''); setParcelas(''); setParcelaAtual('1');
  };

  return (
    <div className="card-surface rounded-xl overflow-hidden flex flex-col fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-[var(--border-soft)]">
        <h2 className="text-base font-semibold flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: tint(accent, 14), color: accent }}>
            <Icon size={17} strokeWidth={2.2} />
          </span>
          {title}
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            ({entries.filter(e => e.active !== false).length}/{entries.length})
          </span>
        </h2>
        <span className="font-bold tabular-nums" style={{ color: accent }}>{brl(total)}</span>
      </div>

      {/* Add form */}
      <div className="px-5 py-4 border-b border-[var(--border-soft)] flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text" value={desc} onChange={e => setDesc(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()} placeholder={placeholder}
            className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all duration-200"
          />
          <input
            type="number" step="0.01" min="0" value={val}
            onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="0,00"
            className="w-full sm:w-28 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all duration-200 tabular-nums"
          />
          <button onClick={submit} disabled={!desc.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={2.4} /> Adicionar
          </button>
        </div>

        {/* Parcelas */}
        <div className="flex items-center gap-2">
          <CreditCard size={14} style={{ color: 'var(--text-secondary)' }} className="shrink-0" />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Parcelas:</span>
          <input
            type="number" min="1" max="99" value={parcelas}
            onChange={e => { setParcelas(e.target.value); if (!parcelaAtual) setParcelaAtual('1'); }}
            placeholder="1"
            className="w-14 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-center tabular-nums focus:outline-none focus:border-[var(--accent)] transition-all"
          />
          {totalParcelas > 1 && (
            <>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>· Parcela atual:</span>
              <input
                type="number" min="1" max={totalParcelas} value={parcelaAtual}
                onChange={e => setParcelaAtual(e.target.value)}
                className="w-14 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-center tabular-nums focus:outline-none focus:border-[var(--accent)] transition-all"
              />
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                {parcelaAtual || 1}/{totalParcelas}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Entries list */}
      <div className="flex-1">
        {entries.length === 0 ? (
          <div className="text-center py-12 px-5">
            <Inbox size={28} className="mx-auto mb-2 text-[var(--text-secondary)] opacity-50" />
            <p className="text-sm text-[var(--text-secondary)]">Nenhum lançamento neste mês.</p>
          </div>
        ) : (
          <ul>
            {entries.map((entry, i) => (
              <EntryRow key={entry.id} entry={entry} type={type} accent={accent}
                striped={i % 2 === 1} onUpdate={onUpdate} onRemove={onRemove} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Entry Row ──────────────────────────────────────────────────────────────────

function EntryRow({ entry, type, accent, striped, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(entry.description);
  const [val, setVal] = useState(entry.value);
  const [parcelaAtual, setParcelaAtual] = useState(entry.parcelaAtual || 1);
  const [parcelas, setParcelas] = useState(entry.parcelas || 1);
  const [updateAll, setUpdateAll] = useState(false);

  const hasParcelas = (entry.parcelas || 1) > 1;

  const save = () => {
    onUpdate(entry.id, {
      description: desc,
      value: parseFloat(val) || 0,
      ...(parseInt(parcelas) > 1 ? { parcelas: parseInt(parcelas), parcelaAtual: parseInt(parcelaAtual) } : {}),
      ...(updateAll && entry.grupoId ? { updateGroup: true } : {}),
    });
    setEditing(false);
  };

  const cancel = () => {
    setDesc(entry.description);
    setVal(entry.value);
    setParcelaAtual(entry.parcelaAtual || 1);
    setParcelas(entry.parcelas || 1);
    setUpdateAll(false);
    setEditing(false);
  };

  return (
    <li className={`group flex items-center gap-2 px-5 py-3 border-b border-[var(--border-soft)] last:border-b-0 transition-colors duration-200 hover:bg-[var(--bg-hover)]/50 ${striped ? 'bg-[var(--bg-subtle)]/60' : ''}`}>
      {editing ? (
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <input
              type="text" value={desc} onChange={e => setDesc(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()} autoFocus
              className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
            />
            <input
              type="number" step="0.01" value={val} onChange={e => setVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              className="w-24 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
            />
            <button onClick={save} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--success)] hover:bg-[var(--bg-hover)] transition-colors" title="Salvar"><Check size={16} /></button>
            <button onClick={cancel} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors" title="Cancelar"><X size={16} /></button>
          </div>
          <div className="flex items-center gap-2 pl-1">
            <CreditCard size={13} style={{ color: 'var(--text-secondary)' }} className="shrink-0" />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Parcelas:</span>
            <input
              type="number" min="1" max="99" value={parcelas} onChange={e => setParcelas(e.target.value)}
              className="w-14 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-center tabular-nums focus:outline-none focus:border-[var(--accent)] transition-all"
            />
            {parseInt(parcelas) > 1 && (
              <>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>· Atual:</span>
                <input
                  type="number" min="1" max={parseInt(parcelas)} value={parcelaAtual}
                  onChange={e => setParcelaAtual(e.target.value)}
                  className="w-14 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-center tabular-nums focus:outline-none focus:border-[var(--accent)] transition-all"
                />
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  {parcelaAtual || 1}/{parseInt(parcelas)}
                </span>
              </>
            )}
            {/* Atualizar todas as parcelas */}
            {hasParcelas && entry.grupoId && (
              <label className="flex items-center gap-1.5 ml-2 cursor-pointer select-none">
                <input
                  type="checkbox" checked={updateAll} onChange={e => setUpdateAll(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-[var(--accent)]"
                />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Atualizar todas as parcelas</span>
              </label>
            )}
          </div>
        </div>
      ) : (
        <>
          <button
            onClick={() => onUpdate(entry.id, { active: entry.active === false })}
            title={entry.active === false ? 'Ativar' : 'Desativar'}
            className="shrink-0 w-4 h-4 rounded-full border-2 transition-all duration-200 hover:scale-110"
            style={{ background: entry.active === false ? 'transparent' : accent, borderColor: entry.active === false ? 'var(--border)' : accent }}
          />
          <span className="flex-1 text-sm truncate transition-all duration-200" title={entry.description}
            style={{ color: entry.active === false ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: entry.active === false ? 'line-through' : 'none', opacity: entry.active === false ? 0.6 : 1 }}>
            {entry.description}
          </span>
          {hasParcelas && (
            <span className="shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              title={`Parcela ${entry.parcelaAtual} de ${entry.parcelas}`}
            >
              <CreditCard size={10} />
              {entry.parcelaAtual}/{entry.parcelas}
            </span>
          )}
          <span className="text-sm font-semibold tabular-nums transition-all duration-200"
            style={{ color: entry.active === false ? 'var(--text-secondary)' : accent, opacity: entry.active === false ? 0.5 : 1 }}>
            {brl(entry.value)}
          </span>
          <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
            <button onClick={() => setEditing(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] transition-colors"
              title="Editar"><Pencil size={15} /></button>
            <button onClick={() => onRemove(entry.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--bg-hover)] transition-colors"
              title="Remover"><Trash2 size={15} /></button>
          </div>
        </>
      )}
    </li>
  );
}

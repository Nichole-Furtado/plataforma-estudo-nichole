import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Scale,
  Plus, Pencil, Trash2, Check, X, Inbox,
} from 'lucide-react';
import {
  fetchFinanceiro,
  addFinanceiroEntry,
  updateFinanceiroEntry,
  removeFinanceiroEntry,
} from '@/lib/api';

function getMonthName(month) {
  const names = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return names[month - 1];
}

const brl = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

const tint = (color, pct) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

export default function FinanceiroPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFinanceiro(yearMonth);
      setIncomes(data.incomes || []);
      setExpenses(data.expenses || []);
    } catch (err) {
      console.error('Erro ao carregar financeiro:', err);
    } finally {
      setLoading(false);
    }
  }, [yearMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const changeMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  };

  const applyData = (data) => {
    setIncomes(data.incomes || []);
    setExpenses(data.expenses || []);
  };

  const handleAdd = async (type, description, value) => {
    try {
      const res = await addFinanceiroEntry(yearMonth, type, description, value);
      applyData(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdate = async (id, patch) => {
    try {
      const res = await updateFinanceiroEntry(yearMonth, id, patch);
      applyData(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemove = async (id) => {
    try {
      const res = await removeFinanceiroEntry(yearMonth, id);
      applyData(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  const totalIncome = incomes.filter(e => e.active !== false).reduce((acc, e) => acc + (e.value || 0), 0);
  const totalExpense = expenses.filter(e => e.active !== false).reduce((acc, e) => acc + (e.value || 0), 0);
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

        {/* Month Navigation */}
        <div className="flex items-center gap-1 card-surface rounded-xl px-1.5 py-1.5">
          <button
            onClick={() => changeMonth(-1)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold text-sm min-w-[150px] text-center tabular-nums">
            {getMonthName(month)} {year}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all duration-200"
            aria-label="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>
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
        <div className="card-surface rounded-xl px-5 py-4 mb-8 fade-in-up" style={{ animationDelay: '180ms' }}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--text-secondary)]">Gastos sobre a renda</span>
            <span className="font-semibold tabular-nums" style={{ color: spentPct >= 100 ? 'var(--error)' : spentPct >= 80 ? 'var(--warning)' : 'var(--success)' }}>
              {spentPct}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${spentPct}%`,
                background: spentPct >= 100 ? 'var(--error)' : spentPct >= 80 ? 'var(--warning)' : 'var(--success)',
              }}
            />
          </div>
        </div>
      )}

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
            total={totalIncome}
            placeholder="Ex: Salário, Freelance, Poupança..."
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
            total={totalExpense}
            placeholder="Ex: Cartão, Faculdade, Academia, Comida..."
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

function SummaryCard({ label, value, Icon, color, delay = 0 }) {
  return (
    <div
      className="card-surface hover-lift rounded-xl p-5 relative overflow-hidden fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: color }} />
      <div className="flex items-center gap-4">
        <span
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: tint(color, 14), color }}
        >
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

function EntrySection({ title, Icon, accent, type, entries, total, placeholder, onAdd, onUpdate, onRemove, delay = 0 }) {
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');

  const submit = () => {
    if (!desc.trim()) return;
    onAdd(type, desc.trim(), parseFloat(val) || 0);
    setDesc('');
    setVal('');
  };

  return (
    <div
      className="card-surface rounded-xl overflow-hidden flex flex-col fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Section header */}
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
      <div className="px-5 py-4 border-b border-[var(--border-soft)] flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={placeholder}
          className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all duration-200"
        />
        <input
          type="number"
          step="0.01"
          min="0"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="0,00"
          className="w-full sm:w-32 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all duration-200 tabular-nums"
        />
        <button
          onClick={submit}
          disabled={!desc.trim()}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <Plus size={16} strokeWidth={2.4} /> Adicionar
        </button>
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
              <EntryRow
                key={entry.id}
                entry={entry}
                accent={accent}
                striped={i % 2 === 1}
                onUpdate={onUpdate}
                onRemove={onRemove}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EntryRow({ entry, accent, striped, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(entry.description);
  const [val, setVal] = useState(entry.value);

  const save = () => {
    onUpdate(entry.id, { description: desc, value: parseFloat(val) || 0 });
    setEditing(false);
  };

  const cancel = () => {
    setDesc(entry.description);
    setVal(entry.value);
    setEditing(false);
  };

  return (
    <li
      className={`group flex items-center gap-2 px-5 py-3 border-b border-[var(--border-soft)] last:border-b-0 transition-colors duration-200 hover:bg-[var(--bg-hover)]/50 ${
        striped ? 'bg-[var(--bg-subtle)]/60' : ''
      }`}
    >
      {editing ? (
        <>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            autoFocus
            className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
          />
          <input
            type="number"
            step="0.01"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="w-24 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
          />
          <button onClick={save} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--success)] hover:bg-[var(--bg-hover)] transition-colors" title="Salvar"><Check size={16} /></button>
          <button onClick={cancel} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors" title="Cancelar"><X size={16} /></button>
        </>
      ) : (
        <>
          {/* Toggle ativo/inativo */}
          <button
            onClick={() => onUpdate(entry.id, { active: entry.active === false })}
            title={entry.active === false ? 'Ativar (contar no total)' : 'Desativar (só registrar)'}
            className="shrink-0 w-4 h-4 rounded-full border-2 transition-all duration-200 hover:scale-110"
            style={{
              background: entry.active === false ? 'transparent' : accent,
              borderColor: entry.active === false ? 'var(--border)' : accent,
            }}
          />
          <span
            className="flex-1 text-sm truncate transition-all duration-200"
            title={entry.description}
            style={{
              color: entry.active === false ? 'var(--text-secondary)' : 'var(--text-primary)',
              textDecoration: entry.active === false ? 'line-through' : 'none',
              opacity: entry.active === false ? 0.6 : 1,
            }}
          >
            {entry.description}
          </span>
          <span
            className="text-sm font-semibold tabular-nums transition-all duration-200"
            style={{
              color: entry.active === false ? 'var(--text-secondary)' : accent,
              opacity: entry.active === false ? 0.5 : 1,
            }}
          >
            {brl(entry.value)}
          </span>
          <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => setEditing(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] transition-colors"
              title="Editar"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={() => onRemove(entry.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--bg-hover)] transition-colors"
              title="Remover"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </>
      )}
    </li>
  );
}

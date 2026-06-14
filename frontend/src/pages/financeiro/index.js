import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Scale,
  Plus, Pencil, Trash2, Check, X, Inbox, CreditCard, Pin,
} from 'lucide-react';
import {
  fetchFinanceiro,
  addFinanceiroEntry,
  updateFinanceiroEntry,
  removeFinanceiroEntry,
  fetchRendasFixas,
  addRendaFixa,
  updateRendaFixa,
  removeRendaFixa,
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
  const [fixedIncomes, setFixedIncomes] = useState([]);
  const [loading, setLoading] = useState(true);

  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, fixed] = await Promise.all([
        fetchFinanceiro(yearMonth),
        fetchRendasFixas(),
      ]);
      setIncomes(data.incomes || []);
      setExpenses(data.expenses || []);
      setFixedIncomes(fixed || []);
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

  const handleAdd = async (type, description, value, extras = {}) => {
    try {
      const res = await addFinanceiroEntry(yearMonth, type, description, value, extras);
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

  const totalFixed = fixedIncomes.filter(e => e.active !== false).reduce((acc, e) => acc + (e.value || 0), 0);
  const totalIncome = totalFixed + incomes.filter(e => e.active !== false).reduce((acc, e) => acc + (e.value || 0), 0);
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

      {/* Rendas Fixas */}
      <FixedIncomesSection
        items={fixedIncomes}
        total={totalFixed}
        onAdd={async (desc, val) => {
          const res = await addRendaFixa(desc, val);
          setFixedIncomes(res.fixed);
        }}
        onUpdate={async (id, patch) => {
          const res = await updateRendaFixa(id, patch);
          setFixedIncomes(res.fixed);
        }}
        onRemove={async (id) => {
          const res = await removeRendaFixa(id);
          setFixedIncomes(res.fixed);
        }}
      />

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

function FixedIncomesSection({ items, total, onAdd, onUpdate, onRemove }) {
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [open, setOpen] = useState(true);

  const submit = async () => {
    if (!desc.trim()) return;
    try {
      await onAdd(desc.trim(), parseFloat(val) || 0);
      setDesc('');
      setVal('');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="card-surface rounded-xl overflow-hidden mb-6 fade-in-up" style={{ animationDelay: '160ms' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-5 py-4 flex items-center justify-between border-b border-[var(--border-soft)] hover:bg-[var(--bg-hover)]/40 transition-colors"
      >
        <h2 className="text-base font-semibold flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: tint('var(--success)', 14), color: 'var(--success)' }}>
            <Pin size={15} strokeWidth={2.2} />
          </span>
          Rendas Fixas
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            ({items.filter(e => e.active !== false).length}/{items.length}) · aparece todo mês
          </span>
        </h2>
        <div className="flex items-center gap-3">
          <span className="font-bold tabular-nums" style={{ color: 'var(--success)' }}>{brl(total)}</span>
          <ChevronRight size={16} style={{ color: 'var(--text-secondary)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
      </button>

      {open && (
        <>
          {/* Add form */}
          <div className="px-5 py-3 border-b border-[var(--border-soft)] flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Ex: Salário, Freelance mensal, Aluguel recebido..."
              className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
              style={{ color: 'var(--text-primary)' }}
            />
            <input
              type="number"
              step="0.01"
              min="0"
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="0,00"
              className="w-full sm:w-28 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm tabular-nums focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all"
              style={{ color: 'var(--text-primary)' }}
            />
            <button
              onClick={submit}
              disabled={!desc.trim()}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              style={{ background: 'var(--success)' }}
            >
              <Plus size={15} strokeWidth={2.4} /> Adicionar
            </button>
          </div>

          {/* Lista */}
          {items.length === 0 ? (
            <div className="text-center py-8 px-5">
              <Pin size={22} className="mx-auto mb-2 opacity-30" style={{ color: 'var(--text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Nenhuma renda fixa cadastrada. Adicione acima.
              </p>
            </div>
          ) : (
            <ul>
              {items.map((entry, i) => (
                <FixedEntryRow
                  key={entry.id}
                  entry={entry}
                  striped={i % 2 === 1}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function FixedEntryRow({ entry, striped, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(entry.description);
  const [val, setVal] = useState(entry.value);
  const accent = 'var(--success)';

  const save = () => {
    onUpdate(entry.id, { description: desc, value: parseFloat(val) || 0 });
    setEditing(false);
  };
  const cancel = () => { setDesc(entry.description); setVal(entry.value); setEditing(false); };

  return (
    <li
      className={`group flex items-center gap-2 px-5 py-3 border-b border-[var(--border-soft)] last:border-b-0 transition-colors hover:bg-[var(--bg-hover)]/50 ${striped ? 'bg-[var(--bg-subtle)]/60' : ''}`}
    >
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
          <button onClick={save} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ color: 'var(--success)' }} title="Salvar"><Check size={16} /></button>
          <button onClick={cancel} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ color: 'var(--text-secondary)' }} title="Cancelar"><X size={16} /></button>
        </>
      ) : (
        <>
          <button
            onClick={() => onUpdate(entry.id, { active: entry.active === false })}
            title={entry.active === false ? 'Ativar' : 'Desativar temporariamente'}
            className="shrink-0 w-4 h-4 rounded-full border-2 transition-all hover:scale-110"
            style={{ background: entry.active === false ? 'transparent' : accent, borderColor: entry.active === false ? 'var(--border)' : accent }}
          />
          <Pin size={12} className="shrink-0 opacity-40" style={{ color: accent }} />
          <span className="flex-1 text-sm truncate"
            style={{ color: entry.active === false ? 'var(--text-secondary)' : 'var(--text-primary)',
              textDecoration: entry.active === false ? 'line-through' : 'none',
              opacity: entry.active === false ? 0.6 : 1 }}>
            {entry.description}
          </span>
          <span className="text-sm font-semibold tabular-nums"
            style={{ color: entry.active === false ? 'var(--text-secondary)' : accent, opacity: entry.active === false ? 0.5 : 1 }}>
            {brl(entry.value)}
          </span>
          <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              title="Editar"><Pencil size={15} /></button>
            <button onClick={() => onRemove(entry.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              title="Remover"><Trash2 size={15} /></button>
          </div>
        </>
      )}
    </li>
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
  const [parcelas, setParcelas] = useState('');
  const [parcelaAtual, setParcelaAtual] = useState('1');

  const isExpense = type === 'expense';
  const totalParcelas = parseInt(parcelas) || 1;

  const submit = () => {
    if (!desc.trim()) return;
    const extras = isExpense && totalParcelas > 1
      ? { parcelas: totalParcelas, parcelaAtual: parseInt(parcelaAtual) || 1 }
      : {};
    onAdd(type, desc.trim(), parseFloat(val) || 0, extras);
    setDesc('');
    setVal('');
    setParcelas('');
    setParcelaAtual('1');
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
      <div className="px-5 py-4 border-b border-[var(--border-soft)] flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
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
            className="w-full sm:w-28 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] transition-all duration-200 tabular-nums"
          />
          <button
            onClick={submit}
            disabled={!desc.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={2.4} /> Adicionar
          </button>
        </div>

        {/* Parcelas (só para gastos) */}
        {isExpense && (
          <div className="flex items-center gap-2">
            <CreditCard size={14} style={{ color: 'var(--text-secondary)' }} className="shrink-0" />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Parcelas:</span>
            <input
              type="number"
              min="1"
              max="99"
              value={parcelas}
              onChange={(e) => { setParcelas(e.target.value); if (!parcelaAtual) setParcelaAtual('1'); }}
              placeholder="1"
              className="w-14 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-center tabular-nums focus:outline-none focus:border-[var(--accent)] transition-all"
            />
            {totalParcelas > 1 && (
              <>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>· Parcela atual:</span>
                <input
                  type="number"
                  min="1"
                  max={totalParcelas}
                  value={parcelaAtual}
                  onChange={(e) => setParcelaAtual(e.target.value)}
                  className="w-14 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-center tabular-nums focus:outline-none focus:border-[var(--accent)] transition-all"
                />
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {parcelaAtual || 1}/{totalParcelas}
                </span>
              </>
            )}
          </div>
        )}
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
  const [parcelaAtual, setParcelaAtual] = useState(entry.parcelaAtual || 1);
  const [parcelas, setParcelas] = useState(entry.parcelas || 1);

  const hasParcelas = (entry.parcelas || 1) > 1;

  const save = () => {
    onUpdate(entry.id, {
      description: desc,
      value: parseFloat(val) || 0,
      ...(parcelas > 1 ? { parcelas: parseInt(parcelas), parcelaAtual: parseInt(parcelaAtual) } : {}),
    });
    setEditing(false);
  };

  const cancel = () => {
    setDesc(entry.description);
    setVal(entry.value);
    setParcelaAtual(entry.parcelaAtual || 1);
    setParcelas(entry.parcelas || 1);
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
          {/* Chip de parcelas */}
          {hasParcelas && (
            <span
              className="shrink-0 text-xs font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              title={`Parcela ${entry.parcelaAtual} de ${entry.parcelas}`}
            >
              <CreditCard size={10} />
              {entry.parcelaAtual}/{entry.parcelas}
            </span>
          )}
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

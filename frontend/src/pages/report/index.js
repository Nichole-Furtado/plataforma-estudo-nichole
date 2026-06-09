import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Check, Trash2, ClipboardList,
} from 'lucide-react';
import {
  fetchTracker,
  addTrackerSubject,
  removeTrackerSubject,
  toggleTrackerDay,
} from '@/lib/api';

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getMonthName(month) {
  const names = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return names[month - 1];
}

export default function ReportPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [subjects, setSubjects] = useState([]);
  const [entries, setEntries] = useState({});
  const [newSubject, setNewSubject] = useState('');
  const [loading, setLoading] = useState(true);

  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
  const daysInMonth = getDaysInMonth(year, month);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTracker(yearMonth);
      setSubjects(data.subjects || []);
      setEntries(data.entries || {});
    } catch (err) {
      console.error('Erro ao carregar tracker:', err);
    } finally {
      setLoading(false);
    }
  }, [yearMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;
    try {
      const data = await addTrackerSubject(yearMonth, newSubject.trim());
      setSubjects(data.data.subjects);
      setEntries(data.data.entries);
      setNewSubject('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveSubject = async (name) => {
    if (!confirm(`Remover "${name}" do relatório?`)) return;
    try {
      const data = await removeTrackerSubject(yearMonth, name);
      setSubjects(data.data.subjects);
      setEntries(data.data.entries);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggle = async (subject, day) => {
    try {
      const data = await toggleTrackerDay(yearMonth, subject, day);
      setEntries(data.data.entries);
    } catch (err) {
      console.error('Erro ao toggle:', err);
    }
  };

  const changeMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  };

  const getSubjectStats = (subject) => {
    const e = entries[subject] || {};
    const checked = Object.values(e).filter(Boolean).length;
    return { checked, total: daysInMonth, percent: Math.round((checked / daysInMonth) * 100) };
  };

  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Relatório Mensal</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">
            Acompanhe seus estudos diários — marque o que você estudou a cada dia do mês.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-1 card-surface rounded-xl px-1.5 py-1.5">
          <button
            onClick={() => changeMonth(-1)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold text-sm min-w-[150px] text-center tabular-nums">
            {getMonthName(month)} {year}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
            aria-label="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Add Subject */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 mb-6">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
            placeholder="Nome da matéria (ex: Python, Matemática, Leitura)..."
            className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          <button
            onClick={handleAddSubject}
            disabled={!newSubject.trim()}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={2.4} /> Adicionar Matéria
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="w-7 h-7 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="card-surface rounded-2xl p-12 text-center">
          <ClipboardList size={36} className="mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Nenhuma matéria cadastrada</h2>
          <p className="text-[var(--text-secondary)]">
            Adicione matérias acima para começar a acompanhar seus estudos diários.
          </p>
        </div>
      ) : (
        /* Tracker Table */
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="sticky left-0 z-10 bg-[var(--bg-card)] text-left px-4 py-3 font-semibold text-[var(--text-secondary)] min-w-[180px]">
                    Meta/Matéria
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                    <th
                      key={day}
                      className={`px-1 py-3 text-center font-medium min-w-[36px] ${
                        isCurrentMonth && day === today
                          ? 'text-[var(--accent)] bg-[var(--accent)]/10'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {String(day).padStart(2, '0')}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center font-semibold text-[var(--text-secondary)] min-w-[80px]">
                    Total
                  </th>
                  <th className="px-3 py-3 min-w-[40px]"></th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject, si) => {
                  const stats = getSubjectStats(subject);
                  return (
                    <tr
                      key={subject}
                      className={`border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-hover)]/50 transition-colors ${
                        si % 2 === 0 ? '' : 'bg-[var(--bg-primary)]/30'
                      }`}
                    >
                      <td className="sticky left-0 z-10 bg-[var(--bg-card)] px-4 py-2.5 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                          <span className="truncate max-w-[140px]" title={subject}>
                            {subject}
                          </span>
                        </div>
                      </td>
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        const checked = entries[subject]?.[String(day)] || false;
                        return (
                          <td
                            key={day}
                            className={`px-1 py-2.5 text-center ${
                              isCurrentMonth && day === today ? 'bg-[var(--accent)]/5' : ''
                            }`}
                          >
                            <button
                              onClick={() => handleToggle(subject, day)}
                              className={`w-7 h-7 rounded-md border transition-all duration-150 flex items-center justify-center mx-auto ${
                                checked
                                  ? 'bg-[var(--success)] border-[var(--success)] text-white shadow-sm shadow-[var(--success)]/30'
                                  : 'border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--bg-hover)]'
                              }`}
                              title={`${subject} — Dia ${day}`}
                            >
                              {checked && <Check size={14} strokeWidth={3} />}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-bold text-sm ${
                            stats.percent >= 80
                              ? 'text-[var(--success)]'
                              : stats.percent >= 50
                              ? 'text-[var(--warning)]'
                              : 'text-[var(--error)]'
                          }`}>
                            {stats.percent}%
                          </span>
                          <span className="text-xs text-[var(--text-secondary)]">
                            {stats.checked}/{stats.total}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => handleRemoveSubject(subject)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--bg-hover)] transition-colors"
                          title={`Remover ${subject}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Bar */}
          <div className="border-t border-[var(--border)] px-4 py-3 flex flex-wrap items-center gap-6 bg-[var(--bg-primary)]/30">
            <span className="text-sm text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">{subjects.length}</strong> matérias
            </span>
            <span className="text-sm text-[var(--text-secondary)]">
              <strong className="text-[var(--text-primary)]">{daysInMonth}</strong> dias no mês
            </span>
            <span className="text-sm text-[var(--text-secondary)]">
              <strong className="text-[var(--success)]">
                {subjects.reduce((acc, s) => acc + (getSubjectStats(s).checked), 0)}
              </strong> marcações totais
            </span>
            {isCurrentMonth && (
              <span className="text-sm text-[var(--accent)] font-medium">
                Hoje: dia {today}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

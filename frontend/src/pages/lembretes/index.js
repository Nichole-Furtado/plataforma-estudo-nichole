import { useState, useEffect, useCallback } from 'react';
import { Plus, Check, Trash2, ListChecks, ClipboardList } from 'lucide-react';
import {
  fetchLembretes,
  addLembrete,
  toggleLembrete,
  removeLembrete,
  limparConcluidos,
} from '@/lib/api';

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'pendentes', label: 'Pendentes' },
  { key: 'concluidos', label: 'Concluídos' },
];

export default function LembretesPage() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchLembretes();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setAdding(true);
    try {
      const res = await addLembrete(text.trim());
      setItems(res.lembretes);
      setText('');
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id, completed) => {
    try {
      const res = await toggleLembrete(id, !completed);
      setItems(res.lembretes);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemove = async (id) => {
    try {
      const res = await removeLembrete(id);
      setItems(res.lembretes);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLimpar = async () => {
    try {
      const res = await limparConcluidos();
      setItems(res.lembretes);
    } catch (err) {
      alert(err.message);
    }
  };

  const pendentes = items.filter((i) => !i.completed).length;
  const concluidos = items.filter((i) => i.completed).length;

  const visiveis = items.filter((i) => {
    if (filtro === 'pendentes') return !i.completed;
    if (filtro === 'concluidos') return i.completed;
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <span
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <ListChecks size={20} strokeWidth={2.2} />
            </span>
            Lembretes
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            {pendentes > 0 ? `${pendentes} pendente${pendentes > 1 ? 's' : ''}` : 'Tudo em dia!'}
            {concluidos > 0 && ` · ${concluidos} concluído${concluidos > 1 ? 's' : ''}`}
          </p>
        </div>
        {concluidos > 0 && (
          <button
            onClick={handleLimpar}
            className="text-xs px-3 py-1.5 rounded-lg border transition-colors shrink-0"
            style={{
              color: 'var(--text-secondary)',
              borderColor: 'var(--border)',
              background: 'var(--bg-card)',
            }}
          >
            Limpar concluídos
          </button>
        )}
      </div>

      {/* Add form */}
      <div
        className="flex gap-2 mb-6 p-4 rounded-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Adicionar lembrete..."
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--text-primary)' }}
          autoFocus
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim() || adding}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent)' }}
        >
          {adding ? (
            <span
              className="w-4 h-4 rounded-full border-2 animate-spin"
              style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}
            />
          ) : (
            <Plus size={16} strokeWidth={2.4} />
          )}
          Adicionar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 mb-4">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: filtro === f.key ? 'var(--accent)' : 'var(--bg-card)',
              color: filtro === f.key ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${filtro === f.key ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {f.label}
            {f.key === 'pendentes' && pendentes > 0 && (
              <span className="ml-1.5 text-xs opacity-80">({pendentes})</span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <span
            className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
          />
        </div>
      ) : visiveis.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-secondary)' }} />
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm">
            {filtro === 'concluidos' ? 'Nenhum item concluído ainda.' :
             filtro === 'pendentes' ? 'Nenhum item pendente.' :
             'Nenhum lembrete ainda. Adicione um acima!'}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {visiveis.map((item) => (
            <li
              key={item.id}
              className="group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                opacity: item.completed ? 0.7 : 1,
              }}
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggle(item.id, item.completed)}
                className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                style={{
                  background: item.completed ? 'var(--success)' : 'transparent',
                  borderColor: item.completed ? 'var(--success)' : 'var(--border)',
                }}
                title={item.completed ? 'Marcar como pendente' : 'Marcar como concluído'}
              >
                {item.completed && <Check size={11} color="white" strokeWidth={3} />}
              </button>

              {/* Texto */}
              <span
                className="flex-1 text-sm"
                style={{
                  color: item.completed ? 'var(--text-secondary)' : 'var(--text-primary)',
                  textDecoration: item.completed ? 'line-through' : 'none',
                }}
              >
                {item.text}
              </span>

              {/* Deletar */}
              <button
                onClick={() => handleRemove(item.id)}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all sm:opacity-0 sm:group-hover:opacity-100"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                title="Remover"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import {
  Rocket, Check, Plus, Trash2, ChevronRight, Trophy, Target, StickyNote, X,
} from 'lucide-react';
import { fetchEmpreender, updateMissao, addMissao, removeMissao } from '@/lib/api';

// Uma cor por etapa, em ordem fixa — a mesma etapa tem sempre a mesma cor.
const COR_ETAPA = {
  ideia: '#7c7ff7',
  validacao: '#eb6834',
  'primeiro-cliente': '#1baf7a',
  contas: '#eda100',
  crescimento: '#e87ba4',
};
const corDa = (id) => COR_ETAPA[id] || 'var(--accent)';
const tint = (cor, pct) => `color-mix(in srgb, ${cor} ${pct}%, transparent)`;

// ── Cartão de nível ────────────────────────────────────────────────────────────

function PainelNivel({ pontos, pontosPossiveis, feitas, total, nivel, proximoNivel }) {
  const faltam = proximoNivel ? proximoNivel.minimo - pontos : 0;
  const base = nivel?.minimo ?? 0;
  const alvo = proximoNivel?.minimo ?? Math.max(pontos, 1);
  const pct = proximoNivel
    ? Math.max(0, Math.min(100, Math.round(((pontos - base) / (alvo - base)) * 100)))
    : 100;

  return (
    <div className="card-surface rounded-2xl overflow-hidden mb-6">
      <div className="px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: tint('var(--accent)', 16), color: 'var(--accent)' }}>
              <Trophy size={22} strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                Nível {nivel?.nivel ?? 1}
              </p>
              <p className="text-2xl font-bold truncate">{nivel?.nome ?? 'Curioso'}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Pontos</p>
              <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{pontos}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Missões</p>
              <p className="text-2xl font-bold tabular-nums">{feitas}<span className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>/{total}</span></p>
            </div>
          </div>
        </div>

        <div className="flex justify-between text-xs mb-2">
          <span style={{ color: 'var(--text-secondary)' }}>
            {proximoNivel
              ? <>Faltam <strong style={{ color: 'var(--text-primary)' }}>{faltam}</strong> pontos para {proximoNivel.nome}</>
              : <>Último nível alcançado — {pontos} de {pontosPossiveis} pontos possíveis</>}
          </span>
          <span className="tabular-nums font-semibold" style={{ color: 'var(--accent)' }}>{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))' }} />
        </div>
      </div>
    </div>
  );
}

// ── Missão ─────────────────────────────────────────────────────────────────────

function Missao({ missao, estado, cor, onToggle, onNota, onRemover }) {
  const feita = Boolean(estado?.done);
  const [abertaNota, setAbertaNota] = useState(false);
  const [nota, setNota] = useState(estado?.nota || '');

  useEffect(() => { setNota(estado?.nota || ''); }, [estado?.nota]);

  const salvarNota = () => {
    if ((estado?.nota || '') !== nota) onNota(missao.id, nota);
    setAbertaNota(false);
  };

  return (
    <li className="group px-4 py-3 rounded-xl transition-colors hover:bg-[var(--bg-hover)]/50"
      style={{ background: feita ? tint(cor, 7) : 'transparent' }}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(missao.id, !feita)}
          className="shrink-0 mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{
            background: feita ? cor : 'transparent',
            borderColor: feita ? cor : 'var(--border)',
          }}
          title={feita ? 'Desmarcar' : 'Marcar como concluída'}
        >
          {feita && <Check size={14} color="#fff" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-snug"
              style={{
                color: feita ? 'var(--text-secondary)' : 'var(--text-primary)',
                textDecoration: feita ? 'line-through' : 'none',
              }}>
              {missao.titulo}
            </p>
            <span className="shrink-0 text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
              style={{ background: tint(cor, 14), color: cor }}>
              +{missao.pontos}
            </span>
          </div>

          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {missao.descricao}
          </p>

          {/* Anotação */}
          {abertaNota ? (
            <div className="mt-2.5 flex items-start gap-2">
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') { setNota(estado?.nota || ''); setAbertaNota(false); } }}
                rows={2}
                autoFocus
                placeholder="O que você descobriu nessa missão?"
                className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs resize-y focus:outline-none focus:border-[var(--accent)] transition-all"
                style={{ color: 'var(--text-primary)' }}
              />
              <button onClick={salvarNota}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ color: 'var(--success)' }} title="Salvar"><Check size={15} /></button>
              <button onClick={() => { setNota(estado?.nota || ''); setAbertaNota(false); }}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ color: 'var(--text-secondary)' }} title="Cancelar"><X size={15} /></button>
            </div>
          ) : estado?.nota ? (
            <button onClick={() => setAbertaNota(true)}
              className="mt-2 w-full text-left text-xs px-3 py-2 rounded-lg transition-colors hover:brightness-110"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
              <StickyNote size={11} className="inline mr-1.5 -mt-0.5" />
              {estado.nota}
            </button>
          ) : (
            <button onClick={() => setAbertaNota(true)}
              className="mt-1.5 text-xs flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--text-secondary)' }}>
              <StickyNote size={11} /> anotar
            </button>
          )}
        </div>

        {missao.propria && (
          <button onClick={() => onRemover(missao.id, missao.titulo)}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--bg-hover)] transition-colors sm:opacity-0 sm:group-hover:opacity-100"
            title="Remover missão que você criou"><Trash2 size={13} /></button>
        )}
      </div>
    </li>
  );
}

// ── Etapa ──────────────────────────────────────────────────────────────────────

function Etapa({ etapa, progress, onToggle, onNota, onRemover }) {
  const [aberta, setAberta] = useState(true);
  const cor = corDa(etapa.id);

  const feitas = etapa.missoes.filter((m) => progress[m.id]?.done).length;
  const total = etapa.missoes.length;
  const pontos = etapa.missoes.filter((m) => progress[m.id]?.done).reduce((s, m) => s + m.pontos, 0);
  const possiveis = etapa.missoes.reduce((s, m) => s + m.pontos, 0);
  const pct = total ? Math.round((feitas / total) * 100) : 0;
  const completa = total > 0 && feitas === total;

  return (
    <div className="card-surface rounded-2xl overflow-hidden">
      <button onClick={() => setAberta((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-[var(--bg-hover)]/40 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: tint(cor, 15), color: cor }}>
            {completa ? <Trophy size={17} strokeWidth={2.2} /> : <Target size={17} strokeWidth={2.2} />}
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold flex items-center gap-2">
              {etapa.nome}
              {completa && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: tint(cor, 16), color: cor }}>COMPLETA</span>
              )}
            </h2>
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
              {etapa.descricao}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-xs tabular-nums font-semibold" style={{ color: cor }}>{pontos}/{possiveis} pts</p>
            <p className="text-[11px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>{feitas} de {total}</p>
          </div>
          <ChevronRight size={16} style={{
            color: 'var(--text-secondary)',
            transform: aberta ? 'rotate(90deg)' : 'none',
            transition: 'transform .2s',
          }} />
        </div>
      </button>

      <div className="h-1" style={{ background: 'var(--bg-secondary)' }}>
        <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: cor }} />
      </div>

      {aberta && (
        <ul className="p-2 space-y-1">
          {etapa.missoes.map((m) => (
            <Missao key={m.id} missao={m} estado={progress[m.id]} cor={cor}
              onToggle={onToggle} onNota={onNota} onRemover={onRemover} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function EmpreenderPage() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const [novaAberta, setNovaAberta] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaEtapa, setNovaEtapa] = useState('ideia');
  const [novosPontos, setNovosPontos] = useState('10');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setDados(await fetchEmpreender());
      setErro(null);
    } catch (err) {
      setErro(err.message || 'Não foi possível carregar as missões.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const aplicar = (res) => {
    setDados((d) => ({
      ...d,
      ...(res.etapas ? { etapas: res.etapas } : {}),
      ...(res.progress ? { progress: res.progress } : {}),
      pontos: res.pontos, pontosPossiveis: res.pontosPossiveis,
      feitas: res.feitas, total: res.total,
      nivel: res.nivel, proximoNivel: res.proximoNivel,
    }));
  };

  const onToggle = async (id, done) => {
    try {
      const res = await updateMissao(id, { done });
      setDados((d) => ({
        ...d,
        progress: { ...d.progress, [id]: res.missao },
        pontos: res.pontos, feitas: res.feitas, total: res.total,
        pontosPossiveis: res.pontosPossiveis, nivel: res.nivel, proximoNivel: res.proximoNivel,
      }));
    } catch (err) { alert(err.message); }
  };

  const onNota = async (id, nota) => {
    try {
      const res = await updateMissao(id, { nota });
      setDados((d) => ({ ...d, progress: { ...d.progress, [id]: res.missao } }));
    } catch (err) { alert(err.message); }
  };

  const onRemover = async (id, titulo) => {
    if (!confirm(`Remover a missão "${titulo}"?`)) return;
    try { aplicar(await removeMissao(id)); } catch (err) { alert(err.message); }
  };

  const criar = async () => {
    if (!novoTitulo.trim()) return;
    setSalvando(true);
    try {
      aplicar(await addMissao({
        titulo: novoTitulo.trim(),
        descricao: novaDescricao.trim(),
        etapa: novaEtapa,
        pontos: parseInt(novosPontos, 10) || 10,
      }));
      setNovoTitulo(''); setNovaDescricao(''); setNovosPontos('10'); setNovaAberta(false);
    } catch (err) { alert(err.message); }
    finally { setSalvando(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 fade-in">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
            <Rocket size={20} strokeWidth={2.2} />
          </span>
          Empreender
        </h1>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
          Uma trilha de missões reais, da ideia ao primeiro cliente. Cada missão concluída vale pontos e te leva ao próximo nível.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : erro ? (
        <div className="card-surface rounded-2xl p-8 text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
        </div>
      ) : (
        <>
          <PainelNivel {...dados} />

          <div className="space-y-4">
            {dados.etapas.map((etapa) => (
              <Etapa key={etapa.id} etapa={etapa} progress={dados.progress}
                onToggle={onToggle} onNota={onNota} onRemover={onRemover} />
            ))}
          </div>

          {/* Missão própria */}
          <div className="card-surface rounded-2xl mt-4 overflow-hidden">
            {novaAberta ? (
              <div className="p-5 space-y-3">
                <h3 className="text-sm font-semibold">Nova missão</h3>
                <input
                  type="text" value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && criar()}
                  placeholder="O que você precisa fazer? (ex: Abrir CNPJ MEI)"
                  autoFocus
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                  style={{ color: 'var(--text-primary)' }}
                />
                <input
                  type="text" value={novaDescricao} onChange={(e) => setNovaDescricao(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && criar()}
                  placeholder="Por que isso importa? (opcional)"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                  style={{ color: 'var(--text-primary)' }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <select value={novaEtapa} onChange={(e) => setNovaEtapa(e.target.value)}
                    className="bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                    style={{ color: 'var(--text-primary)' }}>
                    {dados.etapas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                  <div className="flex items-center gap-1.5">
                    <input type="number" min="1" max="200" value={novosPontos}
                      onChange={(e) => setNovosPontos(e.target.value)}
                      className="w-20 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-2 py-2 text-sm text-center tabular-nums focus:outline-none focus:border-[var(--accent)]"
                      style={{ color: 'var(--text-primary)' }}
                    />
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>pontos</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <button onClick={() => setNovaAberta(false)}
                      className="px-3 py-2 rounded-lg text-sm font-medium"
                      style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
                    <button onClick={criar} disabled={!novoTitulo.trim() || salvando}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: 'var(--accent)' }}>
                      <Plus size={15} strokeWidth={2.4} /> Criar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setNovaAberta(true)}
                className="w-full px-5 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors hover:bg-[var(--bg-hover)]/40"
                style={{ color: 'var(--text-secondary)' }}>
                <Plus size={16} strokeWidth={2.4} /> Criar uma missão sua
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

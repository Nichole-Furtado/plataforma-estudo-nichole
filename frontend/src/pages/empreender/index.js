import { useState, useEffect, useCallback } from 'react';
import {
  Rocket, Check, Plus, Trash2, ChevronRight, Trophy, Target, StickyNote, X,
  Pencil, ChevronUp, ChevronDown, RotateCcw, FolderInput,
} from 'lucide-react';
import {
  fetchEmpreender, addEtapa, updateEtapa, removeEtapa, moverEtapa,
  addMissao, updateMissao, removeMissao, restaurarTrilha,
} from '@/lib/api';

const tint = (cor, pct) => `color-mix(in srgb, ${cor} ${pct}%, transparent)`;
const CAMPO = 'bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] transition-all';

// ── Cartão de nível ────────────────────────────────────────────────────────────

function PainelNivel({ pontos, pontosPossiveis, feitas, total, nivel, proximoNivel }) {
  const base = nivel?.minimo ?? 0;
  const alvo = proximoNivel?.minimo ?? Math.max(pontos, 1);
  const pct = proximoNivel
    ? Math.max(0, Math.min(100, Math.round(((pontos - base) / (alvo - base)) * 100)))
    : 100;

  return (
    <div className="card-surface rounded-2xl px-5 py-5 sm:px-6 sm:py-6 mb-6">
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
            <p className="text-2xl font-bold tabular-nums">
              {feitas}<span className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>/{total}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between text-xs mb-2">
        <span style={{ color: 'var(--text-secondary)' }}>
          {proximoNivel
            ? <>Faltam <strong style={{ color: 'var(--text-primary)' }}>{proximoNivel.minimo - pontos}</strong> pontos para {proximoNivel.nome}</>
            : <>Último nível alcançado — {pontos} de {pontosPossiveis} pontos possíveis</>}
        </span>
        <span className="tabular-nums font-semibold" style={{ color: 'var(--accent)' }}>{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))' }} />
      </div>
    </div>
  );
}

// ── Missão ─────────────────────────────────────────────────────────────────────

function Missao({ missao, estado, cor, etapas, etapaId, onToggle, onSalvar, onNota, onRemover }) {
  const feita = Boolean(estado?.done);
  const [modo, setModo] = useState(null); // 'editar' | 'nota' | null
  const [titulo, setTitulo] = useState(missao.titulo);
  const [descricao, setDescricao] = useState(missao.descricao || '');
  const [pontos, setPontos] = useState(String(missao.pontos));
  const [destino, setDestino] = useState(etapaId);
  const [nota, setNota] = useState(estado?.nota || '');

  useEffect(() => { setNota(estado?.nota || ''); }, [estado?.nota]);
  useEffect(() => {
    setTitulo(missao.titulo);
    setDescricao(missao.descricao || '');
    setPontos(String(missao.pontos));
    setDestino(etapaId);
  }, [missao.titulo, missao.descricao, missao.pontos, etapaId]);

  const salvarEdicao = () => {
    if (!titulo.trim()) return;
    onSalvar(missao.id, {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      pontos: parseInt(pontos, 10) || 0,
      ...(destino !== etapaId ? { etapaId: destino } : {}),
    });
    setModo(null);
  };

  if (modo === 'editar') {
    return (
      <li className="px-4 py-3 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
        <div className="space-y-2">
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') salvarEdicao(); if (e.key === 'Escape') setModo(null); }}
            autoFocus className={`w-full ${CAMPO} font-semibold`} style={{ color: 'var(--text-primary)' }} />
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2}
            placeholder="Por que essa missão importa?"
            className={`w-full ${CAMPO} resize-y`} style={{ color: 'var(--text-primary)' }} />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <input type="number" min="0" max="999" value={pontos} onChange={(e) => setPontos(e.target.value)}
                className={`w-20 ${CAMPO} text-center tabular-nums`} style={{ color: 'var(--text-primary)' }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>pontos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FolderInput size={14} style={{ color: 'var(--text-secondary)' }} />
              <select value={destino} onChange={(e) => setDestino(e.target.value)}
                className={CAMPO} style={{ color: 'var(--text-primary)' }}>
                {etapas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => setModo(null)} className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
              <button onClick={salvarEdicao} disabled={!titulo.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: 'var(--accent)' }}><Check size={15} strokeWidth={2.4} /> Salvar</button>
            </div>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="group px-4 py-3 rounded-xl transition-colors hover:bg-[var(--bg-hover)]/50"
      style={{ background: feita ? tint(cor, 7) : 'transparent' }}>
      <div className="flex items-start gap-3">
        <button onClick={() => onToggle(missao.id, !feita)}
          className="shrink-0 mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{ background: feita ? cor : 'transparent', borderColor: feita ? cor : 'var(--border)' }}
          title={feita ? 'Desmarcar' : 'Marcar como concluída'}>
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
              style={{ background: tint(cor, 14), color: cor }}>+{missao.pontos}</span>
          </div>

          {missao.descricao && (
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {missao.descricao}
            </p>
          )}

          {modo === 'nota' ? (
            <div className="mt-2.5 flex items-start gap-2">
              <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} autoFocus
                onKeyDown={(e) => { if (e.key === 'Escape') { setNota(estado?.nota || ''); setModo(null); } }}
                placeholder="O que você descobriu nessa missão?"
                className={`flex-1 ${CAMPO} text-xs resize-y`} style={{ color: 'var(--text-primary)' }} />
              <button onClick={() => { if ((estado?.nota || '') !== nota) onNota(missao.id, nota); setModo(null); }}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ color: 'var(--success)' }} title="Salvar"><Check size={15} /></button>
              <button onClick={() => { setNota(estado?.nota || ''); setModo(null); }}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ color: 'var(--text-secondary)' }} title="Cancelar"><X size={15} /></button>
            </div>
          ) : estado?.nota ? (
            <button onClick={() => setModo('nota')}
              className="mt-2 w-full text-left text-xs px-3 py-2 rounded-lg transition-colors hover:brightness-110"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
              <StickyNote size={11} className="inline mr-1.5 -mt-0.5" />{estado.nota}
            </button>
          ) : (
            <button onClick={() => setModo('nota')}
              className="mt-1.5 text-xs flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--text-secondary)' }}>
              <StickyNote size={11} /> anotar
            </button>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button onClick={() => setModo('editar')}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] transition-colors"
            title="Editar missão"><Pencil size={13} /></button>
          <button onClick={() => onRemover(missao.id, missao.titulo)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--bg-hover)] transition-colors"
            title="Remover missão"><Trash2 size={13} /></button>
        </div>
      </div>
    </li>
  );
}

// ── Etapa ──────────────────────────────────────────────────────────────────────

function Etapa({ etapa, etapas, indice, progress, cores, acoes }) {
  const [aberta, setAberta] = useState(true);
  const [editando, setEditando] = useState(false);
  const [novaMissao, setNovaMissao] = useState(false);
  const [nome, setNome] = useState(etapa.nome);
  const [descricao, setDescricao] = useState(etapa.descricao || '');
  const [cor, setCor] = useState(etapa.cor);
  const [mTitulo, setMTitulo] = useState('');
  const [mPontos, setMPontos] = useState('10');

  useEffect(() => {
    setNome(etapa.nome); setDescricao(etapa.descricao || ''); setCor(etapa.cor);
  }, [etapa.nome, etapa.descricao, etapa.cor]);

  const feitas = etapa.missoes.filter((m) => progress[m.id]?.done).length;
  const total = etapa.missoes.length;
  const pontos = etapa.missoes.filter((m) => progress[m.id]?.done).reduce((s, m) => s + m.pontos, 0);
  const possiveis = etapa.missoes.reduce((s, m) => s + m.pontos, 0);
  const pct = total ? Math.round((feitas / total) * 100) : 0;
  const completa = total > 0 && feitas === total;

  const salvarEtapa = () => {
    if (!nome.trim()) return;
    acoes.salvarEtapa(etapa.id, { nome: nome.trim(), descricao: descricao.trim(), cor });
    setEditando(false);
  };

  const criarMissao = () => {
    if (!mTitulo.trim()) return;
    acoes.criarMissao(etapa.id, { titulo: mTitulo.trim(), pontos: parseInt(mPontos, 10) || 10 });
    setMTitulo(''); setMPontos('10'); setNovaMissao(false);
  };

  return (
    <div className="card-surface rounded-2xl overflow-hidden">
      {editando ? (
        <div className="p-5 space-y-2">
          <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') salvarEtapa(); if (e.key === 'Escape') setEditando(false); }}
            className={`w-full ${CAMPO} font-semibold`} style={{ color: 'var(--text-primary)' }} />
          <input type="text" value={descricao} onChange={(e) => setDescricao(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') salvarEtapa(); }}
            placeholder="Do que se trata essa etapa?"
            className={`w-full ${CAMPO}`} style={{ color: 'var(--text-primary)' }} />
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              {cores.map((c) => (
                <button key={c} onClick={() => setCor(c)}
                  className="w-6 h-6 rounded-lg transition-transform hover:scale-110"
                  style={{ background: c, outline: c === cor ? '2px solid var(--text-primary)' : 'none', outlineOffset: 2 }}
                  title="Cor da etapa" />
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => setEditando(false)} className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
              <button onClick={salvarEtapa} disabled={!nome.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: 'var(--accent)' }}><Check size={15} strokeWidth={2.4} /> Salvar</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 flex items-center justify-between gap-3">
          <button onClick={() => setAberta((v) => !v)} className="flex items-center gap-3 min-w-0 text-left flex-1">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: tint(etapa.cor, 15), color: etapa.cor }}>
              {completa ? <Trophy size={17} strokeWidth={2.2} /> : <Target size={17} strokeWidth={2.2} />}
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold flex items-center gap-2">
                {etapa.nome}
                {completa && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: tint(etapa.cor, 16), color: etapa.cor }}>COMPLETA</span>
                )}
              </h2>
              {etapa.descricao && (
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{etapa.descricao}</p>
              )}
            </div>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs tabular-nums font-semibold" style={{ color: etapa.cor }}>{pontos}/{possiveis} pts</p>
              <p className="text-[11px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>{feitas} de {total}</p>
            </div>
            <div className="flex items-center gap-0.5">
              <button onClick={() => acoes.mover(etapa.id, 'cima')} disabled={indice === 0}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-25"
                title="Subir etapa"><ChevronUp size={14} /></button>
              <button onClick={() => acoes.mover(etapa.id, 'baixo')} disabled={indice === etapas.length - 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-25"
                title="Descer etapa"><ChevronDown size={14} /></button>
              <button onClick={() => setEditando(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-hover)] transition-colors"
                title="Editar etapa"><Pencil size={13} /></button>
              <button onClick={() => acoes.removerEtapa(etapa.id, etapa.nome, total)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--error)] hover:bg-[var(--bg-hover)] transition-colors"
                title="Remover etapa"><Trash2 size={13} /></button>
            </div>
            <button onClick={() => setAberta((v) => !v)}
              className="w-7 h-7 rounded-lg flex items-center justify-center" title={aberta ? 'Recolher' : 'Abrir'}>
              <ChevronRight size={16} style={{
                color: 'var(--text-secondary)',
                transform: aberta ? 'rotate(90deg)' : 'none',
                transition: 'transform .2s',
              }} />
            </button>
          </div>
        </div>
      )}

      <div className="h-1" style={{ background: 'var(--bg-secondary)' }}>
        <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: etapa.cor }} />
      </div>

      {aberta && (
        <>
          <ul className="p-2 space-y-1">
            {etapa.missoes.map((m) => (
              <Missao key={m.id} missao={m} estado={progress[m.id]} cor={etapa.cor}
                etapas={etapas} etapaId={etapa.id}
                onToggle={acoes.alternar} onSalvar={acoes.salvarMissao}
                onNota={acoes.anotar} onRemover={acoes.removerMissao} />
            ))}
            {etapa.missoes.length === 0 && !novaMissao && (
              <li className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                Nenhuma missão nessa etapa ainda.
              </li>
            )}
          </ul>

          {novaMissao ? (
            <div className="px-4 pb-4 flex flex-wrap items-center gap-2">
              <input type="text" value={mTitulo} onChange={(e) => setMTitulo(e.target.value)} autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') criarMissao(); if (e.key === 'Escape') setNovaMissao(false); }}
                placeholder="O que precisa ser feito?"
                className={`flex-1 min-w-[200px] ${CAMPO}`} style={{ color: 'var(--text-primary)' }} />
              <input type="number" min="0" max="999" value={mPontos} onChange={(e) => setMPontos(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') criarMissao(); }}
                className={`w-20 ${CAMPO} text-center tabular-nums`} style={{ color: 'var(--text-primary)' }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>pts</span>
              <button onClick={() => setNovaMissao(false)} className="px-3 py-2 rounded-lg text-sm"
                style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
              <button onClick={criarMissao} disabled={!mTitulo.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: etapa.cor }}><Plus size={15} strokeWidth={2.4} /> Adicionar</button>
            </div>
          ) : (
            <button onClick={() => setNovaMissao(true)}
              className="w-full px-5 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors hover:bg-[var(--bg-hover)]/40"
              style={{ color: 'var(--text-secondary)' }}>
              <Plus size={15} strokeWidth={2.4} /> Missão nesta etapa
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────

export default function EmpreenderPage() {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [novaEtapa, setNovaEtapa] = useState(false);
  const [eNome, setENome] = useState('');
  const [eDescricao, setEDescricao] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try { setDados(await fetchEmpreender()); setErro(null); }
    catch (err) { setErro(err.message || 'Não foi possível carregar as missões.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Toda rota devolve o estado completo, então a tela só troca o que veio.
  const aplicar = (res) => setDados((d) => ({ ...d, ...res }));
  const tentar = async (fn) => { try { aplicar(await fn()); } catch (err) { alert(err.message); } };

  const acoes = {
    alternar: (id, done) => tentar(() => updateMissao(id, { done })),
    anotar: (id, nota) => tentar(() => updateMissao(id, { nota })),
    salvarMissao: (id, data) => tentar(() => updateMissao(id, data)),
    criarMissao: (etapaId, data) => tentar(() => addMissao(etapaId, data)),
    removerMissao: (id, titulo) => {
      if (!confirm(`Remover a missão "${titulo}"?`)) return;
      tentar(() => removeMissao(id));
    },
    salvarEtapa: (id, data) => tentar(() => updateEtapa(id, data)),
    mover: (id, direcao) => tentar(() => moverEtapa(id, direcao)),
    removerEtapa: (id, nome, qtd) => {
      const aviso = qtd > 0
        ? `Remover a etapa "${nome}"? As ${qtd} missões dentro dela também serão apagadas.`
        : `Remover a etapa "${nome}"?`;
      if (!confirm(aviso)) return;
      tentar(() => removeEtapa(id));
    },
  };

  const criarEtapa = async () => {
    if (!eNome.trim()) return;
    await tentar(() => addEtapa({ nome: eNome.trim(), descricao: eDescricao.trim() }));
    setENome(''); setEDescricao(''); setNovaEtapa(false);
  };

  const restaurar = async () => {
    if (!confirm('Devolver as etapas e missões originais que você apagou?\n\nO que você criou e o seu progresso não são tocados.')) return;
    try {
      const res = await restaurarTrilha();
      aplicar(res);
      alert(res.etapasVoltaram || res.missoesVoltaram
        ? `Voltaram ${res.etapasVoltaram} etapa(s) e ${res.missoesVoltaram} missão(ões).`
        : 'Nada a restaurar — a trilha original está completa.');
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <Rocket size={20} strokeWidth={2.2} />
            </span>
            Empreender
          </h1>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
            Sua trilha, do seu jeito: tudo aqui dá para editar, renomear, mover e apagar.
          </p>
        </div>
        <button onClick={restaurar}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-secondary)' }}
          title="Devolve as etapas e missões originais que você apagou, sem mexer no que você criou">
          <RotateCcw size={14} /> Restaurar trilha original
        </button>
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
            {dados.etapas.map((etapa, i) => (
              <Etapa key={etapa.id} etapa={etapa} etapas={dados.etapas} indice={i}
                progress={dados.progress} cores={dados.cores || []} acoes={acoes} />
            ))}
          </div>

          <div className="card-surface rounded-2xl mt-4 overflow-hidden">
            {novaEtapa ? (
              <div className="p-5 space-y-2">
                <h3 className="text-sm font-semibold mb-1">Nova etapa</h3>
                <input type="text" value={eNome} onChange={(e) => setENome(e.target.value)} autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') criarEtapa(); if (e.key === 'Escape') setNovaEtapa(false); }}
                  placeholder="Nome da etapa (ex: Marketing, Produto, Jurídico)"
                  className={`w-full ${CAMPO}`} style={{ color: 'var(--text-primary)' }} />
                <input type="text" value={eDescricao} onChange={(e) => setEDescricao(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') criarEtapa(); }}
                  placeholder="Do que se trata? (opcional)"
                  className={`w-full ${CAMPO}`} style={{ color: 'var(--text-primary)' }} />
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button onClick={() => setNovaEtapa(false)} className="px-3 py-2 rounded-lg text-sm font-medium"
                    style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
                  <button onClick={criarEtapa} disabled={!eNome.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                    style={{ background: 'var(--accent)' }}><Plus size={15} strokeWidth={2.4} /> Criar etapa</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setNovaEtapa(true)}
                className="w-full px-5 py-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors hover:bg-[var(--bg-hover)]/40"
                style={{ color: 'var(--text-secondary)' }}>
                <Plus size={16} strokeWidth={2.4} /> Criar uma etapa sua
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

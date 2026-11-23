const express = require('express');
const router = express.Router();
const { state, persist } = require('../state');

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/**
 * O catálogo de missões mora no código, não no banco: assim dá para corrigir
 * um texto ou acrescentar missão sem migração, e o que fica guardado é só o
 * seu progresso. As missões que você mesma criar ficam em `custom`.
 */
const ETAPAS = [
  {
    id: 'ideia',
    nome: 'Ideia',
    descricao: 'Sair da ideia vaga para algo que dá para explicar em uma frase.',
    missoes: [
      { id: 'ideia-frase', titulo: 'Escreva sua ideia em uma frase', pontos: 10,
        descricao: 'O que você faz, para quem, e qual problema resolve. Se não couber numa frase, ainda está vaga.' },
      { id: 'ideia-dores', titulo: 'Liste 3 problemas que você já viveu', pontos: 10,
        descricao: 'Negócio costuma nascer de dor própria. Problema que você sentiu na pele você entende melhor que qualquer pesquisa.' },
      { id: 'ideia-publico', titulo: 'Escolha um público específico', pontos: 15,
        descricao: 'Troque "todo mundo" por um grupo que você consiga encontrar e falar com ele ainda esta semana.' },
      { id: 'ideia-concorrentes', titulo: 'Pesquise 3 concorrentes', pontos: 15,
        descricao: 'Quanto cobram, como vendem e o que os clientes reclamam deles. A reclamação é a sua brecha.' },
    ],
  },
  {
    id: 'validacao',
    nome: 'Validação',
    descricao: 'Descobrir se o problema existe para outras pessoas, antes de construir.',
    missoes: [
      { id: 'val-conversas', titulo: 'Converse com 5 pessoas do seu público', pontos: 30,
        descricao: 'Pergunte do problema delas, não da sua ideia. Quem pergunta "você compraria?" sempre ouve que sim.' },
      { id: 'val-surpresa', titulo: 'Anote o que te surpreendeu', pontos: 15,
        descricao: 'O que você ouviu e não esperava. É aí que mora a informação que vale dinheiro.' },
      { id: 'val-formulario', titulo: 'Monte uma lista de espera ou formulário', pontos: 20,
        descricao: 'Algo simples onde a pessoa deixa o contato. Interesse que não deixa rastro não é interesse.' },
      { id: 'val-dez', titulo: 'Consiga 10 interessados de verdade', pontos: 30,
        descricao: 'Dez pessoas que deixaram contato por vontade própria. Não valem amigos por gentileza.' },
    ],
  },
  {
    id: 'primeiro-cliente',
    nome: 'Primeiro cliente',
    descricao: 'Vender uma vez. É o marco que separa projeto de negócio.',
    missoes: [
      { id: 'cli-minimo', titulo: 'Defina a menor versão vendável', pontos: 25,
        descricao: 'O mínimo que já resolve o problema de alguém. Não precisa estar pronto, precisa resolver.' },
      { id: 'cli-oferta', titulo: 'Faça a primeira oferta para alguém', pontos: 30,
        descricao: 'Dizer o preço em voz alta para uma pessoa real. O desconforto aqui é normal e passa.' },
      { id: 'cli-pagamento', titulo: 'Receba o primeiro pagamento', pontos: 50,
        descricao: 'Dinheiro na conta. Elogio não paga conta; a primeira venda muda tudo o que você acha que sabe.' },
      { id: 'cli-depoimento', titulo: 'Peça um depoimento', pontos: 20,
        descricao: 'Pergunte o que quase impediu a compra. Essa resposta melhora sua oferta mais que qualquer curso.' },
    ],
  },
  {
    id: 'contas',
    nome: 'Preço e contas',
    descricao: 'Saber se o que você vende deixa dinheiro no fim do mês.',
    missoes: [
      { id: 'con-custo', titulo: 'Calcule seu custo por unidade', pontos: 25,
        descricao: 'Tudo que sai do bolso para entregar uma vez — inclusive as suas horas.' },
      { id: 'con-preco', titulo: 'Defina o preço e a margem', pontos: 25,
        descricao: 'Preço não é custo mais um pouco: é o que o problema vale para quem paga.' },
      { id: 'con-separar', titulo: 'Separe as contas pessoais das do negócio', pontos: 35,
        descricao: 'Enquanto estiver tudo junto, você não sabe se lucra. Vale até uma conta simples só para isso.' },
      { id: 'con-equilibrio', titulo: 'Descubra seu ponto de equilíbrio', pontos: 30,
        descricao: 'Quantas vendas por mês para empatar. Abaixo disso você está pagando para trabalhar.' },
    ],
  },
  {
    id: 'crescimento',
    nome: 'Crescimento',
    descricao: 'Transformar venda que aconteceu em venda que se repete.',
    missoes: [
      { id: 'cre-canal', titulo: 'Escreva como o cliente te encontra', pontos: 25,
        descricao: 'O caminho exato, do primeiro contato até o pagamento. Se você não sabe, não dá para repetir.' },
      { id: 'cre-repetir', titulo: 'Repita a venda com 3 clientes novos', pontos: 45,
        descricao: 'A primeira venda pode ser sorte. A quarta já é um padrão.' },
      { id: 'cre-delegar', titulo: 'Automatize ou delegue uma tarefa', pontos: 30,
        descricao: 'A tarefa chata que se repete toda semana. Enquanto tudo depende de você, não cresce.' },
      { id: 'cre-meta', titulo: 'Defina uma meta de 90 dias', pontos: 25,
        descricao: 'Um número só, com prazo. Meta sem número é desejo.' },
    ],
  },
];

const NIVEIS = [
  { nivel: 1, nome: 'Curioso', minimo: 0 },
  { nivel: 2, nome: 'Explorador', minimo: 60 },
  { nivel: 3, nome: 'Validador', minimo: 150 },
  { nivel: 4, nome: 'Vendedor', minimo: 260 },
  { nivel: 5, nome: 'Operador', minimo: 380 },
  { nivel: 6, nome: 'Empreendedor', minimo: 500 },
];

function getEmpreender() {
  if (!state.empreender || typeof state.empreender !== 'object') {
    state.empreender = { progress: {}, custom: [] };
  }
  if (!state.empreender.progress || typeof state.empreender.progress !== 'object') {
    state.empreender.progress = {};
  }
  if (!Array.isArray(state.empreender.custom)) state.empreender.custom = [];
  return state.empreender;
}

function parsePontos(value, fallback = 10) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(200, Math.round(n)));
}

/** Catálogo + as missões próprias, agrupado por etapa. */
function montarEtapas() {
  const { custom } = getEmpreender();
  return ETAPAS.map((etapa) => ({
    ...etapa,
    missoes: [
      ...etapa.missoes.map((m) => ({ ...m, propria: false })),
      ...custom
        .filter((m) => m.etapa === etapa.id)
        .map((m) => ({ ...m, propria: true })),
    ],
  }));
}

function calcular(etapas, progress) {
  let pontos = 0;
  let feitas = 0;
  let total = 0;
  let pontosPossiveis = 0;

  for (const etapa of etapas) {
    for (const m of etapa.missoes) {
      total++;
      pontosPossiveis += m.pontos;
      if (progress[m.id]?.done) {
        feitas++;
        pontos += m.pontos;
      }
    }
  }

  const atual = [...NIVEIS].reverse().find((n) => pontos >= n.minimo) || NIVEIS[0];
  const proximo = NIVEIS.find((n) => n.minimo > pontos) || null;

  return { pontos, pontosPossiveis, feitas, total, nivel: atual, proximoNivel: proximo };
}

// GET /api/empreender
router.get('/', (_req, res) => {
  const { progress } = getEmpreender();
  const etapas = montarEtapas();
  res.json({ etapas, progress, niveis: NIVEIS, ...calcular(etapas, progress) });
});

// PATCH /api/empreender/missao/:id  body: { done?, nota? }
router.patch('/missao/:id', async (req, res) => {
  const emp = getEmpreender();
  const etapas = montarEtapas();
  const existe = etapas.some((e) => e.missoes.some((m) => m.id === req.params.id));
  if (!existe) return res.status(404).json({ error: 'Missão não encontrada' });

  const atual = emp.progress[req.params.id] || { done: false, nota: '', completedAt: null };
  const { done, nota } = req.body;

  if (done !== undefined) {
    atual.done = Boolean(done);
    atual.completedAt = atual.done ? new Date().toISOString() : null;
  }
  if (nota !== undefined) atual.nota = String(nota);

  emp.progress[req.params.id] = atual;
  await persist('empreender');

  res.json({ missao: { id: req.params.id, ...atual }, ...calcular(etapas, emp.progress) });
});

// POST /api/empreender/missao  body: { titulo, descricao, etapa, pontos }
router.post('/missao', async (req, res) => {
  const { titulo, descricao, etapa, pontos } = req.body;
  if (!titulo || !String(titulo).trim())
    return res.status(400).json({ error: 'Título é obrigatório' });
  if (!ETAPAS.some((e) => e.id === etapa))
    return res.status(400).json({ error: 'Etapa inválida' });

  const emp = getEmpreender();
  const missao = {
    id: `propria-${makeId()}`,
    titulo: String(titulo).trim(),
    descricao: String(descricao || '').trim(),
    etapa,
    pontos: parsePontos(pontos, 10),
  };
  emp.custom.push(missao);
  await persist('empreender');

  const etapas = montarEtapas();
  res.json({ missao, etapas, ...calcular(etapas, emp.progress) });
});

// DELETE /api/empreender/missao/:id — só as suas próprias
router.delete('/missao/:id', async (req, res) => {
  const emp = getEmpreender();
  const antes = emp.custom.length;
  emp.custom = emp.custom.filter((m) => m.id !== req.params.id);
  if (emp.custom.length === antes)
    return res.status(404).json({ error: 'Só dá para remover missões que você criou' });

  delete emp.progress[req.params.id];
  await persist('empreender');

  const etapas = montarEtapas();
  res.json({ etapas, progress: emp.progress, ...calcular(etapas, emp.progress) });
});

module.exports = router;

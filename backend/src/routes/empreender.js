const express = require('express');
const router = express.Router();
const { state, persist } = require('../state');

function makeId(prefixo) {
  return `${prefixo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Paleta das etapas — ordem fixa, validada para fundo claro e escuro. */
const CORES = [
  '#7c7ff7', '#eb6834', '#1baf7a', '#eda100',
  '#e87ba4', '#34d07f', '#9085e9', '#f87171',
];

/**
 * Trilha inicial. Serve só para semear a primeira vez: a partir daí tudo
 * vira dado da Nichole, editável por ela — etapas inclusive. É o mesmo
 * caminho que os módulos de estudo já seguem.
 */
const TRILHA_INICIAL = [
  {
    id: 'ideia', nome: 'Ideia', cor: CORES[0],
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
    id: 'validacao', nome: 'Validação', cor: CORES[1],
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
    id: 'primeiro-cliente', nome: 'Primeiro cliente', cor: CORES[2],
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
    id: 'contas', nome: 'Preço e contas', cor: CORES[3],
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
    id: 'crescimento', nome: 'Crescimento', cor: CORES[4],
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

/** Níveis iniciais — também viram dado editável na primeira abertura. */
const NIVEIS_INICIAIS = [
  { id: 'nivel-curioso', nome: 'Curioso', minimo: 0 },
  { id: 'nivel-explorador', nome: 'Explorador', minimo: 60 },
  { id: 'nivel-validador', nome: 'Validador', minimo: 150 },
  { id: 'nivel-vendedor', nome: 'Vendedor', minimo: 260 },
  { id: 'nivel-operador', nome: 'Operador', minimo: 380 },
  { id: 'nivel-empreendedor', nome: 'Empreendedor', minimo: 500 },
];

function parseMinimo(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(99999, Math.round(n)));
}

/** Ordena por pontuação e numera na sequência — a ordem vem do mínimo. */
function niveisOrdenados(emp) {
  return [...emp.niveis]
    .sort((a, b) => a.minimo - b.minimo)
    .map((n, i) => ({ ...n, nivel: i + 1 }));
}

function parsePontos(value, fallback = 10) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(999, Math.round(n)));
}

function parseCor(value, fallback) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? String(value) : fallback;
}

/** Prazo no formato YYYY-MM-DD. String vazia limpa o prazo. */
function parsePrazo(value) {
  const v = String(value ?? '').trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : v;
}

/**
 * Garante a estrutura nova e migra quem está na antiga.
 *
 * Antes: o catálogo vinha do código e só as missões criadas por ela ficavam
 * guardadas, em `custom`. Agora as etapas inteiras são dado editável. A
 * migração mantém os mesmos ids das missões, então nenhum progresso se perde,
 * e traz as missões próprias para dentro da etapa a que pertenciam.
 */
async function garantir() {
  if (!state.empreender || typeof state.empreender !== 'object') state.empreender = {};
  const emp = state.empreender;
  if (!emp.progress || typeof emp.progress !== 'object') emp.progress = {};

  let mudou = false;

  // Os níveis viraram editáveis depois das etapas, então são semeados por
  // conta própria — quem já migrou as etapas antes também os recebe.
  if (!Array.isArray(emp.niveis) || emp.niveis.length === 0) {
    emp.niveis = NIVEIS_INICIAIS.map((n) => ({ ...n }));
    mudou = true;
  }

  if (Array.isArray(emp.etapas)) {
    if (mudou) await persist('empreender');
    return emp;
  }

  emp.etapas = TRILHA_INICIAL.map((e) => ({
    id: e.id,
    nome: e.nome,
    descricao: e.descricao,
    cor: e.cor,
    missoes: e.missoes.map((m) => ({ ...m })),
  }));

  for (const m of Array.isArray(emp.custom) ? emp.custom : []) {
    const destino = emp.etapas.find((e) => e.id === m.etapa) || emp.etapas[0];
    if (!destino) continue;
    destino.missoes.push({
      id: m.id,
      titulo: m.titulo,
      descricao: m.descricao || '',
      pontos: parsePontos(m.pontos, 10),
    });
  }
  delete emp.custom;

  await persist('empreender');
  return emp;
}

function acharMissao(emp, id) {
  for (const etapa of emp.etapas) {
    const missao = etapa.missoes.find((m) => m.id === id);
    if (missao) return { etapa, missao };
  }
  return null;
}

function calcular(emp) {
  let pontos = 0, feitas = 0, total = 0, pontosPossiveis = 0;
  for (const etapa of emp.etapas) {
    for (const m of etapa.missoes) {
      total++;
      pontosPossiveis += m.pontos;
      if (emp.progress[m.id]?.done) { feitas++; pontos += m.pontos; }
    }
  }
  const niveis = niveisOrdenados(emp);
  // O nível mais baixo é o piso, mesmo que o mínimo dele não seja zero.
  const atual = [...niveis].reverse().find((n) => pontos >= n.minimo) || niveis[0] || null;
  const proximo = niveis.find((n) => n.minimo > pontos) || null;
  return { pontos, pontosPossiveis, feitas, total, nivel: atual, proximoNivel: proximo };
}

function resposta(emp) {
  return {
    etapas: emp.etapas,
    progress: emp.progress,
    niveis: niveisOrdenados(emp),
    cores: CORES,
    ...calcular(emp),
  };
}

// ── Leitura ───────────────────────────────────────────────────────────────────

router.get('/', async (_req, res) => {
  res.json(resposta(await garantir()));
});

// ── Etapas ────────────────────────────────────────────────────────────────────

router.post('/etapa', async (req, res) => {
  const emp = await garantir();
  const { nome, descricao, cor } = req.body;
  if (!nome || !String(nome).trim())
    return res.status(400).json({ error: 'Nome da etapa é obrigatório' });

  const etapa = {
    id: makeId('etapa'),
    nome: String(nome).trim(),
    descricao: String(descricao || '').trim(),
    cor: parseCor(cor, CORES[emp.etapas.length % CORES.length]),
    missoes: [],
  };
  emp.etapas.push(etapa);
  await persist('empreender');
  res.json({ etapa, ...resposta(emp) });
});

router.patch('/etapa/:id', async (req, res) => {
  const emp = await garantir();
  const etapa = emp.etapas.find((e) => e.id === req.params.id);
  if (!etapa) return res.status(404).json({ error: 'Etapa não encontrada' });

  const { nome, descricao, cor } = req.body;
  if (nome !== undefined && String(nome).trim()) etapa.nome = String(nome).trim();
  if (descricao !== undefined) etapa.descricao = String(descricao).trim();
  if (cor !== undefined) etapa.cor = parseCor(cor, etapa.cor);

  await persist('empreender');
  res.json({ etapa, ...resposta(emp) });
});

// Remove a etapa e tudo que estava dentro dela.
router.delete('/etapa/:id', async (req, res) => {
  const emp = await garantir();
  const etapa = emp.etapas.find((e) => e.id === req.params.id);
  if (!etapa) return res.status(404).json({ error: 'Etapa não encontrada' });

  for (const m of etapa.missoes) delete emp.progress[m.id];
  emp.etapas = emp.etapas.filter((e) => e.id !== req.params.id);

  await persist('empreender');
  res.json({ removidas: etapa.missoes.length, ...resposta(emp) });
});

// Sobe ou desce a etapa na trilha. body: { direcao: 'cima' | 'baixo' }
router.patch('/etapa/:id/mover', async (req, res) => {
  const emp = await garantir();
  const i = emp.etapas.findIndex((e) => e.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Etapa não encontrada' });

  const destino = req.body.direcao === 'cima' ? i - 1 : i + 1;
  if (destino < 0 || destino >= emp.etapas.length) return res.json(resposta(emp));

  const [etapa] = emp.etapas.splice(i, 1);
  emp.etapas.splice(destino, 0, etapa);

  await persist('empreender');
  res.json(resposta(emp));
});

// ── Níveis ────────────────────────────────────────────────────────────────────

router.post('/nivel', async (req, res) => {
  const emp = await garantir();
  const { nome, minimo } = req.body;
  if (!nome || !String(nome).trim())
    return res.status(400).json({ error: 'Nome do nível é obrigatório' });

  const nivel = {
    id: makeId('nivel'),
    nome: String(nome).trim(),
    minimo: parseMinimo(minimo, 0),
  };
  emp.niveis.push(nivel);
  await persist('empreender');
  // `nivelCriado`, e não `nivel`: resposta() já traz `nivel` com o nível
  // atual da pessoa, e o espalhamento sobrescreveria este aqui.
  res.json({ nivelCriado: nivel, ...resposta(emp) });
});

router.patch('/nivel/:id', async (req, res) => {
  const emp = await garantir();
  const nivel = emp.niveis.find((n) => n.id === req.params.id);
  if (!nivel) return res.status(404).json({ error: 'Nível não encontrado' });

  const { nome, minimo } = req.body;
  if (nome !== undefined && String(nome).trim()) nivel.nome = String(nome).trim();
  if (minimo !== undefined) nivel.minimo = parseMinimo(minimo, nivel.minimo);

  await persist('empreender');
  res.json({ nivelAtualizado: nivel, ...resposta(emp) });
});

router.delete('/nivel/:id', async (req, res) => {
  const emp = await garantir();
  if (emp.niveis.length <= 1)
    return res.status(400).json({ error: 'Deixe pelo menos um nível' });

  const antes = emp.niveis.length;
  emp.niveis = emp.niveis.filter((n) => n.id !== req.params.id);
  if (emp.niveis.length === antes)
    return res.status(404).json({ error: 'Nível não encontrado' });

  await persist('empreender');
  res.json(resposta(emp));
});

// ── Missões ───────────────────────────────────────────────────────────────────

router.post('/etapa/:etapaId/missao', async (req, res) => {
  const emp = await garantir();
  const etapa = emp.etapas.find((e) => e.id === req.params.etapaId);
  if (!etapa) return res.status(404).json({ error: 'Etapa não encontrada' });

  const { titulo, descricao, pontos, prazo } = req.body;
  if (!titulo || !String(titulo).trim())
    return res.status(400).json({ error: 'Título é obrigatório' });

  const missao = {
    id: makeId('missao'),
    titulo: String(titulo).trim(),
    descricao: String(descricao || '').trim(),
    pontos: parsePontos(pontos, 10),
    prazo: parsePrazo(prazo),
  };
  etapa.missoes.push(missao);
  await persist('empreender');
  res.json({ missao, ...resposta(emp) });
});

// Edita qualquer missão — inclusive as que vieram na trilha inicial.
// body: { titulo?, descricao?, pontos?, done?, nota?, etapaId? }
router.patch('/missao/:id', async (req, res) => {
  const emp = await garantir();
  const achado = acharMissao(emp, req.params.id);
  if (!achado) return res.status(404).json({ error: 'Missão não encontrada' });
  const { etapa, missao } = achado;
  const { titulo, descricao, pontos, prazo, done, nota, etapaId } = req.body;

  if (titulo !== undefined && String(titulo).trim()) missao.titulo = String(titulo).trim();
  if (descricao !== undefined) missao.descricao = String(descricao).trim();
  if (pontos !== undefined) missao.pontos = parsePontos(pontos, missao.pontos);
  if (prazo !== undefined) missao.prazo = parsePrazo(prazo);

  // Mudar de etapa: tira de uma lista e põe na outra.
  if (etapaId !== undefined && etapaId !== etapa.id) {
    const destino = emp.etapas.find((e) => e.id === etapaId);
    if (!destino) return res.status(400).json({ error: 'Etapa de destino não existe' });
    etapa.missoes = etapa.missoes.filter((m) => m.id !== missao.id);
    destino.missoes.push(missao);
  }

  if (done !== undefined || nota !== undefined) {
    const atual = emp.progress[missao.id] || { done: false, nota: '', completedAt: null };
    if (done !== undefined) {
      atual.done = Boolean(done);
      atual.completedAt = atual.done ? new Date().toISOString() : null;
    }
    if (nota !== undefined) atual.nota = String(nota);
    emp.progress[missao.id] = atual;
  }

  await persist('empreender');
  res.json({ missao, progressoMissao: emp.progress[missao.id] || null, ...resposta(emp) });
});

router.delete('/missao/:id', async (req, res) => {
  const emp = await garantir();
  const achado = acharMissao(emp, req.params.id);
  if (!achado) return res.status(404).json({ error: 'Missão não encontrada' });

  achado.etapa.missoes = achado.etapa.missoes.filter((m) => m.id !== req.params.id);
  delete emp.progress[req.params.id];

  await persist('empreender');
  res.json(resposta(emp));
});

// Restaura a trilha inicial sem apagar o que ela criou nem o progresso:
// devolve só as etapas e missões de fábrica que tiverem sido removidas.
router.post('/restaurar', async (req, res) => {
  const emp = await garantir();
  let etapasVoltaram = 0, missoesVoltaram = 0, niveisVoltaram = 0;

  for (const base of NIVEIS_INICIAIS) {
    if (!emp.niveis.some((n) => n.id === base.id)) {
      emp.niveis.push({ ...base });
      niveisVoltaram++;
    }
  }

  for (const base of TRILHA_INICIAL) {
    let etapa = emp.etapas.find((e) => e.id === base.id);
    if (!etapa) {
      etapa = { id: base.id, nome: base.nome, descricao: base.descricao, cor: base.cor, missoes: [] };
      emp.etapas.push(etapa);
      etapasVoltaram++;
    }
    for (const m of base.missoes) {
      if (!acharMissao(emp, m.id)) {
        etapa.missoes.push({ ...m });
        missoesVoltaram++;
      }
    }
  }

  await persist('empreender');
  res.json({ etapasVoltaram, missoesVoltaram, niveisVoltaram, ...resposta(emp) });
});

module.exports = router;

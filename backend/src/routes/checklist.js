const express = require('express');
const router = express.Router();
const { state, persist } = require('../state');

const checklist = () => state.checklist;

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const pad = (n) => String(n).padStart(2, '0');

/**
 * Formato de um hábito:
 *   { id, name, type: 'boa' | 'ruim', points: number }
 * Hábitos criados antes dessa mudança não têm type/points — são lidos como
 * 'boa' e 1 ponto, sem precisar reescrever nada no banco.
 */
function normalizeHabit(h) {
  return {
    ...h,
    type: h.type === 'ruim' ? 'ruim' : 'boa',
    points: Number.isFinite(h.points) ? h.points : 1,
  };
}

function parsePoints(value, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(999, Math.round(n)));
}

/**
 * Marcações de um hábito dentro de uma semana:
 *   { done: [0..6], miss: [0..6] }
 * O formato antigo era só um array com os dias feitos. A leitura aceita os
 * dois; a gravação sempre usa o formato novo. Assim os dados já existentes
 * continuam valendo e vão migrando conforme forem tocados.
 */
function normalizeEntry(entry) {
  if (Array.isArray(entry)) return { done: [...entry], miss: [] };
  return {
    done: Array.isArray(entry?.done) ? [...entry.done] : [],
    miss: Array.isArray(entry?.miss) ? [...entry.miss] : [],
  };
}

function getWeek(weekKey) {
  if (!checklist().weeks) checklist().weeks = {};
  if (!checklist().weeks[weekKey]) checklist().weeks[weekKey] = {};
  return checklist().weeks[weekKey];
}

/** Estado de um dia: 'done' | 'miss' | 'none'. */
function dayState(weekKey, habitId, dayIdx) {
  const entry = normalizeEntry((checklist().weeks || {})[weekKey]?.[habitId]);
  if (entry.done.includes(dayIdx)) return 'done';
  if (entry.miss.includes(dayIdx)) return 'miss';
  return 'none';
}

/** Dia do mês -> semana (segunda) + índice do dia (0=Seg … 6=Dom). */
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

/**
 * Pontuação de uma marcação.
 *   hábito bom:  feito = +pontos, não feito = -pontos
 *   hábito ruim: feito = -pontos, não feito = +pontos
 * "Erro" é toda marcação que tira pontos.
 */
function scoreFor(habit, st) {
  if (st === 'none') return 0;
  const good = habit.type !== 'ruim';
  const positive = good ? st === 'done' : st === 'miss';
  return positive ? habit.points : -habit.points;
}

// ── Hábitos ───────────────────────────────────────────────────────────────────

router.get('/habits', (_req, res) => {
  res.json((checklist().habits || []).map(normalizeHabit));
});

router.post('/habits', async (req, res) => {
  const { name, type, points } = req.body;
  if (!name || !String(name).trim())
    return res.status(400).json({ error: 'Nome é obrigatório' });

  const habit = {
    id: makeId(),
    name: String(name).trim(),
    type: type === 'ruim' ? 'ruim' : 'boa',
    points: parsePoints(points, 1),
  };
  checklist().habits.push(habit);
  await persist('checklist');
  res.json({ habit, habits: checklist().habits.map(normalizeHabit) });
});

router.patch('/habits/:id', async (req, res) => {
  const habit = checklist().habits.find((h) => h.id === req.params.id);
  if (!habit) return res.status(404).json({ error: 'Hábito não encontrado' });

  const { name, type, points } = req.body;
  if (name !== undefined) habit.name = String(name).trim();
  if (type !== undefined) habit.type = type === 'ruim' ? 'ruim' : 'boa';
  if (points !== undefined) habit.points = parsePoints(points, habit.points ?? 1);

  await persist('checklist');
  res.json({ habit: normalizeHabit(habit), habits: checklist().habits.map(normalizeHabit) });
});

router.delete('/habits/:id', async (req, res) => {
  const before = checklist().habits.length;
  checklist().habits = checklist().habits.filter((h) => h.id !== req.params.id);
  if (checklist().habits.length === before)
    return res.status(404).json({ error: 'Hábito não encontrado' });
  await persist('checklist');
  res.json({ habits: checklist().habits.map(normalizeHabit) });
});

// ── Resumo mensal de pontos ───────────────────────────────────────────────────
// Precisa vir antes de /week/:weekKey para não ser capturado por ela.

// GET /api/checklist/summary?from=YYYY-MM&months=12
router.get('/summary', (req, res) => {
  const from = String(req.query.from || '');
  const months = Math.max(1, Math.min(24, parseInt(req.query.months, 10) || 6));
  const m = from.match(/^(\d{4})-(\d{2})$/);
  if (!m) return res.status(400).json({ error: 'Parâmetro "from" deve ser YYYY-MM' });

  const baseYear = Number(m[1]);
  const baseMonth = Number(m[2]);
  const habits = (checklist().habits || []).map(normalizeHabit);

  // Do mês mais antigo até o mês informado.
  const result = [];
  for (let offset = months - 1; offset >= 0; offset--) {
    const d = new Date(baseYear, baseMonth - 1 - offset, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    let points = 0, done = 0, miss = 0, errors = 0, maxPoints = 0;
    for (const habit of habits) {
      maxPoints += habit.points * daysInMonth;
      for (let day = 1; day <= daysInMonth; day++) {
        const { weekKey, dayIdx } = dayRef(year, month, day);
        const st = dayState(weekKey, habit.id, dayIdx);
        if (st === 'none') continue;
        if (st === 'done') done++; else miss++;
        const s = scoreFor(habit, st);
        points += s;
        if (s < 0) errors++;
      }
    }
    result.push({
      yearMonth: `${year}-${pad(month)}`,
      daysInMonth,
      points,
      maxPoints,
      done,
      miss,
      errors,
      marks: done + miss,
    });
  }

  res.json({ months: result, habits: habits.length });
});

// ── Semanas ───────────────────────────────────────────────────────────────────

// Sem ?full=1 responde no formato antigo (só a lista de dias feitos), para
// que qualquer tela já aberta no navegador continue funcionando.
router.get('/week/:weekKey', (req, res) => {
  const raw = (checklist().weeks || {})[req.params.weekKey] || {};
  const full = req.query.full === '1';
  const out = {};
  for (const [habitId, entry] of Object.entries(raw)) {
    const e = normalizeEntry(entry);
    out[habitId] = full ? e : e.done;
  }
  res.json(out);
});

// PATCH /api/checklist/week/:weekKey/set
// body: { habitId, day (0..6), state: 'none' | 'done' | 'miss' }
router.patch('/week/:weekKey/set', async (req, res) => {
  const { habitId, day, state: nextState } = req.body;
  if (!habitId || day === undefined)
    return res.status(400).json({ error: 'habitId e day são obrigatórios' });
  if (!['none', 'done', 'miss'].includes(nextState))
    return res.status(400).json({ error: 'state deve ser none, done ou miss' });

  const week = getWeek(req.params.weekKey);
  const entry = normalizeEntry(week[habitId]);
  const d = Number(day);

  entry.done = entry.done.filter((x) => x !== d);
  entry.miss = entry.miss.filter((x) => x !== d);
  if (nextState === 'done') entry.done.push(d);
  if (nextState === 'miss') entry.miss.push(d);

  week[habitId] = entry;
  await persist('checklist');

  const out = {};
  for (const [id, e] of Object.entries(week)) out[id] = normalizeEntry(e);
  res.json({ week: out });
});

// Rota antiga: alterna entre feito e nada, e responde no formato antigo.
// Mantida para não quebrar nenhuma versão da tela ainda aberta no navegador.
router.patch('/week/:weekKey/toggle', async (req, res) => {
  const { habitId, day } = req.body;
  if (!habitId || day === undefined)
    return res.status(400).json({ error: 'habitId e day são obrigatórios' });

  const week = getWeek(req.params.weekKey);
  const entry = normalizeEntry(week[habitId]);
  const d = Number(day);

  if (entry.done.includes(d)) entry.done = entry.done.filter((x) => x !== d);
  else {
    entry.done.push(d);
    entry.miss = entry.miss.filter((x) => x !== d);
  }

  week[habitId] = entry;
  await persist('checklist');

  const out = {};
  for (const [id, e] of Object.entries(week)) out[id] = normalizeEntry(e).done;
  res.json({ week: out });
});

module.exports = router;

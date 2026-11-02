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

// ── Rotina do dia (24 horas) ──────────────────────────────────────────────────
// Guardada dentro de checklist.routine:
//   { activities: [{id, name}], days: { "YYYY-MM-DD": { activityId: horas } } }

function getRoutine() {
  const c = checklist();
  if (!c.routine || typeof c.routine !== 'object') c.routine = { activities: [], days: {} };
  if (!Array.isArray(c.routine.activities)) c.routine.activities = [];
  if (!c.routine.days || typeof c.routine.days !== 'object') c.routine.days = {};
  return c.routine;
}

// Guarda em horas decimais, arredondando para o minuto mais próximo —
// assim 40min vira 0.6667 e volta como 40min, sem virar meia hora.
function parseHours(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(24, Math.round(n * 60) / 60);
}

// GET /api/checklist/routine?month=YYYY-MM
router.get('/routine', (req, res) => {
  const routine = getRoutine();
  const m = String(req.query.month || '').match(/^(\d{4})-(\d{2})$/);
  if (!m) return res.status(400).json({ error: 'Parâmetro "month" deve ser YYYY-MM' });

  const year = Number(m[1]);
  const month = Number(m[2]);
  const daysInMonth = new Date(year, month, 0).getDate();

  const days = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${pad(month)}-${pad(d)}`;
    if (routine.days[key]) days[String(d)] = routine.days[key];
  }

  // Média considerando só os dias preenchidos — dividir por 30 quando você
  // lançou 4 dias daria um retrato errado da rotina.
  const filled = Object.keys(days);
  const totals = {};
  for (const d of filled) {
    for (const [actId, hours] of Object.entries(days[d] || {})) {
      totals[actId] = (totals[actId] || 0) + Number(hours || 0);
    }
  }
  const average = {};
  if (filled.length > 0) {
    for (const [actId, sum] of Object.entries(totals)) {
      // Arredonda no minuto, não no décimo de hora, senão 35min viraria 36min.
      average[actId] = Math.round((sum / filled.length) * 60) / 60;
    }
  }

  res.json({
    activities: routine.activities,
    days,
    average,
    filledDays: filled.length,
    daysInMonth,
  });
});

router.post('/routine/activities', async (req, res) => {
  const { name } = req.body;
  if (!name || !String(name).trim())
    return res.status(400).json({ error: 'Nome é obrigatório' });
  const routine = getRoutine();
  const activity = { id: makeId(), name: String(name).trim() };
  routine.activities.push(activity);
  await persist('checklist');
  res.json({ activity, activities: routine.activities });
});

router.patch('/routine/activities/:id', async (req, res) => {
  const routine = getRoutine();
  const activity = routine.activities.find((a) => a.id === req.params.id);
  if (!activity) return res.status(404).json({ error: 'Atividade não encontrada' });
  const { name } = req.body;
  if (name !== undefined) activity.name = String(name).trim();
  await persist('checklist');
  res.json({ activity, activities: routine.activities });
});

router.delete('/routine/activities/:id', async (req, res) => {
  const routine = getRoutine();
  const before = routine.activities.length;
  routine.activities = routine.activities.filter((a) => a.id !== req.params.id);
  if (routine.activities.length === before)
    return res.status(404).json({ error: 'Atividade não encontrada' });
  // Remove as horas lançadas dessa atividade em todos os dias.
  for (const key of Object.keys(routine.days)) {
    if (routine.days[key] && routine.days[key][req.params.id] !== undefined) {
      delete routine.days[key][req.params.id];
      if (Object.keys(routine.days[key]).length === 0) delete routine.days[key];
    }
  }
  await persist('checklist');
  res.json({ activities: routine.activities });
});

// PATCH /api/checklist/routine/day/:date   body: { activityId, hours }
router.patch('/routine/day/:date', async (req, res) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.params.date))
    return res.status(400).json({ error: 'Data deve ser YYYY-MM-DD' });
  const { activityId, hours } = req.body;
  if (!activityId) return res.status(400).json({ error: 'activityId é obrigatório' });

  const routine = getRoutine();
  if (!routine.activities.some((a) => a.id === activityId))
    return res.status(404).json({ error: 'Atividade não encontrada' });

  const day = routine.days[req.params.date] || {};
  const h = parseHours(hours);
  if (h > 0) day[activityId] = h;
  else delete day[activityId];

  if (Object.keys(day).length > 0) routine.days[req.params.date] = day;
  else delete routine.days[req.params.date];

  await persist('checklist');
  res.json({ date: req.params.date, day: routine.days[req.params.date] || {} });
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

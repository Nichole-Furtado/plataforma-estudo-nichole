const express = require('express');
const router = express.Router();
const { state, persist } = require('../state');

/**
 * Relatório mensal (Habit Tracker), persistido via store (MongoDB ou arquivo).
 * Estrutura: { "2026-03": { subjects: [...], entries: { "Python": { "1": true } } } }
 */
const tracker = () => state.tracker;

// GET /api/tracker/:yearMonth — retorna dados do mês (ex: 2026-03)
router.get('/:yearMonth', (req, res) => {
  const data = tracker()[req.params.yearMonth] || { subjects: [], entries: {} };
  res.json(data);
});

// PUT /api/tracker/:yearMonth — sobrescreve dados do mês inteiro
router.put('/:yearMonth', async (req, res) => {
  const { yearMonth } = req.params;
  const { subjects, entries } = req.body;
  tracker()[yearMonth] = { subjects: subjects || [], entries: entries || {} };
  await persist('tracker');
  res.json({ message: 'Tracker salvo', data: tracker()[yearMonth] });
});

// POST /api/tracker/:yearMonth/subject — adiciona uma matéria
router.post('/:yearMonth/subject', async (req, res) => {
  const { yearMonth } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Nome da matéria é obrigatório' });

  if (!tracker()[yearMonth]) {
    tracker()[yearMonth] = { subjects: [], entries: {} };
  }

  const trimmed = name.trim();
  if (tracker()[yearMonth].subjects.includes(trimmed)) {
    return res.status(409).json({ error: 'Matéria já existe neste mês' });
  }

  tracker()[yearMonth].subjects.push(trimmed);
  tracker()[yearMonth].entries[trimmed] = {};
  await persist('tracker');
  res.json({ message: 'Matéria adicionada', data: tracker()[yearMonth] });
});

// DELETE /api/tracker/:yearMonth/subject/:name — remove uma matéria
router.delete('/:yearMonth/subject/:name', async (req, res) => {
  const { yearMonth, name } = req.params;
  if (!tracker()[yearMonth]) return res.status(404).json({ error: 'Mês não encontrado' });

  const decoded = decodeURIComponent(name);
  tracker()[yearMonth].subjects = tracker()[yearMonth].subjects.filter((s) => s !== decoded);
  delete tracker()[yearMonth].entries[decoded];
  await persist('tracker');
  res.json({ message: 'Matéria removida', data: tracker()[yearMonth] });
});

// PATCH /api/tracker/:yearMonth/toggle — marca/desmarca um dia
router.patch('/:yearMonth/toggle', async (req, res) => {
  const { yearMonth } = req.params;
  const { subject, day } = req.body;
  if (!subject || !day) return res.status(400).json({ error: 'Subject e day são obrigatórios' });

  if (!tracker()[yearMonth]) {
    tracker()[yearMonth] = { subjects: [], entries: {} };
  }
  if (!tracker()[yearMonth].entries[subject]) {
    tracker()[yearMonth].entries[subject] = {};
  }

  const current = tracker()[yearMonth].entries[subject][String(day)] || false;
  tracker()[yearMonth].entries[subject][String(day)] = !current;

  await persist('tracker');
  res.json({
    message: 'Toggled',
    subject,
    day,
    value: !current,
    data: tracker()[yearMonth],
  });
});

module.exports = router;

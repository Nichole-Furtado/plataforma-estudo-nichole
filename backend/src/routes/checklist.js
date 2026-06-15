const express = require('express');
const router = express.Router();
const { state, persist } = require('../state');

const checklist = () => state.checklist;

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// GET /api/checklist/habits
router.get('/habits', (_req, res) => {
  res.json(checklist().habits || []);
});

// POST /api/checklist/habits
router.post('/habits', async (req, res) => {
  const { name } = req.body;
  if (!name || !String(name).trim())
    return res.status(400).json({ error: 'Nome é obrigatório' });
  const habit = { id: makeId(), name: String(name).trim() };
  checklist().habits.push(habit);
  await persist('checklist');
  res.json({ habit, habits: checklist().habits });
});

// PATCH /api/checklist/habits/:id
router.patch('/habits/:id', async (req, res) => {
  const habit = checklist().habits.find((h) => h.id === req.params.id);
  if (!habit) return res.status(404).json({ error: 'Hábito não encontrado' });
  const { name } = req.body;
  if (name !== undefined) habit.name = String(name).trim();
  await persist('checklist');
  res.json({ habit, habits: checklist().habits });
});

// DELETE /api/checklist/habits/:id
router.delete('/habits/:id', async (req, res) => {
  const before = checklist().habits.length;
  checklist().habits = checklist().habits.filter((h) => h.id !== req.params.id);
  if (checklist().habits.length === before)
    return res.status(404).json({ error: 'Hábito não encontrado' });
  await persist('checklist');
  res.json({ habits: checklist().habits });
});

// GET /api/checklist/week/:weekKey   (weekKey = "YYYY-MM-DD" da segunda-feira)
router.get('/week/:weekKey', (req, res) => {
  const data = (checklist().weeks || {})[req.params.weekKey] || {};
  res.json(data);
});

// PATCH /api/checklist/week/:weekKey/toggle
// body: { habitId, day }  (day = 0..6, 0=Seg … 6=Dom)
router.patch('/week/:weekKey/toggle', async (req, res) => {
  const { weekKey } = req.params;
  const { habitId, day } = req.body;

  if (!checklist().weeks) checklist().weeks = {};
  if (!checklist().weeks[weekKey]) checklist().weeks[weekKey] = {};

  const week = checklist().weeks[weekKey];
  if (!week[habitId]) week[habitId] = [];

  const idx = week[habitId].indexOf(day);
  if (idx === -1) week[habitId].push(day);
  else week[habitId].splice(idx, 1);

  await persist('checklist');
  res.json({ week });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { state, persist } = require('../state');

const lembretes = () => state.lembretes;

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// GET /api/lembretes
router.get('/', (_req, res) => {
  res.json(lembretes());
});

// POST /api/lembretes — cria lembrete
router.post('/', async (req, res) => {
  const { text } = req.body;
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'Texto é obrigatório' });
  }
  const item = {
    id: makeId(),
    text: String(text).trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  lembretes().push(item);
  await persist('lembretes');
  res.json({ item, lembretes: lembretes() });
});

// PATCH /api/lembretes/:id — edita texto ou toggle completed
router.patch('/:id', async (req, res) => {
  const item = lembretes().find((l) => l.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Lembrete não encontrado' });

  const { text, completed } = req.body;
  if (text !== undefined) item.text = String(text).trim();
  if (completed !== undefined) {
    item.completed = Boolean(completed);
    item.completedAt = item.completed ? new Date().toISOString() : null;
  }
  await persist('lembretes');
  res.json({ item, lembretes: lembretes() });
});

// DELETE /api/lembretes/:id
router.delete('/:id', async (req, res) => {
  const before = lembretes().length;
  state.lembretes = lembretes().filter((l) => l.id !== req.params.id);
  if (state.lembretes.length === before) {
    return res.status(404).json({ error: 'Lembrete não encontrado' });
  }
  await persist('lembretes');
  res.json({ lembretes: state.lembretes });
});

// DELETE /api/lembretes/concluidos — limpa todos os concluídos
router.delete('/concluidos/all', async (_req, res) => {
  state.lembretes = lembretes().filter((l) => !l.completed);
  await persist('lembretes');
  res.json({ lembretes: state.lembretes });
});

module.exports = router;

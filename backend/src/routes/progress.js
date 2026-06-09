const express = require('express');
const router = express.Router();
const { state, persist } = require('../state');

/**
 * Progresso do usuário, persistido via store (MongoDB ou arquivo).
 * Estrutura: { lessonId: { completed, code, notes, completedAt, updatedAt } }
 */

// GET /api/progress — retorna todo o progresso
router.get('/', (_req, res) => {
  res.json(state.progress);
});

// POST /api/progress/:lessonId — salva/atualiza progresso
router.post('/:lessonId', async (req, res) => {
  const { lessonId } = req.params;
  const { completed, code, notes } = req.body;
  
  state.progress[lessonId] = {
    completed: completed ?? false,
    code: code || '',
    notes: notes !== undefined ? notes : (state.progress[lessonId]?.notes || ''),
    completedAt: completed ? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  };

  await persist('progress');
  res.json({ message: 'Progresso salvo', progress: state.progress[lessonId] });
});

// DELETE /api/progress — reseta todo o progresso
router.delete('/', async (_req, res) => {
  state.progress = {};
  await persist('progress');
  res.json({ message: 'Progresso resetado' });
});

module.exports = router;

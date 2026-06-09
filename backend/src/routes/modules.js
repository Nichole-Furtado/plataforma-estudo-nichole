const express = require('express');
const router = express.Router();
const { state } = require('../state');

// GET /api/modules — lista todos os módulos (sem conteúdo das lições)
router.get('/', (_req, res) => {
  const summary = state.modules.map(({ id, title, description, language, icon, order, lessons }) => ({
    id,
    title,
    description,
    language,
    icon,
    order,
    lessonCount: lessons.length,
    lessons: lessons.map(({ id, title, description }) => ({ id, title, description })),
  }));
  res.json(summary);
});

// GET /api/modules/:moduleId — detalhes de um módulo
router.get('/:moduleId', (req, res) => {
  const mod = state.modules.find((m) => m.id === req.params.moduleId);
  if (!mod) return res.status(404).json({ error: 'Módulo não encontrado' });

  res.json({
    ...mod,
    lessons: mod.lessons.map(({ id, title, description }) => ({ id, title, description })),
  });
});

// GET /api/modules/:moduleId/lessons/:lessonId — detalhes de uma lição
router.get('/:moduleId/lessons/:lessonId', (req, res) => {
  const mod = state.modules.find((m) => m.id === req.params.moduleId);
  if (!mod) return res.status(404).json({ error: 'Módulo não encontrado' });

  const lesson = mod.lessons.find((l) => l.id === req.params.lessonId);
  if (!lesson) return res.status(404).json({ error: 'Lição não encontrada' });

  res.json({
    ...lesson,
    moduleId: mod.id,
    moduleTitle: mod.title,
    language: mod.language,
  });
});

module.exports = router;

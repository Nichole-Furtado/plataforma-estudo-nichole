const express = require('express');
const router = express.Router();
const { state, persist } = require('../state');
const { v4: uuidv4 } = require('uuid');

const modules = () => state.modules;

// POST /api/admin/modules — cria um novo módulo
router.post('/modules', async (req, res) => {
  const { title, description, language, icon, startDate, endDate } = req.body;
  if (!title || !language) {
    return res.status(400).json({ error: 'Título e linguagem são obrigatórios' });
  }

  const id = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 40) + '-' + uuidv4().substring(0, 6);

  const langLower = language.toLowerCase();
  const defaultIcon = langLower === 'python' ? '🐍' : langLower === 'javascript' ? '💛' : langLower === 'html' ? '🌐' : langLower === 'css' ? '🎨' : langLower === 'sql' ? '🗄️' : '📘';

  const newModule = {
    id,
    title: title.trim(),
    description: (description || '').trim(),
    language: langLower,
    icon: icon || defaultIcon,
    order: modules().length + 1,
    startDate: startDate || null,
    endDate: endDate || null,
    lessons: [],
  };

  modules().push(newModule);
  await persist('modules');
  res.status(201).json({ message: 'Módulo criado', module: newModule });
});

// DELETE /api/admin/modules/:moduleId — exclui um módulo
router.delete('/modules/:moduleId', async (req, res) => {
  const idx = modules().findIndex((m) => m.id === req.params.moduleId);
  if (idx === -1) return res.status(404).json({ error: 'Módulo não encontrado' });

  const removed = modules().splice(idx, 1)[0];
  await persist('modules');
  res.json({ message: 'Módulo excluído', module: removed });
});

// PUT /api/admin/modules/:moduleId — edita um módulo
router.put('/modules/:moduleId', async (req, res) => {
  const mod = modules().find((m) => m.id === req.params.moduleId);
  if (!mod) return res.status(404).json({ error: 'Módulo não encontrado' });

  const { title, description, language, icon, startDate, endDate } = req.body;
  if (title) mod.title = title.trim();
  if (description !== undefined) mod.description = description.trim();
  if (language) mod.language = language.toLowerCase();
  if (icon) mod.icon = icon;
  if (startDate !== undefined) mod.startDate = startDate;
  if (endDate !== undefined) mod.endDate = endDate;

  await persist('modules');
  res.json({ message: 'Módulo atualizado', module: mod });
});

// POST /api/admin/modules/:moduleId/lessons — adiciona uma lição a um módulo
router.post('/modules/:moduleId/lessons', async (req, res) => {
  const mod = modules().find((m) => m.id === req.params.moduleId);
  if (!mod) return res.status(404).json({ error: 'Módulo não encontrado' });

  const { title, description, content, starterCode, solution, hints, keywords, videoUrl } = req.body;
  if (!title) return res.status(400).json({ error: 'Título da lição é obrigatório' });

  const id = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30) + '-' + uuidv4().substring(0, 6);

  const parseKeywords = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((k) => k.trim()).filter(Boolean);
    return raw.split(',').map((k) => k.trim()).filter(Boolean);
  };

  const newLesson = {
    id,
    title: title.trim(),
    description: (description || '').trim(),
    content: (content || '').trim(),
    starterCode: starterCode || '# Escreva seu código aqui\n',
    solution: solution || '',
    hints: hints || [],
    keywords: parseKeywords(keywords),
    videoUrl: videoUrl ? videoUrl.trim() : '',
  };

  mod.lessons.push(newLesson);
  await persist('modules');
  res.status(201).json({ message: 'Lição criada', lesson: newLesson });
});

// DELETE /api/admin/modules/:moduleId/lessons/:lessonId — exclui uma lição
router.delete('/modules/:moduleId/lessons/:lessonId', async (req, res) => {
  const mod = modules().find((m) => m.id === req.params.moduleId);
  if (!mod) return res.status(404).json({ error: 'Módulo não encontrado' });

  const idx = mod.lessons.findIndex((l) => l.id === req.params.lessonId);
  if (idx === -1) return res.status(404).json({ error: 'Lição não encontrada' });

  const removed = mod.lessons.splice(idx, 1)[0];
  await persist('modules');
  res.json({ message: 'Lição excluída', lesson: removed });
});

// PUT /api/admin/modules/:moduleId/lessons/:lessonId — edita uma lição
router.put('/modules/:moduleId/lessons/:lessonId', async (req, res) => {
  const mod = modules().find((m) => m.id === req.params.moduleId);
  if (!mod) return res.status(404).json({ error: 'Módulo não encontrado' });

  const lesson = mod.lessons.find((l) => l.id === req.params.lessonId);
  if (!lesson) return res.status(404).json({ error: 'Lição não encontrada' });

  const { title, description, content, starterCode, solution, hints, keywords, videoUrl } = req.body;
  if (title) lesson.title = title.trim();
  if (description !== undefined) lesson.description = description.trim();
  if (content !== undefined) lesson.content = content.trim();
  if (starterCode !== undefined) lesson.starterCode = starterCode;
  if (solution !== undefined) lesson.solution = solution;
  if (hints !== undefined) lesson.hints = hints;
  if (keywords !== undefined) {
    lesson.keywords = Array.isArray(keywords)
      ? keywords.map((k) => k.trim()).filter(Boolean)
      : keywords.split(',').map((k) => k.trim()).filter(Boolean);
  }
  if (videoUrl !== undefined) lesson.videoUrl = videoUrl.trim();

  await persist('modules');
  res.json({ message: 'Lição atualizada', lesson });
});

module.exports = router;

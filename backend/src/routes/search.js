const express = require('express');
const router = express.Router();
const { state } = require('../state');

// GET /api/search?q=keyword — busca lições por palavras-chave
router.get('/', (req, res) => {
  const { q } = req.query;

  if (!q || !q.trim()) return res.json([]);

  const query = q.toLowerCase().trim();
  const results = [];

  for (const mod of state.modules) {
    for (const lesson of mod.lessons) {
      const keywords = lesson.keywords || [];
      const matched = keywords.filter((k) => k.toLowerCase().includes(query));

      // Busca também no título e descrição da lição
      const titleMatch = lesson.title.toLowerCase().includes(query);
      const descMatch = (lesson.description || '').toLowerCase().includes(query);

      if (matched.length > 0 || titleMatch || descMatch) {
        results.push({
          moduleId: mod.id,
          moduleTitle: mod.title,
          moduleIcon: mod.icon || '📘',
          moduleLanguage: mod.language,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          lessonDescription: lesson.description || '',
          keywords: lesson.keywords || [],
          matchedKeywords: matched,
        });
      }
    }
  }

  res.json(results);
});

module.exports = router;

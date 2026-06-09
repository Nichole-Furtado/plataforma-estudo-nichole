const express = require('express');
const router = express.Router();
const { executePython, executeJavaScript } = require('../executor');

const EXECUTION_ENABLED = process.env.ENABLE_CODE_EXECUTION !== 'false';

// POST /api/execute — executa código via HTTP (alternativa ao WebSocket)
router.post('/', (req, res) => {
  const { code, language } = req.body;

  if (!EXECUTION_ENABLED) {
    return res.status(403).json({ error: 'Execução de código desativada neste servidor (modo público).' });
  }

  if (!code) return res.status(400).json({ error: 'Código não fornecido' });

  const lang = (language || 'python').toLowerCase();
  let stdout = '';
  let stderr = '';

  const onOutput = (data) => { stdout += data; };
  const onError = (data) => { stderr += data; };
  const onDone = (exitCode) => {
    res.json({ stdout, stderr, exitCode, language: lang });
  };

  if (lang === 'python') {
    executePython(code, onOutput, onError, onDone);
  } else if (lang === 'javascript' || lang === 'js') {
    executeJavaScript(code, onOutput, onError, onDone);
  } else {
    res.status(400).json({ error: `Linguagem não suportada: ${lang}` });
  }
});

module.exports = router;

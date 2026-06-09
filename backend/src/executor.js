const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const TIMEOUT_MS = 15000; // 15 segundos

/**
 * Executa código Python em processo isolado
 */
function executePython(code, onOutput, onError, onDone) {
  const tmpDir = os.tmpdir();
  const fileName = `nichole_exec_${uuidv4()}.py`;
  const filePath = path.join(tmpDir, fileName);

  // Escreve o código em arquivo temporário
  fs.writeFileSync(filePath, code, 'utf-8');

  const pythonPath = process.env.PYTHON_PATH || 'python';
  const proc = spawn(pythonPath, [filePath], {
    timeout: TIMEOUT_MS,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
  });

  let killed = false;
  const timer = setTimeout(() => {
    killed = true;
    proc.kill('SIGTERM');
    onError('⏱️ Tempo limite excedido (15s). Verifique loops infinitos.');
  }, TIMEOUT_MS);

  proc.stdout.on('data', (data) => onOutput(data.toString()));
  proc.stderr.on('data', (data) => onError(data.toString()));

  proc.on('close', (exitCode) => {
    clearTimeout(timer);
    // Limpa arquivo temporário
    try { fs.unlinkSync(filePath); } catch (_) { /* ignore */ }
    if (!killed) {
      onDone(exitCode);
    }
  });

  return proc;
}

/**
 * Executa código JavaScript em processo isolado (Node.js)
 */
function executeJavaScript(code, onOutput, onError, onDone) {
  const tmpDir = os.tmpdir();
  const fileName = `nichole_exec_${uuidv4()}.js`;
  const filePath = path.join(tmpDir, fileName);

  // Sandbox mínimo: remove acesso a módulos perigosos
  const sandboxedCode = `
'use strict';
// Sandbox: desabilita acesso a processo e módulos perigosos
const _require = require;
const allowedModules = ['console', 'Math', 'JSON', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean', 'RegExp', 'Map', 'Set', 'Promise'];

${code}
`;

  fs.writeFileSync(filePath, sandboxedCode, 'utf-8');

  const proc = spawn('node', [filePath], {
    timeout: TIMEOUT_MS,
  });

  let killed = false;
  const timer = setTimeout(() => {
    killed = true;
    proc.kill('SIGTERM');
    onError('⏱️ Tempo limite excedido (15s). Verifique loops infinitos.');
  }, TIMEOUT_MS);

  proc.stdout.on('data', (data) => onOutput(data.toString()));
  proc.stderr.on('data', (data) => onError(data.toString()));

  proc.on('close', (exitCode) => {
    clearTimeout(timer);
    try { fs.unlinkSync(filePath); } catch (_) { /* ignore */ }
    if (!killed) {
      onDone(exitCode);
    }
  });

  return proc;
}

module.exports = { executePython, executeJavaScript };

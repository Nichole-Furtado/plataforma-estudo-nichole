const { executePython, executeJavaScript } = require('./executor');

// Permite desativar a execução de código (ex: em produção pública, por segurança).
// Defina ENABLE_CODE_EXECUTION=false no servidor para bloquear.
const EXECUTION_ENABLED = process.env.ENABLE_CODE_EXECUTION !== 'false';

/**
 * Configura o Socket.IO para execução de código em tempo real
 */
function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);

    let currentProcess = null;

    socket.on('execute', ({ code, language }) => {
      if (!EXECUTION_ENABLED) {
        socket.emit('output', {
          type: 'stderr',
          data: '🔒 A execução de código está desativada neste servidor (modo público).\n',
        });
        socket.emit('done', { exitCode: 1 });
        return;
      }
      // Mata processo anterior se existir
      if (currentProcess) {
        try { currentProcess.kill('SIGTERM'); } catch (_) { /* ignore */ }
      }

      const lang = (language || 'python').toLowerCase();

      const onOutput = (data) => socket.emit('output', { type: 'stdout', data });
      const onError = (data) => socket.emit('output', { type: 'stderr', data });
      const onDone = (exitCode) => {
        currentProcess = null;
        socket.emit('done', { exitCode });
      };

      socket.emit('output', {
        type: 'info',
        data: `▶️ Executando código ${lang === 'python' ? 'Python' : 'JavaScript'}...\n`,
      });

      if (lang === 'python') {
        currentProcess = executePython(code, onOutput, onError, onDone);
      } else if (lang === 'javascript' || lang === 'js') {
        currentProcess = executeJavaScript(code, onOutput, onError, onDone);
      } else {
        socket.emit('output', { type: 'stderr', data: `❌ Linguagem não suportada: ${lang}` });
        socket.emit('done', { exitCode: 1 });
      }
    });

    socket.on('kill', () => {
      if (currentProcess) {
        currentProcess.kill('SIGTERM');
        currentProcess = null;
        socket.emit('output', { type: 'info', data: '🛑 Execução cancelada.\n' });
        socket.emit('done', { exitCode: -1 });
      }
    });

    socket.on('disconnect', () => {
      if (currentProcess) {
        try { currentProcess.kill('SIGTERM'); } catch (_) { /* ignore */ }
      }
      console.log(`🔌 Cliente desconectado: ${socket.id}`);
    });
  });
}

module.exports = setupSocket;

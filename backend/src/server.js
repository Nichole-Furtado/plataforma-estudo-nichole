require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const modulesRouter = require('./routes/modules');
const executeRouter = require('./routes/execute');
const progressRouter = require('./routes/progress');
const trackerRouter = require('./routes/tracker');
const financeiroRouter = require('./routes/financeiro');
const adminRouter = require('./routes/admin');
const searchRouter = require('./routes/search');
const authRouter = require('./routes/auth');
const lembretesRouter = require('./routes/lembretes');
const checklistRouter = require('./routes/checklist');
const setupSocket = require('./socket');
const { init } = require('./state');
const { verifyToken } = require('./lib/token');

const app = express();
const server = http.createServer(app);

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '5mb' }));

// Socket.IO para execução em tempo real
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});
setupSocket(io);

// Middleware de autenticação (só ativo quando AUTH_PASSWORD está definida)
const AUTH_ENABLED = !!process.env.AUTH_PASSWORD;
function requireAuth(req, res, next) {
  if (!AUTH_ENABLED) return next();
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  next();
}

// Health check e auth — rotas públicas (sem autenticação)
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/auth', authRouter);

// Rotas protegidas
app.use('/api/modules', requireAuth, modulesRouter);
app.use('/api/execute', requireAuth, executeRouter);
app.use('/api/progress', requireAuth, progressRouter);
app.use('/api/tracker', requireAuth, trackerRouter);
app.use('/api/financeiro', requireAuth, financeiroRouter);
app.use('/api/admin', requireAuth, adminRouter);
app.use('/api/search', requireAuth, searchRouter);
app.use('/api/lembretes', requireAuth, lembretesRouter);
app.use('/api/checklist', requireAuth, checklistRouter);

const PORT = process.env.PORT || 4000;

// Carrega os dados (MongoDB ou arquivos) antes de aceitar requisições.
init()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Falha ao inicializar persistência:', err);
    process.exit(1);
  });

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
const setupSocket = require('./socket');
const { init } = require('./state');

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

// Rotas da API
app.use('/api/modules', modulesRouter);
app.use('/api/execute', executeRouter);
app.use('/api/progress', progressRouter);
app.use('/api/tracker', trackerRouter);
app.use('/api/financeiro', financeiroRouter);
app.use('/api/admin', adminRouter);
app.use('/api/search', searchRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

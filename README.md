# 📚 Plataforma de Estudo da Nichole

Uma plataforma de estudo interativa sob medida, com **IDE no navegador** para aprender programação de forma prática.

## ✨ Funcionalidades

- 🖥️ **IDE no Navegador** — Editor de código Monaco (mesmo do VS Code) com syntax highlighting, autocomplete e atalhos
- ▶️ **Execução em Tempo Real** — Execute código Python e JavaScript diretamente no navegador via WebSocket
- 📚 **Módulos de Estudo** — Lições organizadas por temas com conteúdo em Markdown
- 💾 **Progresso Salvo** — Acompanhe quais lições foram concluídas
- 💡 **Dicas e Soluções** — Cada lição tem dicas e solução para consulta
- 🎨 **Interface Moderna** — Design dark mode com Tailwind CSS
- ⌨️ **Atalhos** — Ctrl+Enter para executar código rapidamente

## 🏗️ Arquitetura

```
├── backend/              # API Node.js + Express
│   ├── src/
│   │   ├── server.js     # Servidor principal
│   │   ├── executor.js   # Execução de código (Python/JS)
│   │   ├── socket.js     # WebSocket para output em tempo real
│   │   ├── data/         # Dados dos módulos e lições
│   │   └── routes/       # Rotas da API REST
│   └── package.json
│
├── frontend/             # Next.js + React
│   ├── src/
│   │   ├── pages/        # Páginas (Home, IDE, Learn)
│   │   ├── components/   # Componentes (Layout, CodeEditor)
│   │   ├── lib/          # API client, Socket hook
│   │   └── styles/       # CSS global + Tailwind
│   └── package.json
```

## 🚀 Como Rodar

### Pré-requisitos
- **Node.js** 18+ ([download](https://nodejs.org))
- **Python** 3.8+ ([download](https://python.org)) — para executar código Python

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

O backend rodará em `http://localhost:4000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend rodará em `http://localhost:3000`.

### 3. Abrir no Navegador

Acesse **http://localhost:3000** e comece a estudar! 🎉

## 📖 Módulos Disponíveis

| Módulo | Linguagem | Lições |
|--------|-----------|--------|
| 🐍 Python - Fundamentos | Python | 5 lições |
| 📊 Python - Intermediário | Python | 2 lições |
| 💛 JavaScript - Fundamentos | JavaScript | 2 lições |
| ⚛️ React - Fundamentos | JavaScript | 1 lição |

## 🛠️ Tecnologias

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Monaco Editor, Socket.IO Client
- **Backend**: Node.js, Express, Socket.IO, dotenv
- **Execução**: Processos isolados com timeout de 15s

## 📝 API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/modules` | Lista todos os módulos |
| GET | `/api/modules/:id` | Detalhes de um módulo |
| GET | `/api/modules/:id/lessons/:lessonId` | Detalhes de uma lição |
| POST | `/api/execute` | Executa código (HTTP) |
| GET | `/api/progress` | Progresso do usuário |
| POST | `/api/progress/:lessonId` | Salva progresso |
| GET | `/api/health` | Status do servidor |

## 🔮 Próximos Passos

- [ ] Banco de dados (PostgreSQL/MongoDB) para persistência
- [ ] Autenticação de usuários
- [ ] Mais módulos (HTML/CSS, SQL, Git)
- [ ] Sistema de desafios com validação automática
- [ ] Modo colaborativo em tempo real
- [ ] Deploy em produção (Vercel + Railway)

---

Feita com 💜 por Nichole — 2026

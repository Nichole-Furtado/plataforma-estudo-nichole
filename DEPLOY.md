# 🚀 Guia de Deploy — Vercel (frontend) + Render (backend)

Este guia coloca a plataforma online para você acessar de **qualquer lugar, inclusive no celular**.

- **Frontend (Next.js)** → Vercel
- **Backend (Node/Express + Socket.IO)** → Render

> 💡 **Custo:** ambos têm plano gratuito. No plano free do Render, o backend "dorme" após ~15 min sem uso e demora alguns segundos para acordar no primeiro acesso (normal).

---

## ⚠️ Antes de começar — 2 pontos importantes

1. **Repositório próprio:** hoje este projeto está dentro de um repositório Git da sua pasta de usuário (`Projeto-LAMIA`). Para o deploy, vamos criar um **repositório só deste projeto** (passo 1). Isso não apaga nada.
2. **IDE de código:** por segurança, a execução de código (Python/JS) fica **desligada no servidor público** (`ENABLE_CODE_EXECUTION=false`). As outras abas (Módulos, Relatório, Financeiro, Buscar, Gerenciar) funcionam normalmente. No seu PC local continua tudo ligado.
3. **Dados:** agora a plataforma salva tudo (progresso, relatório, planilha financeira, módulos) num **banco MongoDB grátis** (passo 2). Assim nada se perde quando o servidor reinicia. Localmente, sem banco, ela salva em arquivos automaticamente.

---

## 1️⃣ Criar um repositório no GitHub só deste projeto

Abra o **PowerShell na pasta do projeto** e rode:

```powershell
cd "C:\Users\nicho\OneDrive - MSFT\Documentos\Plataforma de Estudo da Nichole"

git init
git add .
git commit -m "Plataforma de Estudo da Nichole - deploy inicial"
```

Depois crie um repositório vazio no GitHub (botão **New repository**), por ex. `plataforma-estudo-nichole`, e conecte:

```powershell
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/plataforma-estudo-nichole.git
git push -u origin main
```

> Se o `git push` pedir login, use o seu usuário do GitHub. O `.gitignore` já evita subir `node_modules`, `.env` e dados locais.

---

## 2️⃣ Criar o banco de dados grátis (MongoDB Atlas)

1. Acesse **https://www.mongodb.com/cloud/atlas/register** e crie uma conta grátis (sem cartão).
2. Crie um cluster **gratuito (M0)** — pode aceitar as opções padrão.
3. Em **Database Access**, crie um usuário do banco com **senha** (anote usuário e senha).
4. Em **Network Access**, clique em **Add IP Address → Allow access from anywhere** (`0.0.0.0/0`) — necessário para o Render conectar.
5. Em **Database → Connect → Drivers**, copie a **connection string**, algo como:
   ```
   mongodb+srv://USUARIO:SENHA@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Troque `USUARIO` e `SENHA` pelos que você criou. Guarde — vamos usar no passo 3.

---

## 3️⃣ Deploy do BACKEND no Render

1. Acesse **https://render.com** e faça login com o GitHub.
2. **New → Web Service** → selecione o repositório que você acabou de criar.
3. Preencha:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
4. Em **Environment** (variáveis), adicione:
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `ENABLE_CODE_EXECUTION` | `false` |
   | `MONGODB_URI` | a connection string do MongoDB Atlas (passo 2) |
   | `MONGODB_DB` | `nichole_study` |
   | `ALLOWED_ORIGINS` | *(deixe por enquanto; preencheremos no passo 5)* |
5. Clique em **Create Web Service** e aguarde o build.
6. Anote a URL gerada, algo como: **`https://nichole-backend.onrender.com`**
7. Teste no navegador: `https://nichole-backend.onrender.com/api/health` → deve responder `{"status":"ok"}`.

> 🧩 Alternativa automática: como o projeto tem um `render.yaml`, você pode usar **New → Blueprint** e o Render lê as configs sozinho (só falta preencher `MONGODB_URI` e `ALLOWED_ORIGINS`).

---

## 4️⃣ Deploy do FRONTEND na Vercel

1. Acesse **https://vercel.com** e faça login com o GitHub.
2. **Add New → Project** → importe o mesmo repositório.
3. Em **Configure Project**:
   - **Root Directory:** `frontend`  ← clique em *Edit* e selecione a pasta `frontend`
   - Framework: **Next.js** (detectado automaticamente)
4. Em **Environment Variables**, adicione:
   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | a URL do backend do passo 3 (ex: `https://nichole-backend.onrender.com`) |
5. Clique em **Deploy** e aguarde.
6. Anote a URL final, algo como: **`https://plataforma-estudo-nichole.vercel.app`**

---

## 5️⃣ Conectar os dois (liberar o CORS)

1. Volte ao **Render → seu serviço → Environment**.
2. Edite/defina `ALLOWED_ORIGINS` com a URL da Vercel (sem barra no final):
   ```
   https://plataforma-estudo-nichole.vercel.app
   ```
3. Salve. O Render vai **reiniciar** o backend automaticamente.

Pronto! 🎉

---

## 📱 Acessar no celular

Abra a URL da **Vercel** (`https://...vercel.app`) no navegador do celular.
Dica: no Chrome/Safari do celular, use **"Adicionar à tela inicial"** para virar um atalho parecido com um app.

---

## 🔁 Como atualizar depois

Toda vez que você quiser publicar mudanças:

```powershell
git add .
git commit -m "minhas alterações"
git push
```

A Vercel e o Render **republicam sozinhos** a cada `push`.

---

## 💾 Persistência dos dados

A plataforma já salva tudo no **MongoDB Atlas** (passo 2) quando `MONGODB_URI` está definida — progresso, relatório, planilha financeira e módulos ficam guardados de verdade, mesmo que o servidor reinicie.

- **Sem `MONGODB_URI`** (ex: rodando localmente): salva em arquivos na pasta `backend/src/data/store/`.
- **Com `MONGODB_URI`** (produção): salva no banco, na coleção `appdata`.

> Dica: você pode usar o mesmo banco do Atlas no seu PC local — basta colocar a `MONGODB_URI` no arquivo `backend/.env`. Assim os dados ficam sincronizados entre o local e o online.

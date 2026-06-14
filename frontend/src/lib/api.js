import { getToken, removeToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function apiFetch(path, options = {}) {
  const token = getToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader, ...options.headers },
    ...options,
  });

  // Sessão expirada ou inválida → volta para login
  if (res.status === 401) {
    removeToken();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchModules() {
  return apiFetch('/api/modules');
}

export async function fetchModule(moduleId) {
  return apiFetch(`/api/modules/${moduleId}`);
}

export async function fetchLesson(moduleId, lessonId) {
  return apiFetch(`/api/modules/${moduleId}/lessons/${lessonId}`);
}

export async function executeCode(code, language = 'python') {
  return apiFetch('/api/execute', {
    method: 'POST',
    body: JSON.stringify({ code, language }),
  });
}

export async function fetchProgress() {
  return apiFetch('/api/progress');
}

export async function saveProgress(lessonId, data) {
  return apiFetch(`/api/progress/${lessonId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ========== Tracker (Relatório Mensal) ==========

export async function fetchTracker(yearMonth) {
  return apiFetch(`/api/tracker/${yearMonth}`);
}

export async function saveTracker(yearMonth, data) {
  return apiFetch(`/api/tracker/${yearMonth}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function addTrackerSubject(yearMonth, name) {
  return apiFetch(`/api/tracker/${yearMonth}/subject`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function removeTrackerSubject(yearMonth, name) {
  return apiFetch(`/api/tracker/${yearMonth}/subject/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
}

export async function toggleTrackerDay(yearMonth, subject, day) {
  return apiFetch(`/api/tracker/${yearMonth}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ subject, day }),
  });
}

// ========== Planilha Financeira ==========

export async function fetchFinanceiro(yearMonth) {
  return apiFetch(`/api/financeiro/${yearMonth}`);
}

export async function addFinanceiroEntry(yearMonth, type, description, value) {
  return apiFetch(`/api/financeiro/${yearMonth}/entry`, {
    method: 'POST',
    body: JSON.stringify({ type, description, value }),
  });
}

export async function updateFinanceiroEntry(yearMonth, id, data) {
  return apiFetch(`/api/financeiro/${yearMonth}/entry/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function removeFinanceiroEntry(yearMonth, id) {
  return apiFetch(`/api/financeiro/${yearMonth}/entry/${id}`, {
    method: 'DELETE',
  });
}

// ========== Admin (CRUD Módulos/Lições) ==========

export async function createModule(data) {
  return apiFetch('/api/admin/modules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteModule(moduleId) {
  return apiFetch(`/api/admin/modules/${moduleId}`, {
    method: 'DELETE',
  });
}

export async function updateModule(moduleId, data) {
  return apiFetch(`/api/admin/modules/${moduleId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function createLesson(moduleId, data) {
  return apiFetch(`/api/admin/modules/${moduleId}/lessons`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteLesson(moduleId, lessonId) {
  return apiFetch(`/api/admin/modules/${moduleId}/lessons/${lessonId}`, {
    method: 'DELETE',
  });
}

export async function updateLesson(moduleId, lessonId, data) {
  return apiFetch(`/api/admin/modules/${moduleId}/lessons/${lessonId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ========== Lembretes ==========

export async function fetchLembretes() {
  return apiFetch('/api/lembretes');
}

export async function addLembrete(text) {
  return apiFetch('/api/lembretes', { method: 'POST', body: JSON.stringify({ text }) });
}

export async function toggleLembrete(id, completed) {
  return apiFetch(`/api/lembretes/${id}`, { method: 'PATCH', body: JSON.stringify({ completed }) });
}

export async function removeLembrete(id) {
  return apiFetch(`/api/lembretes/${id}`, { method: 'DELETE' });
}

export async function limparConcluidos() {
  return apiFetch('/api/lembretes/concluidos/all', { method: 'DELETE' });
}

// ========== Busca por Palavras-chave ==========

export async function searchByKeyword(q) {
  return apiFetch(`/api/search?q=${encodeURIComponent(q)}`);
}

export { API_BASE };

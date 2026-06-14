const express = require('express');
const router = express.Router();
const { state, persist } = require('../state');

/**
 * Planilha Financeira mensal, persistida via store (MongoDB ou arquivo).
 * Estrutura por mês (ex: "2026-06"):
 *   { incomes: [{ id, description, value }], expenses: [{ id, description, value }] }
 */
const financeiro = () => state.financeiro;

function getMonth(yearMonth) {
  if (!financeiro()[yearMonth]) {
    financeiro()[yearMonth] = { incomes: [], expenses: [] };
  }
  return financeiro()[yearMonth];
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function parseValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// GET /api/financeiro/:yearMonth — dados do mês
router.get('/:yearMonth', (req, res) => {
  const data = financeiro()[req.params.yearMonth] || { incomes: [], expenses: [] };
  res.json(data);
});

// PUT /api/financeiro/:yearMonth — sobrescreve o mês inteiro
router.put('/:yearMonth', async (req, res) => {
  const { incomes, expenses } = req.body;
  financeiro()[req.params.yearMonth] = {
    incomes: Array.isArray(incomes) ? incomes : [],
    expenses: Array.isArray(expenses) ? expenses : [],
  };
  await persist('financeiro');
  res.json({ message: 'Planilha salva', data: financeiro()[req.params.yearMonth] });
});

// POST /api/financeiro/:yearMonth/entry — adiciona renda ou gasto
router.post('/:yearMonth/entry', async (req, res) => {
  const { type, description, value } = req.body;
  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ error: 'Tipo deve ser "income" ou "expense"' });
  }
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Descrição é obrigatória' });
  }

  const month = getMonth(req.params.yearMonth);
  const entry = { id: makeId(), description: description.trim(), value: parseValue(value), active: true };
  (type === 'income' ? month.incomes : month.expenses).push(entry);
  await persist('financeiro');
  res.json({ message: 'Lançamento adicionado', entry, data: month });
});

// PATCH /api/financeiro/:yearMonth/entry/:id — edita um lançamento
router.patch('/:yearMonth/entry/:id', async (req, res) => {
  const { yearMonth, id } = req.params;
  const { description, value, active } = req.body;
  const month = financeiro()[yearMonth];
  if (!month) return res.status(404).json({ error: 'Mês não encontrado' });

  const entry = [...month.incomes, ...month.expenses].find((e) => e.id === id);
  if (!entry) return res.status(404).json({ error: 'Lançamento não encontrado' });

  if (description !== undefined) entry.description = String(description).trim();
  if (value !== undefined) entry.value = parseValue(value);
  if (active !== undefined) entry.active = Boolean(active);
  await persist('financeiro');
  res.json({ message: 'Lançamento atualizado', entry, data: month });
});

// DELETE /api/financeiro/:yearMonth/entry/:id — remove um lançamento
router.delete('/:yearMonth/entry/:id', async (req, res) => {
  const { yearMonth, id } = req.params;
  const month = financeiro()[yearMonth];
  if (!month) return res.status(404).json({ error: 'Mês não encontrado' });

  month.incomes = month.incomes.filter((e) => e.id !== id);
  month.expenses = month.expenses.filter((e) => e.id !== id);
  await persist('financeiro');
  res.json({ message: 'Lançamento removido', data: month });
});

module.exports = router;

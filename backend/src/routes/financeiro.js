const express = require('express');
const router = express.Router();
const { state, persist } = require('../state');

const financeiro = () => state.financeiro;

function getMonth(yearMonth) {
  if (!financeiro()[yearMonth]) {
    financeiro()[yearMonth] = { incomes: [], expenses: [] };
  }
  return financeiro()[yearMonth];
}

function getFixed() {
  if (!financeiro()._fixed) financeiro()._fixed = [];
  return financeiro()._fixed;
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function parseValue(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function addMonths(yearMonth, offset) {
  const [y, m] = yearMonth.split('-').map(Number);
  const d = new Date(y, m - 1 + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── Rendas Fixas (aparecem em todos os meses) ──────────────────────────────

// GET /api/financeiro/fixed
router.get('/fixed', (_req, res) => {
  res.json(getFixed());
});

// POST /api/financeiro/fixed
router.post('/fixed', async (req, res) => {
  const { description, value } = req.body;
  if (!description || !String(description).trim()) {
    return res.status(400).json({ error: 'Descrição é obrigatória' });
  }
  const entry = {
    id: makeId(),
    description: String(description).trim(),
    value: parseValue(value),
    active: true,
  };
  getFixed().push(entry);
  await persist('financeiro');
  res.json({ entry, fixed: getFixed() });
});

// PATCH /api/financeiro/fixed/:id
router.patch('/fixed/:id', async (req, res) => {
  const entry = getFixed().find((e) => e.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Renda fixa não encontrada' });
  const { description, value, active } = req.body;
  if (description !== undefined) entry.description = String(description).trim();
  if (value !== undefined) entry.value = parseValue(value);
  if (active !== undefined) entry.active = Boolean(active);
  await persist('financeiro');
  res.json({ entry, fixed: getFixed() });
});

// DELETE /api/financeiro/fixed/:id
router.delete('/fixed/:id', async (req, res) => {
  const before = getFixed().length;
  financeiro()._fixed = getFixed().filter((e) => e.id !== req.params.id);
  if (financeiro()._fixed.length === before) {
    return res.status(404).json({ error: 'Renda fixa não encontrada' });
  }
  await persist('financeiro');
  res.json({ fixed: getFixed() });
});

// ── Lançamentos mensais ────────────────────────────────────────────────────

// GET /api/financeiro/:yearMonth
router.get('/:yearMonth', (req, res) => {
  const data = financeiro()[req.params.yearMonth] || { incomes: [], expenses: [] };
  res.json(data);
});

// PUT /api/financeiro/:yearMonth
router.put('/:yearMonth', async (req, res) => {
  const { incomes, expenses } = req.body;
  financeiro()[req.params.yearMonth] = {
    incomes: Array.isArray(incomes) ? incomes : [],
    expenses: Array.isArray(expenses) ? expenses : [],
  };
  await persist('financeiro');
  res.json({ message: 'Planilha salva', data: financeiro()[req.params.yearMonth] });
});

// POST /api/financeiro/:yearMonth/entry
router.post('/:yearMonth/entry', async (req, res) => {
  const { type, description, value, parcelas, parcelaAtual } = req.body;
  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ error: 'Tipo deve ser "income" ou "expense"' });
  }
  if (!description || !description.trim()) {
    return res.status(400).json({ error: 'Descrição é obrigatória' });
  }

  const totalParcelas = parseInt(parcelas) || 1;
  const parcelaAtualNum = parseInt(parcelaAtual) || 1;
  const desc = description.trim();
  const val = parseValue(value);

  const month = getMonth(req.params.yearMonth);
  const entry = {
    id: makeId(),
    description: desc,
    value: val,
    active: true,
    ...(totalParcelas > 1 ? { parcelas: totalParcelas, parcelaAtual: parcelaAtualNum } : {}),
  };
  (type === 'income' ? month.incomes : month.expenses).push(entry);

  // Cria automaticamente as parcelas restantes nos meses seguintes
  if (type === 'expense' && totalParcelas > 1) {
    for (let i = parcelaAtualNum + 1; i <= totalParcelas; i++) {
      const futureYearMonth = addMonths(req.params.yearMonth, i - parcelaAtualNum);
      const futureMonth = getMonth(futureYearMonth);
      futureMonth.expenses.push({
        id: makeId(),
        description: desc,
        value: val,
        active: true,
        parcelas: totalParcelas,
        parcelaAtual: i,
      });
    }
  }

  await persist('financeiro');
  res.json({ message: 'Lançamento adicionado', entry, data: month });
});

// PATCH /api/financeiro/:yearMonth/entry/:id
router.patch('/:yearMonth/entry/:id', async (req, res) => {
  const { yearMonth, id } = req.params;
  const { description, value, active, parcelas, parcelaAtual } = req.body;
  const month = financeiro()[yearMonth];
  if (!month) return res.status(404).json({ error: 'Mês não encontrado' });

  const entry = [...month.incomes, ...month.expenses].find((e) => e.id === id);
  if (!entry) return res.status(404).json({ error: 'Lançamento não encontrado' });

  if (description !== undefined) entry.description = String(description).trim();
  if (value !== undefined) entry.value = parseValue(value);
  if (active !== undefined) entry.active = Boolean(active);
  if (parcelas !== undefined) entry.parcelas = parseInt(parcelas) > 1 ? parseInt(parcelas) : undefined;
  if (parcelaAtual !== undefined) entry.parcelaAtual = parseInt(parcelaAtual) || 1;
  await persist('financeiro');
  res.json({ message: 'Lançamento atualizado', entry, data: month });
});

// DELETE /api/financeiro/:yearMonth/entry/:id
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

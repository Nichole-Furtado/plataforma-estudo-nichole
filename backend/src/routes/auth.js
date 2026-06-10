const express = require('express');
const router = express.Router();
const { generateToken } = require('../lib/token');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  const AUTH_PASSWORD = process.env.AUTH_PASSWORD;

  // Sem AUTH_PASSWORD definida → modo dev, auth desativada
  if (!AUTH_PASSWORD) {
    return res.json({ token: generateToken(), dev: true });
  }

  if (!password || password !== AUTH_PASSWORD) {
    // Delay leve para dificultar brute-force
    setTimeout(() => {
      res.status(401).json({ error: 'Senha incorreta' });
    }, 400);
    return;
  }

  res.json({ token: generateToken() });
});

module.exports = router;

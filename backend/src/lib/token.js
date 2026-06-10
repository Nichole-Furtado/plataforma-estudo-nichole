const crypto = require('crypto');

const SECRET = process.env.AUTH_SECRET || 'dev-secret-change-me';
const TOKEN_TTL = 30 * 24 * 60 * 60 * 1000; // 30 dias em ms

/**
 * Gera um token no formato: `exp.assinatura`
 * exp  = timestamp Unix (ms) de expiração
 * sig  = HMAC-SHA256 do exp, usando AUTH_SECRET
 */
function generateToken() {
  const exp = Date.now() + TOKEN_TTL;
  const sig = crypto.createHmac('sha256', SECRET).update(String(exp)).digest('hex');
  return `${exp}.${sig}`;
}

/**
 * Verifica se o token é válido e não expirou.
 * Usa comparação em tempo constante para evitar timing attacks.
 */
function verifyToken(token) {
  try {
    if (!token) return false;
    const dot = token.lastIndexOf('.');
    if (dot === -1) return false;
    const exp = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (Date.now() > parseInt(exp, 10)) return false;
    const expected = crypto.createHmac('sha256', SECRET).update(exp).digest('hex');
    if (sig.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

module.exports = { generateToken, verifyToken };

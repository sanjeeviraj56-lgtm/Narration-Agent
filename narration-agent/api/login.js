const A = require('../lib/auth');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const U = process.env.APP_USER, P = process.env.APP_PASS;
  if (!U || !P) return res.status(500).json({ error: 'Server is not set up: APP_USER and APP_PASS are missing in Vercel.' });
  const { username = '', password = '' } = req.body || {};
  const okU = A.safeEq(String(username).trim().toLowerCase(), U.toLowerCase()), okP = A.safeEq(password, P);
  if (!(okU && okP)) { await new Promise(r => setTimeout(r, 800)); return res.status(401).json({ error: 'Wrong username or password' }); }
  A.setCookie(res, 'na_s', A.sign({ u: U, exp: Date.now() + 30 * 864e5 }), 30 * 86400);
  res.status(200).json({ ok: true });
};

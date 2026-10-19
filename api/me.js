const A = require('../lib/auth');
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const s = A.session(req);
  if (!s) return res.status(401).json({ error: 'Please sign in', configured: !!(process.env.APP_USER && process.env.APP_PASS) });
  const ms = !!(process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET);
  res.status(200).json({ ok: true, user: s.u, engines: A.engines(), ms: { configured: ms, connected: ms && !!A.cookies(req).na_ms } });
};

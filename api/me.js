const A = require('../lib/auth');const U = require('../lib/users');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const s = A.session(req);
  if (!s) return res.status(401).json({ error: 'Please sign in', configured: !!(process.env.APP_USER && process.env.APP_PASS) });
  let me = null; try { me = await U.find(s.u); } catch (e) { me = { username: s.u, name: s.u, role: U.envAdmins().includes(U.norm(s.u)) ? 'admin' : 'user', active: true }; }
  if (!me || me.active === false) { A.setCookie(res, 'na_s', '', 0); return res.status(401).json({ error: 'Please sign in' }); }
  const ms = !!(process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET);
  res.status(200).json({ ok: true, user: me.name || s.u, username: s.u, admin: me.role === 'admin', storage: U.configured(), engines: A.engines(), ms: { configured: ms, connected: ms && !!A.cookies(req).na_ms } });
};

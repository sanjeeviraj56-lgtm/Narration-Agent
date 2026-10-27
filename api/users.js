const A = require('../lib/auth');const U = require('../lib/users');
const ROLES = ['admin', 'user'];
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const s = A.need(req, res); if (!s) return;
  try {
    const me = await U.find(s.u);
    if (!me || me.active === false || me.role !== 'admin') return res.status(403).json({ error: 'Administrators only' });
    const list = async () => Object.values(await U.all()).sort((a, b) => a.name.localeCompare(b.name));
    if (req.method === 'GET') return res.status(200).json({ users: await list(), storage: U.configured() });
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
    const b = req.body || {}, k = U.norm(b.username), act = b.action;
    if (!/^[a-z0-9._-]{2,30}$/.test(k)) return res.status(400).json({ error: 'Username: 2-30 letters, numbers, . _ -' });
    const pwOk = p => String(p || '').length >= 8;
    const cur = (await U.all())[k];
    const adminsLeft = async (ex, willBeAdminActive) => { const a = await U.all(); let n = 0; for (const x in a) { const u = x === ex ? { role: willBeAdminActive ? 'admin' : 'user', active: willBeAdminActive } : a[x]; if (u.role === 'admin' && u.active) n++; } return n; };
    if (act === 'add') {
      if (cur) return res.status(400).json({ error: 'That username already exists' });
      if (!pwOk(b.password)) return res.status(400).json({ error: 'Password must be at least 8 characters' });
      if (!ROLES.includes(b.role)) return res.status(400).json({ error: 'Choose a role' });
      await U.mutate(db => { db[k] = { username: String(b.username).trim(), name: String(b.name || b.username).trim(), email: String(b.email || '').trim(), role: b.role, active: true, ...U.mkPw(b.password), created: Date.now() }; });
    } else if (act === 'update') {
      if (!cur) return res.status(404).json({ error: 'No such user' });
      const role = ROLES.includes(b.role) ? b.role : cur.role, active = b.active === undefined ? cur.active : !!b.active;
      if ((cur.role === 'admin' && cur.active) && !(role === 'admin' && active) && (await adminsLeft(k, false)) < 1) return res.status(400).json({ error: 'There must be at least one active Administrator' });
      await U.mutate(db => { const d = db[k] || { username: cur.username }; db[k] = { ...d, name: String(b.name === undefined ? cur.name : b.name).trim() || cur.name, email: String(b.email === undefined ? cur.email : b.email).trim(), role, active }; });
    } else if (act === 'password') {
      if (!cur) return res.status(404).json({ error: 'No such user' });
      if (!pwOk(b.password)) return res.status(400).json({ error: 'Password must be at least 8 characters' });
      await U.mutate(db => { const d = db[k] || { username: cur.username, name: cur.name, email: cur.email, role: cur.role, active: cur.active }; db[k] = { ...d, ...U.mkPw(b.password) }; });
    } else return res.status(400).json({ error: 'Unknown action' });
    res.status(200).json({ ok: true, users: await list() });
  } catch (e) { res.status(500).json({ error: e.message || 'Server error' }); }
};

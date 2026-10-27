const crypto = require('crypto');
const URL_ = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOK = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const KEY = 'na:users';
const configured = () => !!(URL_() && TOK());
async function cmd(args) {
  const r = await fetch(URL_(), { method: 'POST', headers: { Authorization: 'Bearer ' + TOK(), 'content-type': 'application/json' }, body: JSON.stringify(args) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || 'Storage error ' + r.status);
  return j.result;
}
async function loadDb() { if (!configured()) return {}; const v = await cmd(['GET', KEY]); try { return v ? JSON.parse(v) : {}; } catch (e) { return {}; } }
async function saveDb(db) { await cmd(['SET', KEY, JSON.stringify(db)]); }
const norm = u => String(u || '').trim().toLowerCase();
function hash(pw, salt) { return crypto.scryptSync(String(pw), salt, 32).toString('hex'); }
function mkPw(pw) { const salt = crypto.randomBytes(16).toString('hex'); return { salt, hash: hash(pw, salt) }; }
function envUsers() {
  const m = {}; const add = (u, p) => { if (u && p) m[norm(u)] = { username: String(u).trim(), pass: String(p).trim() }; };
  add(process.env.APP_USER, process.env.APP_PASS);
  String(process.env.APP_USERS || '').split(/[;\n]/).forEach(s => { const i = s.indexOf(':'); if (i > 0) add(s.slice(0, i), s.slice(i + 1)); });
  return m;
}
const envAdmins = () => String(process.env.ADMINS || 'admin,jeeva,pirai').toLowerCase().split(/[,;\s]+/).filter(Boolean);
// merged view (no secrets)
async function all() {
  const db = await loadDb(), env = envUsers(), out = {};
  for (const k in env) out[k] = { username: env[k].username, name: env[k].username, email: '', role: envAdmins().includes(k) ? 'admin' : 'user', active: true, source: 'env' };
  for (const k in db) { const d = db[k]; out[k] = { username: d.username || k, name: d.name || d.username || k, email: d.email || '', role: d.role === 'admin' ? 'admin' : 'user', active: d.active !== false, source: out[k] ? 'both' : 'db' }; }
  return out;
}
async function find(username) { const a = await all(); return a[norm(username)] || null; }
async function verify(username, password) {
  const k = norm(username), db = await loadDb(), d = db[k];
  const safe = (a, b) => crypto.timingSafeEqual(crypto.createHash('sha256').update(String(a)).digest(), crypto.createHash('sha256').update(String(b)).digest());
  if (d && d.active === false) return null;
  if (d && d.hash) { return safe(hash(password, d.salt), d.hash) ? (await find(k)) : null; }
  const e = envUsers()[k]; if (e && safe(password, e.pass)) return await find(k);
  return null;
}
async function mutate(fn) { if (!configured()) throw new Error('User storage is not set up yet (connect an Upstash Redis database in Vercel).'); const db = await loadDb(); const r = fn(db); await saveDb(db); return r; }
module.exports = { configured, loadDb, all, find, verify, mutate, mkPw, norm, envAdmins, envUsers };

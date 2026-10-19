const crypto = require('crypto');
const secret = () => crypto.createHash('sha256').update('na|' + (process.env.SESSION_SECRET || (process.env.APP_USER || '') + '|' + (process.env.APP_PASS || ''))).digest();
const b64u = b => Buffer.from(b).toString('base64url');
function sign(payload) { const p = b64u(JSON.stringify(payload)); const h = crypto.createHmac('sha256', secret()).update(p).digest('base64url'); return p + '.' + h; }
function verify(tok) {
  if (!tok || !tok.includes('.')) return null;
  const [p, h] = tok.split('.');
  const e = crypto.createHmac('sha256', secret()).update(p).digest('base64url');
  if (h.length !== e.length || !crypto.timingSafeEqual(Buffer.from(h), Buffer.from(e))) return null;
  try { const o = JSON.parse(Buffer.from(p, 'base64url').toString()); return o.exp > Date.now() ? o : null; } catch (e) { return null; }
}
function encrypt(text) { const iv = crypto.randomBytes(12); const c = crypto.createCipheriv('aes-256-gcm', secret(), iv); const d = Buffer.concat([c.update(text, 'utf8'), c.final()]); return Buffer.concat([iv, c.getAuthTag(), d]).toString('base64url'); }
function decrypt(s) { try { const b = Buffer.from(s, 'base64url'); const d = crypto.createDecipheriv('aes-256-gcm', secret(), b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28)); return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'); } catch (e) { return null; } }
function cookies(req) { const o = {}; String(req.headers.cookie || '').split(/;\s*/).forEach(c => { const i = c.indexOf('='); if (i > 0) o[c.slice(0, i)] = decodeURIComponent(c.slice(i + 1)); }); return o; }
function setCookie(res, name, val, maxAgeSec) {
  const c = `${name}=${encodeURIComponent(val)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSec}`;
  const prev = res.getHeader('Set-Cookie') || []; res.setHeader('Set-Cookie', [].concat(prev, c));
}
function session(req) { return verify(cookies(req).na_s); }
function need(req, res) { const s = session(req); if (!s) { res.status(401).json({ error: 'Please sign in' }); return null; } return s; }
function safeEq(a, b) { const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest(); return crypto.timingSafeEqual(x, y); }
function engines() { const e = []; if (process.env.ANTHROPIC_API_KEY) e.push('claude'); if (process.env.GEMINI_API_KEY) e.push('gemini'); return e; }
module.exports = { sign, verify, encrypt, decrypt, cookies, setCookie, session, need, safeEq, engines };

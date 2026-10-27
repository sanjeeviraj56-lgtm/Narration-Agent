const A = require('../lib/auth');
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const s = A.session(req);
  if (!s) return res.status(401).json({ error: 'Please sign in', configured: !!(process.env.APP_USER && process.env.APP_PASS) });
  const ms = !!(process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET);
  const adm=String(process.env.ADMINS||'jeeva,pirai').toLowerCase().split(/[,;\s]+/).filter(Boolean);
  const isAdm=adm.includes(String(s.u).trim().toLowerCase());
  let users;if(isAdm){const set=new Map();const add=n=>{n=String(n||'').trim();if(n)set.set(n.toLowerCase(),n)};add(process.env.APP_USER);String(process.env.APP_USERS||'').split(/[;\n]/).forEach(x=>{const i=x.indexOf(':');if(i>0)add(x.slice(0,i))});users=[...set.entries()].map(([k,n])=>({name:n,admin:adm.includes(k)}))}
  res.status(200).json({ ok: true, user: s.u, admin: isAdm, users, engines: A.engines(), ms: { configured: ms, connected: ms && !!A.cookies(req).na_ms } });
};

const A = require('../../lib/auth'), M = require('../../lib/ms'), crypto = require('crypto');
module.exports = (req, res) => {
  if (!A.session(req)) return res.status(401).send('Please sign in first');
  if (!process.env.MS_CLIENT_ID || !process.env.MS_CLIENT_SECRET) return res.status(500).send('Outlook is not set up on the server (MS_CLIENT_ID / MS_CLIENT_SECRET).');
  const hint = String(new URL(req.url, 'https://x').searchParams.get('hint') || '').trim().slice(0, 120);
  const st = crypto.randomBytes(16).toString('hex'); A.setCookie(res, 'na_st', st, 600);
  res.writeHead(302, { Location: M.authUrl(req, st, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hint) ? hint : ''), 'Set-Cookie': res.getHeader('Set-Cookie') }); res.end();
};

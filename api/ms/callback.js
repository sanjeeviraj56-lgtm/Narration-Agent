const A = require('../../lib/auth'), M = require('../../lib/ms');
module.exports = async (req, res) => {
  try {
    if (!A.session(req)) return res.status(401).send('Please sign in first');
    const u = new URL(req.url, 'https://x'); const code = u.searchParams.get('code'), st = u.searchParams.get('state');
    if (u.searchParams.get('error')) return res.status(400).send('Microsoft said: ' + u.searchParams.get('error_description'));
    if (!code || !st || st !== A.cookies(req).na_st) return res.status(400).send('Sign-in check failed. Close this and click Connect Outlook again.');
    const j = await M.token(req, { grant_type: 'authorization_code', code });
    if (!j.refresh_token) return res.status(400).send('Microsoft did not give offline access.');
    A.setCookie(res, 'na_ms', A.encrypt(j.refresh_token), 90 * 86400);
    res.writeHead(302, { Location: '/?outlook=connected', 'Set-Cookie': res.getHeader('Set-Cookie') }); res.end();
  } catch (e) { res.status(400).send('Outlook sign-in failed: ' + e.message); }
};

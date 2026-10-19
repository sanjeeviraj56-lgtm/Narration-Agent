const A = require('./auth');
const tenant = () => process.env.MS_TENANT || 'organizations';
const scope = 'offline_access User.Read Mail.Read Mail.Read.Shared';
const origin = req => process.env.MS_REDIRECT_BASE || ('https://' + req.headers.host);
const redirect = req => origin(req) + '/api/ms/callback';
function authUrl(req, state) {
  const q = new URLSearchParams({ client_id: process.env.MS_CLIENT_ID, response_type: 'code', redirect_uri: redirect(req), response_mode: 'query', scope, state, prompt: 'select_account' });
  return `https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/authorize?${q}`;
}
async function token(req, params) {
  const body = new URLSearchParams(Object.assign({ client_id: process.env.MS_CLIENT_ID, client_secret: process.env.MS_CLIENT_SECRET, redirect_uri: redirect(req), scope }, params));
  const r = await fetch(`https://login.microsoftonline.com/${tenant()}/oauth2/v2.0/token`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
  const j = await r.json(); if (!r.ok) { const e = new Error(j.error_description || 'Microsoft sign-in failed'); e.status = 401; throw e; } return j;
}
async function access(req, res) {
  const enc = A.cookies(req).na_ms; const rt = enc && A.decrypt(enc);
  if (!rt) { const e = new Error('Connect Outlook first'); e.status = 401; e.code = 'needs_reauth'; throw e; }
  let j; try { j = await token(req, { grant_type: 'refresh_token', refresh_token: rt }); } catch (e) { e.code = 'needs_reauth'; throw e; }
  if (j.refresh_token) A.setCookie(res, 'na_ms', A.encrypt(j.refresh_token), 90 * 86400);
  return j.access_token;
}
const base = owner => owner ? 'https://graph.microsoft.com/v1.0/users/' + encodeURIComponent(owner) : 'https://graph.microsoft.com/v1.0/me';
async function graph(tok, url, extra) {
  const r = await fetch(url, Object.assign({ headers: { Authorization: 'Bearer ' + tok, ConsistencyLevel: 'eventual' } }, extra));
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error((j.error && j.error.message) || 'Outlook error ' + r.status); e.status = r.status === 401 || r.status === 403 ? r.status : 502; throw e; }
  return j;
}
const parseUri = uri => { const m = String(uri).match(/^mail:\/\/\/(messages|attachments)\/([^?]+)(?:\?owner=(.*))?$/); return m ? { kind: m[1], id: decodeURIComponent(m[2]), owner: m[3] ? decodeURIComponent(m[3]) : '' } : null; };
module.exports = { authUrl, token, access, base, graph, parseUri, redirect };

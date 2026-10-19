const A = require('../../lib/auth'), M = require('../../lib/ms');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!A.need(req, res)) return;
  try {
    const { query = 'payment', limit = 25, mailboxOwnerEmail = '' } = req.body || {};
    const tok = await M.access(req, res);
    const q = String(query).replace(/"/g, ' ');
    const url = M.base(mailboxOwnerEmail) + '/messages?$search="' + encodeURIComponent(q) + '"&$top=' + Math.min(+limit || 25, 50) + '&$select=id,subject,from,receivedDateTime,bodyPreview,hasAttachments';
    const j = await M.graph(tok, url);
    const items = (j.value || []).map(m => ({ id: m.id, subject: m.subject, sender: m.from && m.from.emailAddress ? m.from.emailAddress.address : '', receivedDateTime: m.receivedDateTime, summary: m.bodyPreview, uri: 'mail:///messages/' + encodeURIComponent(m.id) + (mailboxOwnerEmail ? '?owner=' + encodeURIComponent(mailboxOwnerEmail) : '') }));
    res.status(200).json({ payload: items });
  } catch (e) { res.status(e.status || 502).json({ error: e.message, code: e.code }); }
};

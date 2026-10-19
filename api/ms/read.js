const A = require('../../lib/auth'), M = require('../../lib/ms');
async function toText(name, buf) {
  const n = String(name).toLowerCase();
  try {
    if (/\.(txt|csv)$/.test(n)) return buf.toString('utf8');
    if (n.endsWith('.pdf')) { const r = await require('pdf-parse')(buf); return r.text; }
    if (/\.docx$/.test(n)) { const r = await require('mammoth').extractRawText({ buffer: buf }); return r.value; }
    if (/\.xlsx?$/.test(n)) { const X = require('xlsx'); const wb = X.read(buf, { type: 'buffer' }); return wb.SheetNames.map(s => '## ' + s + '\n' + X.utils.sheet_to_csv(wb.Sheets[s])).join('\n'); }
  } catch (e) { return ''; }
  return '';
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!A.need(req, res)) return;
  try {
    const p = M.parseUri((req.body || {}).uri); if (!p) return res.status(400).json({ error: 'Bad mail link' });
    const tok = await M.access(req, res);
    if (p.kind === 'messages') {
      const m = await M.graph(tok, M.base(p.owner) + '/messages/' + encodeURIComponent(p.id) + '?$select=subject,from,toRecipients,ccRecipients,receivedDateTime,body,hasAttachments&$expand=attachments($select=id,name,size,isInline,contentType)');
      const ad = x => ({ address: x.emailAddress && x.emailAddress.address });
      return res.status(200).json({ payload: { subject: m.subject, sender: ad(m.from || {}), toRecipients: (m.toRecipients || []).map(ad), ccRecipients: (m.ccRecipients || []).map(ad), receivedDateTime: m.receivedDateTime, body: { content: (m.body || {}).content || '' }, attachments: (m.attachments || []).map(a => ({ name: a.name, size: a.size, isInline: a.isInline, uri: 'mail:///attachments/' + encodeURIComponent(p.id + '|' + a.id) + (p.owner ? '?owner=' + encodeURIComponent(p.owner) : '') })) } });
    }
    const [mid, aid] = p.id.split('|');
    const a = await M.graph(tok, M.base(p.owner) + '/messages/' + encodeURIComponent(mid) + '/attachments/' + encodeURIComponent(aid));
    const buf = Buffer.from(a.contentBytes || '', 'base64');
    if (/^image\//.test(a.contentType || '')) return res.status(200).json({ content: [{ type: 'image', data: a.contentBytes, mimeType: a.contentType }] });
    res.status(200).json({ payload: (await toText(a.name, buf)).slice(0, 20000) });
  } catch (e) { res.status(e.status || 502).json({ error: e.message, code: e.code }); }
};

// Sends the prompt to Claude (Anthropic) or Gemini (Google), whichever the user picked and the server has a key for.
const A = require('../lib/auth');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const sess = A.need(req, res); if (!sess) return;
  try { const me = await require('../lib/users').find(sess.u); if (!me || me.active === false) return res.status(401).json({ error: 'Please sign in' }); } catch (e) {}
  const { input, images = [], engine, json } = req.body || {};
  if (!input) return res.status(400).json({ error: 'No input' });
  const have = A.engines();
  if (!have.length) return res.status(500).json({ error: 'No AI key set in Vercel (ANTHROPIC_API_KEY or GEMINI_API_KEY).' });
  const eng = have.includes(engine) ? engine : have[0];
  const msgs = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
  try {
    if (eng === 'claude') {
      let messages = msgs;
      if (images.length) {
        const last = msgs[msgs.length - 1];
        messages = msgs.slice(0, -1).concat([{ role: 'user', content: images.map(i => ({ type: 'image', source: { type: 'base64', media_type: i.type, data: i.data } })).concat([{ type: 'text', text: String(last.content) }]) }]);
      }
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5', max_tokens: 8000, messages }) });
      const j = await r.json();
      if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: (j.error && j.error.message) || 'Claude error' });
      return res.status(200).json({ text: (j.content || []).map(c => c.text || '').join(''), truncated: j.stop_reason === 'max_tokens', engine: eng });
    }
    const contents = msgs.map((m, i) => {
      const parts = [{ text: String(m.content) }];
      if (images.length && i === msgs.length - 1) images.forEach(im => parts.unshift({ inline_data: { mime_type: im.type, data: im.data } }));
      return { role: m.role === 'assistant' ? 'model' : 'user', parts };
    });
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const gc = { maxOutputTokens: 8000 }; if (json) gc.responseMimeType = 'application/json';
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', { method: 'POST', headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ contents, generationConfig: gc }) });
    const j = await r.json();
    if (!r.ok) return res.status(r.status === 429 ? 429 : 502).json({ error: (j.error && j.error.message) || 'Gemini error' });
    const cand = (j.candidates || [])[0] || {};
    res.status(200).json({ text: ((cand.content || {}).parts || []).map(p => p.text || '').join(''), truncated: cand.finishReason === 'MAX_TOKENS', engine: eng });
  } catch (e) { res.status(502).json({ error: 'Could not reach the AI service' }); }
};

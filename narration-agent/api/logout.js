const A = require('../lib/auth');
module.exports = (req, res) => { A.setCookie(res, 'na_s', '', 0); A.setCookie(res, 'na_ms', '', 0); res.status(200).json({ ok: true }); };

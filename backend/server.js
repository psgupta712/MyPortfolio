const express = require('express');
const cors    = require('cors');
const { Resend } = require('resend');
require('dotenv').config();

const app    = express();
const PORT   = process.env.PORT || 3001;
const resend = new Resend(process.env.RESEND_API_KEY);

/* ─── MIDDLEWARE ─────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ─── CORS ───────────────────────────────────────────────── */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.map(o => o.replace(/\/$/, '')).includes(cleanOrigin)) return callback(null, true);
    if (cleanOrigin.startsWith('https://')) return callback(null, true);
    callback(new Error('CORS blocked: ' + origin));
  },
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));
app.options('*', cors());

/* ─── RATE LIMIT ─────────────────────────────────────────── */
const rateLimitMap = new Map();
function rateLimit(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const max = 3;
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  return entry.count > max;
}

/* ─── HTML ESCAPE ────────────────────────────────────────── */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ─── EMAIL TEMPLATE ─────────────────────────────────────── */
function buildEmailHTML(name, email, subject, message) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0b0f19;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#0f1424;border:1px solid rgba(99,102,241,0.3);border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#6366f1,#06b6d4);padding:32px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">📬 New Portfolio Message</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Someone reached out via your portfolio</p>
      </div>
      <div style="padding:32px;">
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;">From</div>
          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px 16px;color:#f1f5f9;">${escapeHtml(name)}</div>
        </div>
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;">Email</div>
          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px 16px;color:#f1f5f9;">${escapeHtml(email)}</div>
        </div>
        <div style="margin-bottom:20px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;">Subject</div>
          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px 16px;color:#f1f5f9;">${escapeHtml(subject)}</div>
        </div>
        <div style="margin-bottom:28px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#818cf8;margin-bottom:6px;">Message</div>
          <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:12px 16px;color:#f1f5f9;white-space:pre-wrap;min-height:80px;">${escapeHtml(message)}</div>
        </div>
        <div style="text-align:center;">
          <a href="mailto:${escapeHtml(email)}?subject=Re: ${encodeURIComponent(subject)}"
             style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
            Reply to ${escapeHtml(name)} →
          </a>
        </div>
      </div>
      <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="color:#475569;font-size:12px;margin:0;">Sent via portfolio · ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/* ─── ROUTES ─────────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/contact', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  if (rateLimit(ip)) {
    return res.status(429).json({ success: false, message: 'Too many requests. Please wait 15 minutes.' });
  }

  const { name, email, subject, message } = req.body;

  if (!name    || name.trim().length    < 2)  return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
  if (!email   || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: 'Invalid email address.' });
  if (!subject || subject.trim().length < 2)  return res.status(400).json({ success: false, message: 'Subject is required.' });
  if (!message || message.trim().length < 10) return res.status(400).json({ success: false, message: 'Message must be at least 10 characters.' });

  const safe = {
    name:    name.trim().slice(0, 100),
    email:   email.trim().slice(0, 200),
    subject: subject.trim().slice(0, 200),
    message: message.trim().slice(0, 2000),
  };

  try {
    // Notify Priyanshu
    await resend.emails.send({
      from:     'Portfolio <onboarding@resend.dev>',
      to:       ['priyanshugupta14441@gmail.com'],
      reply_to: safe.email,
      subject:  `[Portfolio] ${safe.subject}`,
      html:     buildEmailHTML(safe.name, safe.email, safe.subject, safe.message),
    });

    // Auto-reply to sender
    await resend.emails.send({
      from:    'Priyanshu Gupta <onboarding@resend.dev>',
      to:      [safe.email],
      subject: `Got your message! Re: ${safe.subject}`,
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f1424;color:#f1f5f9;border-radius:12px;border:1px solid rgba(99,102,241,0.25)">
          <h2 style="color:#818cf8;margin-top:0">Hey ${escapeHtml(safe.name)} 👋</h2>
          <p>Thanks for reaching out! I've received your message and will get back to you within <strong>24 hours</strong>.</p>
          <p style="color:#94a3b8;font-size:14px">Your subject: <em>"${escapeHtml(safe.subject)}"</em></p>
          <hr style="border-color:rgba(255,255,255,0.08);margin:24px 0">
          <p style="color:#94a3b8;font-size:13px">— Priyanshu Gupta · Full Stack Developer</p>
          <a href="https://www.linkedin.com/in/psgupta712/" style="color:#6366f1;font-size:13px">LinkedIn</a> ·
          <a href="https://github.com/psgupta712" style="color:#6366f1;font-size:13px">GitHub</a>
        </div>`,
    });

    console.log(`📧 Message from ${safe.name} <${safe.email}> — "${safe.subject}"`);
    res.json({ success: true, message: 'Message sent! Check your inbox for a confirmation.' });

  } catch (err) {
    console.error('❌ Resend error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send. Please email me directly at priyanshugupta14441@gmail.com',
    });
  }
});

/* ─── START ──────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀 Portfolio backend running on port ${PORT}`);
  console.log(`   POST http://localhost:${PORT}/api/contact`);
  console.log(`   GET  http://localhost:${PORT}/api/health\n`);
});

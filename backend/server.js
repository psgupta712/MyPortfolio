/* ============================================================
   SERVER.JS — Contact Form Backend
   Stack: Node.js + Express + Nodemailer
   Sends email to priyanshugupta14441@gmail.com on form submit
   ============================================================ */

const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 3001;

/* ─── MIDDLEWARE ─────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow requests from your frontend (update origin in production)
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

/* ─── NODEMAILER TRANSPORTER ─────────────────────────────── */
// Uses Gmail App Password (see README for setup)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,   // your Gmail: priyanshugupta14441@gmail.com
    pass: process.env.SMTP_PASS,   // Gmail App Password (16-char, NOT your real password)
  },
});

// Verify connection on startup
transporter.verify((err) => {
  if (err) {
    console.error('❌ Mail transporter error:', err.message);
  } else {
    console.log('✅ Mail transporter ready');
  }
});

/* ─── RATE LIMIT (simple in-memory, no extra lib) ───────── */
const rateLimitMap = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const max = 3; // max 3 emails per IP per window

  const entry = rateLimitMap.get(ip) || { count: 0, start: now };

  if (now - entry.start > windowMs) {
    // Reset window
    rateLimitMap.set(ip, { count: 1, start: now });
    return false; // not limited
  }

  entry.count++;
  rateLimitMap.set(ip, entry);

  return entry.count > max; // true = blocked
}

/* ─── EMAIL TEMPLATES ────────────────────────────────────── */
function buildEmailHTML(name, email, subject, message) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Portfolio Message</title>
  <style>
    body { margin: 0; padding: 0; background: #0b0f19; font-family: 'Segoe UI', sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #0f1424; border: 1px solid rgba(99,102,241,0.3); border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #6366f1, #06b6d4); padding: 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .field { margin-bottom: 24px; }
    .label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #818cf8; margin-bottom: 6px; }
    .value { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 12px 16px; color: #f1f5f9; font-size: 15px; line-height: 1.6; }
    .message-value { white-space: pre-wrap; min-height: 80px; }
    .footer { padding: 20px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; }
    .footer p { color: #475569; font-size: 12px; margin: 0; }
    .reply-btn { display: inline-block; margin-top: 20px; padding: 12px 28px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>📬 New Portfolio Message</h1>
        <p>Someone reached out via your portfolio contact form</p>
      </div>
      <div class="body">
        <div class="field">
          <div class="label">From</div>
          <div class="value">${escapeHtml(name)}</div>
        </div>
        <div class="field">
          <div class="label">Email</div>
          <div class="value">${escapeHtml(email)}</div>
        </div>
        <div class="field">
          <div class="label">Subject</div>
          <div class="value">${escapeHtml(subject)}</div>
        </div>
        <div class="field">
          <div class="label">Message</div>
          <div class="value message-value">${escapeHtml(message)}</div>
        </div>
        <div style="text-align:center">
          <a href="mailto:${escapeHtml(email)}?subject=Re: ${encodeURIComponent(subject)}" class="reply-btn">
            Reply to ${escapeHtml(name)} →
          </a>
        </div>
      </div>
      <div class="footer">
        <p>Sent via psgupta.dev portfolio · ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ─── ROUTES ─────────────────────────────────────────────── */

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  // Rate limiting
  if (rateLimit(ip)) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait 15 minutes before trying again.',
    });
  }

  const { name, email, subject, message } = req.body;

  // Server-side validation
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Name must be at least 2 characters.' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }
  if (!subject || subject.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Subject is required.' });
  }
  if (!message || message.trim().length < 10) {
    return res.status(400).json({ success: false, message: 'Message must be at least 10 characters.' });
  }

  // Sanitize
  const safe = {
    name:    name.trim().slice(0, 100),
    email:   email.trim().slice(0, 200),
    subject: subject.trim().slice(0, 200),
    message: message.trim().slice(0, 2000),
  };

  try {
    // Email to Priyanshu
    await transporter.sendMail({
      from:    `"Portfolio Contact" <${process.env.SMTP_USER}>`,
      to:      'priyanshugupta14441@gmail.com',
      replyTo: safe.email,
      subject: `[Portfolio] ${safe.subject}`,
      text:    `From: ${safe.name} <${safe.email}>\n\n${safe.message}`,
      html:    buildEmailHTML(safe.name, safe.email, safe.subject, safe.message),
    });

    // Auto-reply to sender
    await transporter.sendMail({
      from:    `"Priyanshu Gupta" <${process.env.SMTP_USER}>`,
      to:      safe.email,
      subject: `Re: ${safe.subject} — Got your message!`,
      html: `
        <div style="font-family:'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f1424;color:#f1f5f9;border-radius:12px;border:1px solid rgba(99,102,241,0.25)">
          <h2 style="color:#818cf8;margin-top:0">Hey ${escapeHtml(safe.name)} 👋</h2>
          <p>Thanks for reaching out! I've received your message and will get back to you within <strong>24 hours</strong>.</p>
          <p style="color:#94a3b8;font-size:14px">Your message: <em>"${escapeHtml(safe.subject)}"</em></p>
          <hr style="border-color:rgba(255,255,255,0.08);margin:24px 0">
          <p style="color:#94a3b8;font-size:13px">— Priyanshu Gupta<br>Full Stack Developer</p>
          <a href="https://www.linkedin.com/in/psgupta712/" style="color:#6366f1;font-size:13px">LinkedIn</a> · 
          <a href="https://github.com/psgupta712" style="color:#6366f1;font-size:13px">GitHub</a>
        </div>
      `,
    });

    console.log(`📧 Contact from ${safe.name} <${safe.email}> — "${safe.subject}"`);

    res.json({
      success: true,
      message: 'Message sent successfully! Check your inbox for a confirmation.',
    });

  } catch (err) {
    console.error('❌ Mail send error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again or email me directly.',
    });
  }
});

/* ─── START ──────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🚀 Portfolio backend running on port ${PORT}`);
  console.log(`   POST http://localhost:${PORT}/api/contact`);
  console.log(`   GET  http://localhost:${PORT}/api/health\n`);
});

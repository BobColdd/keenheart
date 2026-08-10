require('dotenv').config({ quiet: true }); // quiet: suppress dotenv's own promotional console tips
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 4000; // 4000 by default to avoid the common clash with Grafana on 3000
const CONTACT_TO = process.env.CONTACT_TO || 'contact@keenheart.net';

// Render sits behind a proxy — trust it so req.secure / x-forwarded-proto work
app.set('trust proxy', true);

// Canonicalize to https://www.keenheart.net — redirects bare domain, http,
// and any other host variant to the one canonical URL used in meta tags,
// sitemap.xml and structured data. Skipped on localhost so local dev is
// unaffected.
app.use((req, res, next) => {
  const host = req.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  if (isLocal) return next();

  const isHttps = req.secure || req.get('x-forwarded-proto') === 'https';
  const isWww = host === 'www.keenheart.net';

  if (!isHttps || !isWww) {
    return res.redirect(301, `https://www.keenheart.net${req.originalUrl}`);
  }
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// SMTP transporter — reads credentials from .env (see .env.example)
// ---------------------------------------------------------------------------
let transporter = null;
const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587/others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
} else {
  console.warn(
    '[Keenheart] SMTP is not configured — form submissions will be logged to the ' +
    'console only, not emailed. Copy .env.example to .env and fill in your details.'
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/contact', async (req, res) => {
  const { name, phone, email, service, message } = req.body || {};

  if (!name || !phone || !service || !message) {
    return res.status(400).json({ error: 'Please fill in your name, phone, service and job details.' });
  }

  const trimmedEmail = email ? String(email).trim() : '';
  if (trimmedEmail && !EMAIL_RE.test(trimmedEmail)) {
    return res.status(400).json({ error: 'That email address doesn\'t look right — please check it or leave it blank.' });
  }

  const entry = {
    name: String(name).trim(),
    phone: String(phone).trim(),
    email: trimmedEmail || null,
    service: String(service).trim(),
    message: String(message).trim(),
    receivedAt: new Date().toISOString()
  };

  console.log('New contact request:', entry);

  if (!transporter) {
    // No SMTP configured — request is logged above but not emailed.
    return res.status(201).json({
      ok: true,
      message: 'Request received (email delivery is not configured yet).'
    });
  }

  try {
    await transporter.sendMail({
      from: `"Keenheart Website" <${process.env.SMTP_USER}>`,
      to: CONTACT_TO,
      replyTo: entry.email || undefined,
      subject: `New enquiry: ${entry.service} — ${entry.name}`,
      text:
        `New contact form submission\n\n` +
        `Name: ${entry.name}\n` +
        `Phone: ${entry.phone}\n` +
        `Email: ${entry.email || 'not provided'}\n` +
        `Service: ${entry.service}\n\n` +
        `Message:\n${entry.message}\n\n` +
        `Received: ${entry.receivedAt}`,
      html:
        `<h2>New contact form submission</h2>` +
        `<p><strong>Name:</strong> ${escapeHtml(entry.name)}</p>` +
        `<p><strong>Phone:</strong> ${escapeHtml(entry.phone)}</p>` +
        `<p><strong>Email:</strong> ${escapeHtml(entry.email || 'not provided')}</p>` +
        `<p><strong>Service:</strong> ${escapeHtml(entry.service)}</p>` +
        `<p><strong>Message:</strong><br>${escapeHtml(entry.message).replace(/\n/g, '<br>')}</p>` +
        `<p style="color:#888;font-size:12px;">Received: ${entry.receivedAt}</p>`
    });

    res.status(201).json({ ok: true, message: 'Request received and emailed.' });
  } catch (err) {
    console.error('Failed to send contact email:', err);
    res.status(502).json({
      error: 'Your request was received but the email could not be sent. We will still see it in the server logs.'
    });
  }
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

app.get('/health', (req, res) => res.json({ status: 'ok', smtpConfigured }));

app.listen(PORT, () => {
  console.log(`Keenheart Trading Enterprises Limited — site running at http://localhost:${PORT}`);
});

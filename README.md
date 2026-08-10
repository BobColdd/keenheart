# Keenheart Trading Enterprises Limited — Website

A Node.js + Express website for Keenheart Trading Enterprises Limited, covering
three service lines: software & IT systems, CCTV & security, and electrical
installations. Live domain: **keenheart.net**.

## Requirements
- Node.js 18+ and npm

## Local setup
```bash
npm install
cp .env.example .env
```
Then open `.env` and fill in your real SMTP details (see **Email setup** below).

```bash
npm start
```
Then open **http://localhost:4000** in your browser.

(Set a different port with `PORT=5000 npm start` if 4000 is taken. Port 3000 is
avoided here because it commonly clashes with tools like Grafana.)

## Email setup (Zoho Mail)
The contact form emails submissions to `contact@keenheart.net` (or whatever you
set as `CONTACT_TO`) using your Zoho Mail account to send them via SMTP.

1. Log in to Zoho Mail admin (or your Zoho account) → **Security** → **App
   Passwords** → generate a new one for "Mail" / this app. Don't use your
   normal Zoho login password — it won't work with SMTP if 2FA is on, and
   an app password is safer to store either way.
2. Set these values (already the defaults in `.env.example`):
   ```
   SMTP_HOST=smtp.zoho.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=contact@keenheart.net
   SMTP_PASS=your-zoho-app-specific-password
   CONTACT_TO=contact@keenheart.net
   ```
   If your Zoho account is on the EU or IN data center, use `smtp.zoho.eu` or
   `smtp.zoho.in` instead of `smtp.zoho.com`.
3. Restart the server. On startup it will no longer warn "SMTP is not
   configured" — submissions will be emailed to `CONTACT_TO`, with the
   customer's own email set as the reply-to address so you can reply directly.

**Without SMTP details filled in**, the site still works — submissions are
just logged to the server console instead of emailed.

**Never commit your real `.env` file.** On Render you won't use `.env` at
all — see the deployment section below.

## Deploying to Render

1. **Push this project to a GitHub repo** (Render deploys from Git, not a
   zip upload). Create a new repo, then:
   ```bash
   git init
   git add .
   git commit -m "Keenheart Trading Enterprises Limited website"
   git branch -M main
   git remote add origin https://github.com/your-username/keenheart.git
   git push -u origin main
   ```
   `.gitignore` already excludes `node_modules/`, `.env`, and log files.

2. **Create the Web Service on Render**
   - render.com → New → Web Service → connect the GitHub repo you just pushed.
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** whatever tier you're paying for — this app is light,
     the free/starter tier handles it fine.
   - Leave the Render-assigned URL (`keenheart.onrender.com`) as-is for now —
     you'll add your real domain after the first successful deploy.

3. **Set environment variables** on Render (Dashboard → your service →
   **Environment**) — this replaces the `.env` file entirely, don't upload it:
   ```
   SMTP_HOST=smtp.zoho.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=contact@keenheart.net
   SMTP_PASS=your-zoho-app-specific-password
   CONTACT_TO=contact@keenheart.net
   ```
   Don't set `PORT` — Render sets it automatically and `server.js` already
   reads `process.env.PORT`.

4. **Connect your domain (keenheart.net)**
   - Render → your service → **Settings** → **Custom Domains** → add
     `keenheart.net` and `www.keenheart.net`.
   - Render gives you DNS records to add (usually an `A`/`ANAME` record for
     the root domain and a `CNAME` for `www`). Add those in whichever
     registrar/DNS panel you bought the domain through.
   - DNS can take anywhere from a few minutes to a few hours to propagate.
     Render auto-issues an SSL certificate once it verifies the domain.

5. **Decide www vs. non-www** and stick to one. This project's meta tags,
   canonical link, and sitemap currently assume `https://www.keenheart.net/`.
   If you'd rather use the bare `keenheart.net` (no www), tell me and I'll
   update `index.html`, `robots.txt`, and `sitemap.xml` to match — search
   engines treat `www.keenheart.net` and `keenheart.net` as different URLs,
   so consistency here matters for SEO.

6. **After it's live**, go back to the earlier checklist: submit
   `https://www.keenheart.net/sitemap.xml` in Google Search Console, and set
   up your Google Business Profile with this same name, address and phone
   numbers so they match exactly.

## Project structure
```
keenheart/
├── server.js              Express server (static files + /api/contact, emails via SMTP)
├── .env.example            Template for your SMTP credentials — copy to .env locally
├── .gitignore              Excludes node_modules, .env, logs from Git
├── package.json
├── public/
│   ├── index.html         One-page site: hero, services, process, why-us, contact
│   ├── css/style.css      Design system (colors, type, layout, animation)
│   ├── js/main.js         Mobile nav, scroll reveal, contact form submit
│   ├── robots.txt         Crawler access + sitemap pointer
│   └── sitemap.xml        Tells search engines what pages exist
└── README.md
```

## Contact form
The form posts to `POST /api/contact`. Each submission is:
- logged to the server console, and
- emailed to `contact@keenheart.net` via your configured SMTP account
  (see **Email setup** above).

If SMTP isn't configured, it falls back to logging only — nothing crashes,
the form just won't send an email.

## Customizing
- **Colors, fonts, spacing** — all defined as CSS variables at the top of
  `public/css/style.css` (`:root { --orange: ...; --teal: ...; }` etc.)
- **Copy, phone number, address, hours** — edit directly in `public/index.html`.
- **Services offered** — each service is a `<article class="card">` block in
  the `#services` section of `index.html`.

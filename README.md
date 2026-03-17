# Priyanshu Gupta — Portfolio

Production-ready personal portfolio with a **real contact form backend** that sends emails directly to `priyanshugupta14441@gmail.com`.

---

## Project Structure

```
portfolio/
├── index.html              ← Main frontend
├── css/
│   ├── global.css          ← Design system & variables
│   ├── components.css      ← All UI components
│   └── animations.css      ← Scroll reveals, keyframes
├── js/
│   ├── utils.js            ← Helper functions
│   ├── animations.js       ← Intersection Observer, tilt, typing
│   └── main.js             ← Navbar, theme, form (with real API)
└── backend/
    ├── server.js           ← Express + Nodemailer server
    ├── package.json
    ├── .env.example        ← Copy to .env and fill values
    └── .gitignore
```

---

## ⚙️ Backend Setup (Email Contact Form)

### Step 1 — Install dependencies

```bash
cd backend
npm install
```

### Step 2 — Create Gmail App Password

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → **2-Step Verification** (must be turned ON)
3. Search **"App passwords"** in the search bar
4. Select app: **Mail** → Click **Generate**
5. Copy the **16-character code** (e.g. `abcd efgh ijkl mnop`)

### Step 3 — Create .env file

```bash
cp .env.example .env
```

Edit `.env`:

```env
SMTP_USER=priyanshugupta14441@gmail.com
SMTP_PASS=abcdefghijklmnop      # your 16-char app password (no spaces)
FRONTEND_URL=http://localhost:5500
PORT=3001
```

### Step 4 — Run the backend

```bash
npm start
# or for dev with auto-reload:
npm run dev
```

You should see:
```
✅ Mail transporter ready
🚀 Portfolio backend running on port 3001
```

### Step 5 — Test it

```bash
curl -X POST http://localhost:3001/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","subject":"Hello","message":"This is a test message"}'
```

---

## 🖥️ Running Frontend Locally

Open `index.html` in any browser OR use VS Code Live Server (port 5500).

The form will automatically connect to `http://localhost:3001`.

---

## 🚀 Deployment

### Frontend → Vercel (Recommended)

1. Push the entire `portfolio/` folder to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Framework: `Other` → Deploy

**After deploying**, update `API_BASE` in `js/main.js`:
```js
: 'https://YOUR-BACKEND-URL.onrender.com'
```

### Backend → Render (Free Tier)

1. Push `backend/` to a separate GitHub repo (or subfolder)
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your backend repo
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add **Environment Variables** in the Render dashboard:
   - `SMTP_USER` = `priyanshugupta14441@gmail.com`
   - `SMTP_PASS` = your app password
   - `FRONTEND_URL` = your Vercel URL
   - `PORT` = `3001`

### Alternative: Both on Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Set env vars in the Railway dashboard
3. Railway auto-detects Node.js and runs `npm start`

---

## 🔒 Security Notes

- **Never commit `.env`** to GitHub — it's in `.gitignore`
- The backend rate-limits to **3 messages per IP per 15 minutes**
- All inputs are sanitised server-side before sending
- HTML in emails is escaped to prevent injection

---

## 📧 What Happens When Someone Sends a Message

1. Frontend validates the form (client-side)
2. POST request sent to `/api/contact`
3. Server validates again (server-side)
4. You receive a **beautiful HTML email** at `priyanshugupta14441@gmail.com`
5. The sender receives an **auto-reply confirmation email**
6. Frontend shows a success state

---

## 📱 Features

- Dark/Light mode toggle (persisted in localStorage)
- Typing animation with 5 rotating roles
- 3D tilt on project cards
- Scroll-based reveal animations
- Project category filter
- Skill tabs with animated progress bars
- Fully responsive (mobile, tablet, desktop)
- Accessible (ARIA labels, keyboard navigation)
- SEO optimised (meta tags, OG, Twitter card)

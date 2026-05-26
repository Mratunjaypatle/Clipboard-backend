require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// ── CORS ──────────────────────────────────────────────────────────────────────
const normalise = (url) => (url || '').toLowerCase().replace(/\/$/, '').trim();

const isAllowedOrigin = (origin) => {
  // Non-browser requests (Postman, curl, mobile apps) have no origin — always allow
  if (!origin) return true;

  const o = normalise(origin);

  // 1. Exact match against CLIENT_URL set in .env / Render environment variables
  const clientUrl = normalise(process.env.CLIENT_URL);
  if (clientUrl && o === clientUrl) return true;

  // 2. localhost / 127.0.0.1 on any port — local development
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) return true;

  // 3. LAN IPs — for testing on phone over Wi-Fi
  if (/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(o)) return true;

  // 4. Any *.vercel.app subdomain — covers production + all preview deploys
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(o)) return true;

  // 5. Any *.netlify.app subdomain — in case you switch to Netlify
  if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(o)) return true;

  // 6. Any *.onrender.com — in case frontend is also on Render
  if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(o)) return true;

  console.warn(`[CORS] Blocked origin: "${origin}"  →  Add it to CLIENT_URL in server .env`);
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin "${origin}" is not allowed. Set CLIENT_URL in server .env`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());

// ── Static files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CloudClip API is running',
    time: new Date().toISOString(),
    clientUrl: process.env.CLIENT_URL || '(not set)',
  });
});

app.get("" , (req,res) =>
{
    res.json({
      message : "Server is running 💕🍂🙌"
    })
    console.log("Health is okay");

})

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 CloudClip API running on port ${PORT}`);
  console.log(`   Health:     http://localhost:${PORT}/api/health`);
  console.log(`   CLIENT_URL: ${process.env.CLIENT_URL || '(not set — trusted origins only)'}\n`);
});
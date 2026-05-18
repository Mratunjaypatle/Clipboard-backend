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

// ── CORS ────────────────────────────────────────────────────────────────────
// Normalise a URL for comparison: lowercase, strip trailing slash
const normalise = (url) => (url || '').toLowerCase().replace(/\/$/, '').trim();

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // non-browser clients (curl, Postman, mobile apps)

  const o = normalise(origin);

  // 1. Explicit CLIENT_URL match
  const clientUrl = normalise(process.env.CLIENT_URL);
  if (clientUrl && o === clientUrl) return true;

  // 2. localhost / 127.0.0.1 on any port — always allowed for development
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o)) return true;

  // 3. LAN IPs — 192.168.x.x, 10.x.x.x, 172.16-31.x.x
  if (/^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(o)) return true;

  // 4. Any *.netlify.app subdomain (covers preview deploys too)
  if (/^https:\/\/[a-z0-9-]+\.netlify\.app$/.test(o)) return true;

  // 5. Any *.onrender.com (in case you test frontend on Render too)
  if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(o)) return true;

  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: "${origin}"`);
      callback(new Error(`CORS: origin "${origin}" is not allowed. Set CLIENT_URL in server .env`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// ── Static files ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

app.get("", (req, res) => {
  res.send(" <h1> Project is running..👍 </h1>");
})

app.get("/api/member", (req, res) => {
  res.json({
    Member: "Mratunjay Patle"
  })
});

// Health check — visit this URL to confirm the server is awake
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CloudClip API is running',
    time: new Date().toISOString(),
    clientUrl: process.env.CLIENT_URL || '(not set)',
  });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 CloudClip API running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   CLIENT_URL:   ${process.env.CLIENT_URL || '(not set — all origins allowed)'}\n`);
});
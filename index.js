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

// Allow all origins in dev; in production set CLIENT_URL explicitly
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any origin in dev mode, or match CLIENT_URL in production
    const allowed = process.env.CLIENT_URL;
    if (!allowed || allowed === '*' || origin === allowed) {
      return callback(null, true);
    }
    // Also allow any LAN IP during development (192.168.x.x, 10.x.x.x, 172.x.x.x)
    const isLAN = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin);
    if (isLAN) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CloudClip API is running' });
});

app.use(errorHandler);

// Listen on all interfaces so LAN devices can reach the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: find your LAN IP with ipconfig/ifconfig`);
});

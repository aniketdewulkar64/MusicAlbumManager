require('dotenv').config();
const validateEnv = require('./config/envValidation');
validateEnv();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const connectDB = require('./db');
const { connectRedis } = require('./config/redis');
const { errorHandler } = require('./middleware/errorHandler');

const path = require('path');
const authRouter = require('./router/authRouter');
const albumRouter = require('./router/albumRouter');
const songRouter = require('./router/songRouter');
const reviewRouter = require('./router/reviewRouter');
const playlistRouter = require('./router/playlistRouter');
const userRouter = require('./router/userRouter');
const adminRouter = require('./router/adminRouter');
const creatorRouter = require('./router/creatorRouter');
const searchRouter = require('./router/searchRouter');

const app = express();

// =======================
// Security Middleware
// =======================
app.use(helmet());
app.use(
  cors({
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  })
);

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { status: 'fail', message: 'Too many requests from this IP' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

// =======================
// Body Parsing & Sanitization
// =======================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
// app.use(mongoSanitize());  // NoSQL injection prevention
// app.use(xss());            // XSS sanitization
// app.use(hpp());            // HTTP parameter pollution prevention
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// =======================
// Logging
// =======================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// =======================
// Routes
// =======================
app.use('/api/auth', authRouter);
app.use('/api/albums', albumRouter);
app.use('/api/songs', songRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/playlists', playlistRouter);
app.use('/api/users', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/creator', creatorRouter);
app.use('/api/search', searchRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.all('*path', (req, res, next) => {
  const { AppError } = require('./middleware/errorHandler');
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// =======================
// Global Error Handler
// =======================
app.use(errorHandler);

// =======================
// Start Server
// =======================
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDB();
  connectRedis(); // non-blocking, caching disabled if Redis unavailable
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
};

startServer();

module.exports = app;

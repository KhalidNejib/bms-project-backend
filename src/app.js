import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { connectMongoDB } from './config/mongodb.js';
import db from './config/mysql.js'; 
import testRoutes from './experiment/routers/test.js';
import authRoutes from './routers/authRoutes.js';

// Add after other middleware
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ========== MIDDLEWARE ORDER IS CRITICAL ==========

// 1. Security middleware FIRST
app.use(helmet());

// 2. Body parsing
app.use(express.json());

// 3. Rate limiting (should be after body parsing for POST routes)
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute for testing
  limit: 5,
  message: { 
    error: 'rate_limit_exceeded',
    message: 'Too many requests. Try again in a minute.',
    code: 'RATE_LIMIT'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Add validation
  validate: { xForwardedForHeader: false }
});

app.use(globalLimiter);

// 4. Logging (AFTER rate limiting)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 5. Routes
app.use("/test", testRoutes);

app.use('/api/v1/auth', authRoutes);

// ========== HEALTH ENDPOINT ==========
app.get('/health', async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.status(200).json({ 
      status: 'ok', 
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      // Add rate limit info for debugging
      rateLimit: {
        limit: req.rateLimit?.limit || 'unknown',
        current: req.rateLimit?.current || 'unknown',
        remaining: req.rateLimit?.remaining || 'unknown'
      }
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'MySQL connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// ========== START SERVER ==========
const startServer = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await connectMongoDB();
    
    console.log('🔄 Testing MySQL...');
    await db.query("SELECT 1");
    console.log('✅ MySQL ready');
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔒 Rate limit: 5 requests per minute`);
      console.log(`📊 Test with: for i in {1..7}; do curl -s http://localhost:${PORT}/health | jq -r '.message'; echo; done`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
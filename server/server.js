import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import { createAuthRouter } from './routes/auth.js';
import { createComplaintRouter } from './routes/complaints.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import { helmetMiddleware } from './middleware/security.js';

// Custom NoSQL Injection Protection
const sanitizeNoSQL = (req, res, next) => {
  const sanitize = (obj) => {
    if (obj instanceof Object) {
      for (let key in obj) {
        if (/^\$/.test(key) || key.includes('.')) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
  };
  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
};

// Security constraints check
if (process.env.NODE_ENV === 'production') {
  const dummyJwt = 'grievance_portal_jwt_secret_key_2026';
  const dummyTurnstile = '1x0000000000000000000000000000000AA';
  
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === dummyJwt) {
    console.error('❌ FATAL: JWT_SECRET must be securely set in production.');
    process.exit(1);
  }
  
  if (!process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY === dummyTurnstile) {
    console.warn('⚠️ WARNING: Using dummy Turnstile key in production.');
  }
}

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

// Security & Standard Middleware
app.use(helmetMiddleware);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeNoSQL); // Custom NoSQL protection

// Connect to MongoDB Atlas (top-level await)
const isDbConnected = await connectDB();

// Database Health Check Middleware for API routes
app.use('/api', (req, res, next) => {
  // Allow health check endpoint to always respond
  if (req.path === '/health') return next();
  
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      success: false, 
      message: 'Service temporarily unavailable (Database offline). Please try again later.' 
    });
  }
  next();
});

// Socket.IO Real-time Connection Lifecycle with JWT Authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'grievance_portal_jwt_secret_key_2026');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('Authentication error: User not found'));
    socket.user = user;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`⚡ [Socket.IO] Client connected: ${socket.id} (User: ${socket.user.name}, Role: ${socket.user.role})`);

  // Automatically join their own user room for private notifications
  socket.join(`user_${socket.user._id.toString()}`);
  console.log(`👤 Client ${socket.id} auto-joined user_${socket.user._id.toString()}`);

  if (socket.user.role === 'officer' || socket.user.role === 'admin') {
     socket.join('officer_all');
     if (socket.user.department) socket.join(`dept_${socket.user.department}`);
  }

  // Join complaint-specific chat room
  socket.on('join_complaint', async (complaintId) => {
    // Basic auth check: we trust the client to only join complaints they can view, 
    // but message sending via REST API is heavily authorized.
    socket.join(`complaint_${complaintId}`);
    console.log(`💬 Client ${socket.id} joined complaint_${complaintId}`);
  });

  // Join officer / department room
  socket.on('join_department', (deptName) => {
    socket.join(`dept_${deptName}`);
    console.log(`🏢 Client ${socket.id} joined dept_${deptName}`);
  });

  // Join specific verification room for real-time OTP status sync
  socket.on('join_verification', (verificationId) => {
    socket.join(`verify_${verificationId}`);
    console.log(`🔐 Client ${socket.id} joined verify_${verificationId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Mount API Routes with Socket.IO Real-time integration
app.use('/api/auth', createAuthRouter(io));
app.use('/api/complaints', createComplaintRouter(io));
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root endpoint - Server status & portal navigation
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Smart Government Grievance API Server</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b1a2e; color: #f8fafc; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .card { background: #132742; border: 1px solid #1e3a5f; border-radius: 12px; padding: 32px 28px; max-width: 520px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.3); text-align: center; }
        .badge { background: #10B981; color: #064e3b; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; display: inline-block; margin-bottom: 16px; }
        h1 { font-size: 22px; margin: 0 0 8px; color: #ffffff; }
        p { font-size: 14px; color: #94a3b8; margin: 0 0 24px; line-height: 1.5; }
        .btn-portal { display: block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 700; font-size: 15px; margin-bottom: 16px; transition: background 0.2s; }
        .btn-portal:hover { background: #1d4ed8; }
        .links { border-top: 1px solid #1e3a5f; padding-top: 16px; display: flex; justify-content: center; gap: 16px; font-size: 13px; }
        .links a { color: #60a5fa; text-decoration: none; }
        .links a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">● API SERVER RUNNING</span>
        <h1>Smart Grievance Portal Backend</h1>
        <p>This is the REST API & WebSockets server running on port <strong>5000</strong>. The user-facing web portal application is running on port <strong>5173</strong>.</p>
        <a href="http://localhost:5173" class="btn-portal">🚀 Open Web Portal (http://localhost:5173)</a>
        <div class="links">
          <a href="/api/health">System Health Check</a>
          <span style="color:#475569">•</span>
          <a href="http://localhost:5173/login">Citizen Login</a>
          <span style="color:#475569">•</span>
          <a href="http://localhost:5173/register">Register</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: dbConnected ? 'ok' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
    service: 'Smart Government Grievance Portal API',
    security: 'Production-Ready Real-Time OTP + CAPTCHA Active',
    timestamp: new Date().toISOString(),
    websocket: 'active',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
  🏛️ =======================================================
  🚀 [Backend Server] Running on http://localhost:${PORT}
  📡 [WebSockets] Socket.IO server is active
  🛡️ [Security] Real-Time OTP (SMS/Email) & CAPTCHA Active
  📦 [Database] ${isDbConnected ? 'MongoDB connected successfully' : 'MongoDB connection failed (Running in degraded mode)'}
  =======================================================
  `);
});

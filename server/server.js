import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { createAuthRouter } from './routes/auth.js';
import { createComplaintRouter } from './routes/complaints.js';
import analyticsRoutes from './routes/analytics.js';
import { helmetMiddleware } from './middleware/security.js';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

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

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'grievance_portal_jwt_secret_key_2026');
      const user = await User.findById(decoded.id).select('_id name role department');
      if (user) {
        socket.user = user;
      }
    }
    next();
  } catch (err) {
    // allow connection for public tracking/OTP
    next();
  }
});

// Security & Standard Middleware
app.use(helmetMiddleware);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB Atlas
connectDB();

// Socket.IO Real-time Connection Lifecycle
io.on('connection', (socket) => {
  console.log(`⚡ [Socket.IO] Client connected: ${socket.id}`);

  // Automatically join rooms for authenticated socket
  if (socket.user) {
    const userId = socket.user._id.toString();
    socket.join(`user:${userId}`);
    socket.join(`user_${userId}`);
    console.log(`👤 Client ${socket.id} joined authenticated room user:${userId}`);

    if (socket.user.role === 'admin') {
      socket.join('role:admin');
    } else if (socket.user.role === 'officer') {
      socket.join('role:officer');
      socket.join(`officer:${userId}`);
      if (socket.user.department) {
        socket.join(`dept:${socket.user.department}`);
      }
    }
  }

  // Allow client to authenticate after connect without reconnecting
  socket.on('authenticate', async (token) => {
    try {
      if (!token) return;
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'grievance_portal_jwt_secret_key_2026');
      const user = await User.findById(decoded.id).select('_id name role department');
      if (user) {
        socket.user = user;
        const userId = user._id.toString();
        socket.join(`user:${userId}`);
        socket.join(`user_${userId}`);
        if (user.role === 'admin') socket.join('role:admin');
        if (user.role === 'officer') {
          socket.join('role:officer');
          socket.join(`officer:${userId}`);
          if (user.department) socket.join(`dept:${user.department}`);
        }
        console.log(`🔐 Client ${socket.id} authenticated as user:${userId}`);
        socket.emit('authenticated', { success: true, userId, role: user.role });
      }
    } catch (e) {
      socket.emit('authenticated', { success: false, error: 'Invalid token' });
    }
  });

  // Client leaving room on logout
  socket.on('logout', () => {
    if (socket.user) {
      const userId = socket.user._id.toString();
      socket.leave(`user:${userId}`);
      socket.leave(`user_${userId}`);
      socket.leave('role:admin');
      socket.leave('role:officer');
      socket.leave(`officer:${userId}`);
      if (socket.user.department) socket.leave(`dept:${socket.user.department}`);
      socket.user = null;
      console.log(`🚪 Client ${socket.id} logged out of socket rooms`);
    }
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
  res.json({
    status: 'ok',
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
  📦 [Database] MongoDB Atlas connection initializing...
  =======================================================
  `);
});

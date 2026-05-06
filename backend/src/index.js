require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const passport = require('./config/passport');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to SKILLX Backend API', 
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'SKILLX API' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/skills', require('./routes/skills'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/disputes', require('./routes/disputes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/matching', require('./routes/matching'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

// ===== SOCKET.IO — Session Chat =====
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userEmail = decoded.email;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// Track session rooms: sessionId -> Set of user IDs
const sessionRooms = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 User ${socket.userId} connected`);

  socket.on('join-session', (sessionId) => {
    const room = `session:${sessionId}`;
    socket.join(room);
    if (!sessionRooms.has(sessionId)) sessionRooms.set(sessionId, new Set());
    sessionRooms.get(sessionId).add(socket.userId);
    io.to(room).emit('user-joined', { userId: socket.userId });
    console.log(`👥 User ${socket.userId} joined session ${sessionId}`);
  });

  socket.on('chat-message', ({ sessionId, text, userName }) => {
    const room = `session:${sessionId}`;
    const msg = {
      userId: socket.userId,
      userName,
      text,
      timestamp: Date.now(),
    };
    // Broadcast to everyone in room except sender
    socket.to(room).emit('chat-message', msg);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User ${socket.userId} disconnected`);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 SKILLX Backend running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO enabled for real-time sessions`);
  console.log(`🔑 JWT auth active\n`);
});

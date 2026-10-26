import dotenv from 'dotenv';
import express from 'express';
import connectDB from "./config/db.js";
import authRoutes from './routes/authRoutes.js';
import session from 'express-session';
import passport from './config/passport.js';
import messageRoutes from './routes/messageRoutes.js';
import http from 'http';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_ORIGIN = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: JWT_SECRET || 'auralis_dev_secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'auralis-back' });
});

app.use('/api/auth', authRoutes);
app.use('/api/message', messageRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo falló' });
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No autorizado'));

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('No autorizado'));
    socket.user = decoded;
    next();
  });
});

io.on('connection', (socket) => {
  console.info(`Usuario conectado: ${socket.user.username}`);

  socket.on('disconnect', () => {
    console.info(`Usuario desconectado: ${socket.user.username}`);
  });
});

const ready = connectDB();

if (process.env.NODE_ENV !== 'test') {
  ready.then(() => {
    server.listen(PORT, () => {
      console.info(`Servidor corriendo en el puerto ${PORT}`);
    });
  });
}

export { app, server, io, ready };

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/auralis_test';
process.env.JWT_SECRET = 'auralis_test_secret';
process.env.CLIENT_ORIGIN = 'http://localhost:3000';

import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { io as ioClient } from 'socket.io-client';

const { server, ready } = await import('../app.js');

await ready;
await mongoose.connection.dropDatabase();

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

const request = async (path, { method = 'GET', token, body } = {}) => {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  return { status: response.status, data };
};

const sockets = [];

test.after(async () => {
  sockets.forEach((socket) => socket.disconnect());
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await new Promise((resolve) => server.close(resolve));
});

test('registra un estudiante y rechaza roles o usuarios inválidos', async () => {
  const created = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Camila Soto',
      username: 'camila.soto',
      password: 'aula123',
      status: true,
      role: 'estudiante',
    },
  });

  assert.equal(created.status, 201);
  assert.equal(created.data.user.role, 'estudiante');
  assert.equal(created.data.user.password, undefined);

  const duplicated = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Camila Soto',
      username: 'camila.soto',
      password: 'aula123',
      role: 'estudiante',
    },
  });
  assert.equal(duplicated.status, 409);

  const invalidRole = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Otra persona',
      username: 'otra.persona',
      password: 'aula123',
      role: 'admin',
    },
  });
  assert.equal(invalidRole.status, 400);
});

test('solo una sesión válida consulta y publica en el chat', async () => {
  const moderator = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Nora Díaz',
      username: 'nora.diaz',
      password: 'aula123',
      role: 'moderador',
    },
  });
  assert.equal(moderator.status, 201);

  const deniedLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'nora.diaz', password: 'incorrecta' },
  });
  assert.equal(deniedLogin.status, 401);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'nora.diaz', password: 'aula123' },
  });
  assert.equal(login.status, 200);
  assert.equal(login.data.user.role, 'moderador');
  assert.equal(login.data.user.password, undefined);

  const studentLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'camila.soto', password: 'aula123' },
  });

  const hidden = await request('/api/message/getAll');
  assert.equal(hidden.status, 401);

  const socket = ioClient(base, {
    transports: ['websocket'],
    auth: { token: studentLogin.data.token },
  });
  sockets.push(socket);

  const received = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('El mensaje no llegó por socket')), 5000);
    socket.on('message', (message) => {
      clearTimeout(timer);
      resolve(message);
    });
  });

  await new Promise((resolve, reject) => {
    socket.on('connect', resolve);
    socket.on('connect_error', reject);
  });

  const posted = await request('/api/message/store', {
    method: 'POST',
    token: login.data.token,
    body: { text: 'Bienvenidos a la clase', created_by: 'cliente-no-confiable' },
  });
  assert.equal(posted.status, 201);
  assert.equal(posted.data.text, 'Bienvenidos a la clase');
  assert.equal(posted.data.created_by.name, 'Nora Díaz');
  assert.equal(posted.data.created_by.role, 'moderador');
  assert.equal(posted.data.created_by.password, undefined);

  const live = await received;
  assert.equal(live.text, 'Bienvenidos a la clase');
  assert.equal(live.created_by.role, 'moderador');

  const history = await request('/api/message/getAll', { token: studentLogin.data.token });
  assert.equal(history.status, 200);
  assert.equal(history.data.length, 1);
  assert.equal(history.data[0].created_by.username, 'nora.diaz');
});

test('un socket sin token no entra al chat', async () => {
  const socket = ioClient(base, {
    transports: ['websocket'],
    auth: {},
  });
  sockets.push(socket);

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('El socket anónimo no fue rechazado')), 5000);
    socket.on('connect', () => {
      clearTimeout(timer);
      reject(new Error('El socket anónimo no debió conectarse'));
    });
    socket.on('connect_error', () => {
      clearTimeout(timer);
      resolve();
    });
  });
});

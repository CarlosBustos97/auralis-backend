import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const ROLES = ['estudiante', 'moderador'];

const httpError = (message, status) => Object.assign(new Error(message), { status });

const registerUser = async (name, username, password, status, role) => {
  const cleanName = (name || '').trim();
  const cleanUsername = (username || '').trim();
  const cleanRole = (role || '').trim().toLowerCase();

  if (!cleanName) throw httpError('El nombre es obligatorio', 400);
  if (!cleanUsername) throw httpError('El usuario es obligatorio', 400);
  if (!password || String(password).length < 4) {
    throw httpError('La contraseña debe tener al menos 4 caracteres', 400);
  }
  if (!ROLES.includes(cleanRole)) {
    throw httpError('El rol debe ser estudiante o moderador', 400);
  }

  const exists = await User.findOne({ username: cleanUsername });
  if (exists) throw httpError('El usuario ya existe', 409);

  const user = new User({
    name: cleanName,
    username: cleanUsername,
    password,
    status: status !== false,
    role: cleanRole,
  });
  await user.save();
  return user;
};

const authenticateUser = async (username, password) => {
  const user = await User.findOne({ username: (username || '').trim() });
  if (!user || !user.status) return null;

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return null;

  const token = jwt.sign(
    {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return { user, token };
};

const getUserById = async (id) => User.findById(id);

export { registerUser, authenticateUser, getUserById };

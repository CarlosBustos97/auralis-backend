import { registerUser, authenticateUser, getUserById } from '../services/authService.js';

const register = async (req, res) => {
  try {
    const { name, username, password, status, role } = req.body;
    const user = await registerUser(name, username, password, status, role);
    res.status(201).json({ message: 'Usuario registrado', user });
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authenticateUser(username, password);
    if (!result) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    res.status(200).json({ token: result.token, user: result.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en la autenticación' });
  }
};

const me = async (req, res) => {
  const user = await getUserById(req.user.id);
  if (!user || !user.status) {
    return res.status(401).json({ message: 'No autorizado' });
  }
  res.status(200).json({ user });
};

export { register, login, me };

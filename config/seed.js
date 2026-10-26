import User from '../models/User.js';

const demoUsers = [
  {
    name: 'Ana Ríos',
    username: 'ana.rios',
    password: 'aula123',
    status: true,
    role: 'moderador',
  },
  {
    name: 'Leo Martínez',
    username: 'leo.martinez',
    password: 'aula123',
    status: true,
    role: 'estudiante',
  },
];

const seedUsers = async () => {
  const count = await User.countDocuments();
  if (count > 0) return;

  await User.create(demoUsers);
  console.info('Usuarios de demostración creados');
};

export { seedUsers };

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { seedUsers } from './seed.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.info('Conexión establecida');
    if (process.env.NODE_ENV !== 'test') {
      await seedUsers();
    }
  } catch (error) {
    console.error('Error de conexión', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;

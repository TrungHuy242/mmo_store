import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(config.mongoUri);
    console.log('[db] Da ket noi MongoDB');
  } catch (err) {
    console.error('[db] Loi ket noi MongoDB:', err.message);
    process.exit(1);
  }
}

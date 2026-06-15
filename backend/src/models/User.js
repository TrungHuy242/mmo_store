import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // So du vi (VND) - dung de mua hang / nhan hoa hong
    balance: { type: Number, default: 0 },

    // Affiliate
    refCode: { type: String, unique: true, index: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    commissionBalance: { type: Number, default: 0 },

    // Telegram
    telegramId: { type: String, default: null, index: true },
    telegramUsername: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);

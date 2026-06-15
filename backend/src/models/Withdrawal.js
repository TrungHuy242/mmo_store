import mongoose from 'mongoose';

const withdrawalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, default: 'bank' },
    details: { type: String, default: '' }, // STK / dia chi vi
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Withdrawal', withdrawalSchema);

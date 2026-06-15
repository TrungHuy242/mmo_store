import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },

    // Ma don duy nhat dung de doi chieu thanh toan (memo / noi dung CK)
    code: { type: String, required: true, unique: true, index: true },

    paymentMethod: { type: String, enum: ['balance', 'usdt', 'bank', 'card'], required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'delivered', 'cancelled', 'failed'],
      default: 'pending',
      index: true,
    },

    // Du lieu da giao (snapshot, da giai ma de hien thi cho user da mua)
    deliveredItems: { type: [String], default: [] },
    deliveredAt: { type: Date, default: null },

    // Thong tin thanh toan bo sung (vd: so tien USDT unique, txid...)
    paymentMeta: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Affiliate: hoa hong da chi cho nguoi gioi thieu
    commissionPaid: { type: Number, default: 0 },
    affiliate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);

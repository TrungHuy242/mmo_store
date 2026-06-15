import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/crypto.js';

// Moi mat hang ton kho la 1 'stock item' (vd: 1 tai khoan, 1 proxy string).
// Du lieu nhay cam duoc ma hoa AES truoc khi luu.
const stockItemSchema = new mongoose.Schema(
  {
    // Du lieu giao hang da ma hoa (text: user|pass, proxy string; file: link tai)
    payloadEnc: { type: String, required: true },
    sold: { type: Boolean, default: false },
    soldTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: '' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },

    // text = giao chuoi (user/pass, proxy); file = giao link tai
    deliveryType: { type: String, enum: ['text', 'file'], default: 'text' },

    // Kho hang: moi phan tu giao cho 1 don
    stockItems: { type: [stockItemSchema], default: [] },

    isActive: { type: Boolean, default: true },

    // Flash sale (optional)
    flashSale: {
      enabled: { type: Boolean, default: false },
      salePrice: { type: Number, default: 0 },
      endsAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// So luong ton kho con lai (chua ban)
productSchema.virtual('stock').get(function () {
  return this.stockItems.filter((s) => !s.sold).length;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Helper them stock (ma hoa truoc khi luu)
productSchema.methods.addStock = function (payloads = []) {
  for (const p of payloads) {
    this.stockItems.push({ payloadEnc: encrypt(p), sold: false });
  }
};

// Helper giai ma 1 stock item
productSchema.methods.decryptItem = function (item) {
  return decrypt(item.payloadEnc);
};

export default mongoose.model('Product', productSchema);

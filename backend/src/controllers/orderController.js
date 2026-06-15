import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { fulfillOrder } from '../services/deliveryService.js';
import { buildVietQrUrl } from '../services/payment/vietqrService.js';

function genOrderCode() {
  return 'MMO' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Tao don hang moi
export async function createOrder(req, res) {
  const { productId, quantity = 1, paymentMethod } = req.body;
  const product = await Product.findById(productId);
  if (!product || !product.isActive) return res.status(404).json({ message: 'San pham khong kha dung' });
  if (product.stock < quantity) return res.status(400).json({ message: 'Khong du hang trong kho' });

  const unitPrice = product.flashSale?.enabled && product.flashSale.endsAt > new Date()
    ? product.flashSale.salePrice : product.price;
  const totalAmount = unitPrice * quantity;

  let code = genOrderCode();
  while (await Order.findOne({ code })) code = genOrderCode();

  const order = await Order.create({
    user: req.user._id,
    product: product._id,
    productName: product.name,
    quantity,
    unitPrice,
    totalAmount,
    code,
    paymentMethod,
    status: 'pending',
  });

  // Thanh toan bang so du -> giao ngay
  if (paymentMethod === 'balance') {
    const user = await User.findById(req.user._id);
    if (user.balance < totalAmount) {
      await Order.findByIdAndDelete(order._id);
      return res.status(400).json({ message: 'So du khong du' });
    }
    user.balance -= totalAmount;
    await user.save();
    order.status = 'paid';
    await order.save();
    await fulfillOrder(order);
    return res.status(201).json({ order, paid: true });
  }

  // Thanh toan thu cong / tu dong -> tra ve huong dan
  const payment = buildPaymentInstructions(order);
  res.status(201).json({ order, payment });
}

function buildPaymentInstructions(order) {
  if (order.paymentMethod === 'bank') {
    return {
      method: 'bank',
      qrUrl: buildVietQrUrl({ amount: order.totalAmount, addInfo: order.code }),
      note: `Chuyen khoan voi noi dung: ${order.code}`,
    };
  }
  if (order.paymentMethod === 'usdt') {
    return {
      method: 'usdt',
      note: `Chuyen dung so tien USDT tuong ung. Doi chieu tu dong qua TronGrid.`,
      amount: order.totalAmount,
    };
  }
  if (order.paymentMethod === 'card') {
    return { method: 'card', note: 'Nhap thong tin the cao de gach the.' };
  }
  return {};
}

// Lich su don cua user
export async function myOrders(req, res) {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
}

export async function getOrder(req, res) {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) return res.status(404).json({ message: 'Khong tim thay don hang' });
  res.json(order);
}

import crypto from 'crypto';
import { createOrder as createOrderRecord, deleteOrderById, findOrderByCode, findOrderByIdAndUser, findOrdersByUser, updateOrder } from '../repositories/orderRepository.js';
import { findProductById } from '../repositories/productRepository.js';
import { findUserById, updateUser } from '../repositories/userRepository.js';
import { fulfillOrder } from '../services/deliveryService.js';
import { buildVietQrUrl } from '../services/payment/vietqrService.js';

function genOrderCode() {
  return 'MMO' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

// Tao don hang moi
export async function createOrder(req, res) {
  const { productId, quantity = 1, paymentMethod } = req.body;
  const product = await findProductById(productId);
  if (!product || !product.isActive) return res.status(404).json({ message: 'Sản phẩm không khả dụng' });
  if (product.stock < quantity) return res.status(400).json({ message: 'Không đủ hàng trong kho' });

  const now = new Date();
  const unitPrice = product.flashSale?.enabled && product.flashSale.endsAt && new Date(product.flashSale.endsAt) > now
    ? product.flashSale.salePrice : product.price;
  const totalAmount = unitPrice * quantity;

  let code = genOrderCode();
  while (await findOrderByCode(code)) code = genOrderCode();

  const order = await createOrderRecord({
    userId: req.user.id,
    productId: product.id,
    productName: product.name,
    quantity,
    unitPrice,
    totalAmount,
    code,
    paymentMethod,
    status: 'pending',
    paymentMeta: {},
  });

  if (paymentMethod === 'balance') {
    const user = await findUserById(req.user.id);
    if (!user || user.balance < totalAmount) {
      await deleteOrderById(order.id);
      return res.status(400).json({ message: 'Số dư không đủ' });
    }
    await updateUser(user.id, { balance: user.balance - totalAmount });
    const paidOrder = await updateOrder(order.id, { status: 'paid' });
    await fulfillOrder(paidOrder);
    return res.status(201).json({ order: paidOrder, paid: true });
  }

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
      note: 'Chuyen dung so tien USDT tuong ung. Doi chieu tu dong qua TronGrid.',
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
  const orders = await findOrdersByUser(req.user.id);
  res.json(orders);
}

export async function getOrder(req, res) {
  const order = await findOrderByIdAndUser(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
  res.json(order);
}

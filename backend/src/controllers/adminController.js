import ExcelJS from 'exceljs';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Withdrawal from '../models/Withdrawal.js';
import { fulfillOrder } from '../services/deliveryService.js';
import { sendTelegram } from '../services/telegramService.js';

export async function listOrders(req, res) {
  const orders = await Order.find().populate('user', 'email').sort({ createdAt: -1 }).limit(500);
  res.json(orders);
}

// Admin danh dau don da thanh toan (cho bank/card thu cong)
export async function markPaid(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Khong tim thay don' });
  if (order.status === 'delivered') return res.json({ order, message: 'Don da giao' });
  order.status = 'paid';
  await order.save();
  await fulfillOrder(order);
  res.json({ order, message: 'Da xac nhan va giao hang' });
}

export async function listUsers(req, res) {
  const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(500);
  res.json(users);
}

export async function adjustBalance(req, res) {
  const { amount, field = 'balance' } = req.body; // field: balance | commissionBalance
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Khong tim thay user' });
  user[field] = (user[field] || 0) + Number(amount);
  await user.save();
  res.json({ message: 'Da cap nhat', user: { id: user._id, balance: user.balance, commissionBalance: user.commissionBalance } });
}

// Export don hang ra Excel
export async function exportOrders(req, res) {
  const orders = await Order.find().populate('user', 'email').sort({ createdAt: -1 });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Orders');
  ws.columns = [
    { header: 'Ma don', key: 'code', width: 16 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'San pham', key: 'productName', width: 30 },
    { header: 'SL', key: 'quantity', width: 8 },
    { header: 'Tong tien', key: 'totalAmount', width: 14 },
    { header: 'PT thanh toan', key: 'paymentMethod', width: 14 },
    { header: 'Trang thai', key: 'status', width: 14 },
    { header: 'Ngay tao', key: 'createdAt', width: 22 },
  ];
  orders.forEach((o) => ws.addRow({
    code: o.code,
    email: o.user?.email || '',
    productName: o.productName,
    quantity: o.quantity,
    totalAmount: o.totalAmount,
    paymentMethod: o.paymentMethod,
    status: o.status,
    createdAt: o.createdAt?.toISOString(),
  }));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=orders.xlsx');
  await wb.xlsx.write(res);
  res.end();
}

// Broadcast telegram toi tat ca user da link
export async function broadcast(req, res) {
  const { message } = req.body;
  const users = await User.find({ telegramId: { $ne: null } }).select('telegramId');
  let sent = 0;
  for (const u of users) {
    const ok = await sendTelegram(u.telegramId, message);
    if (ok) sent++;
  }
  res.json({ message: `Da gui toi ${sent}/${users.length} user` });
}

// Quan ly rut tien
export async function listWithdrawals(req, res) {
  const items = await Withdrawal.find().populate('user', 'email').sort({ createdAt: -1 });
  res.json(items);
}

export async function resolveWithdrawal(req, res) {
  const { action, note } = req.body; // approve | reject
  const w = await Withdrawal.findById(req.params.id);
  if (!w) return res.status(404).json({ message: 'Khong tim thay yeu cau' });
  if (w.status !== 'pending') return res.status(400).json({ message: 'Yeu cau da xu ly' });
  if (action === 'approve') {
    w.status = 'approved';
  } else {
    // Hoan lai hoa hong neu tu choi
    await User.findByIdAndUpdate(w.user, { $inc: { commissionBalance: w.amount } });
    w.status = 'rejected';
  }
  w.note = note || '';
  await w.save();
  res.json({ message: 'Da xu ly', withdrawal: w });
}

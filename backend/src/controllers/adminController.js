import ExcelJS from 'exceljs';
import { fulfillOrder } from '../services/deliveryService.js';
import { sendTelegram } from '../services/telegramService.js';
import { findOrderById, listOrders as fetchOrderList, updateOrder, countOrders, sumRevenue, listRecentOrders } from '../repositories/orderRepository.js';
import { findUserById, listUsers as fetchUsers, listUsersWithTelegram, updateUser, countUsers } from '../repositories/userRepository.js';
import { countProducts } from '../repositories/productRepository.js';
import { findWithdrawalById, listWithdrawals as fetchWithdrawals, updateWithdrawal } from '../repositories/withdrawalRepository.js';

export async function getStats(req, res) {
  const [totalOrders, totalRevenue, totalUsers, totalProducts, recentOrders] = await Promise.all([
    countOrders(),
    sumRevenue(),
    countUsers(),
    countProducts(),
    listRecentOrders(10),
  ]);
  res.json({
    totalOrders,
    totalRevenue,
    totalUsers,
    totalProducts,
    recentOrders,
  });
}

export async function listOrders(req, res) {
  const orders = await fetchOrderList();
  res.json(orders);
}

// Admin danh dau don da thanh toan (cho bank/card thu cong)
export async function markPaid(req, res) {
  const order = await findOrderById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn' });
  if (order.status === 'delivered') return res.json({ order, message: 'Đơn đã giao' });
  const updated = await updateOrder(order.id, { status: 'paid' });
  await fulfillOrder(updated);
  res.json({ order: updated, message: 'Đã xác nhận và giao hàng' });
}

export async function listUsers(req, res) {
  const users = await fetchUsers();
  res.json(users);
}

export async function adjustBalance(req, res) {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ message: 'ID người dùng không hợp lệ' });
  }
  const { amount, field = 'balance' } = req.body; // field: balance | commissionBalance
  const user = await findUserById(id);
  if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
  const update = {};
  update[field] = (user[field] || 0) + Number(amount);
  const updatedUser = await updateUser(user.id, update);
  res.json({ message: 'Đã cập nhật', user: { id: updatedUser.id, balance: updatedUser.balance, commissionBalance: updatedUser.commissionBalance } });
}

// Export don hang ra Excel
export async function exportOrders(req, res) {
  const orders = await fetchOrderList();
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
    email: o.userEmail || '',
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
  const users = await listUsersWithTelegram();
  let sent = 0;
  for (const u of users) {
    const ok = await sendTelegram(u.telegramId, message);
    if (ok) sent++;
  }
  res.json({ message: `Da gui toi ${sent}/${users.length} user` });
}

// Quan ly rut tien
export async function listWithdrawals(req, res) {
  const items = await fetchWithdrawals();
  res.json(items);
}

export async function resolveWithdrawal(req, res) {
  const { action, note } = req.body; // approve | reject
  const w = await findWithdrawalById(req.params.id);
  if (!w) return res.status(404).json({ message: 'Không tìm thấy yêu cầu' });
  if (w.status !== 'pending') return res.status(400).json({ message: 'Yêu cầu đã xử lý' });
  if (action === 'approve') {
    await updateWithdrawal(w.id, { status: 'approved', note: note || '' });
  } else {
    const user = await findUserById(w.userId);
    if (user) {
      await updateUser(user.id, { commissionBalance: user.commissionBalance + w.amount });
    }
    await updateWithdrawal(w.id, { status: 'rejected', note: note || '' });
  }
  const updated = await findWithdrawalById(w.id);
  res.json({ message: 'Đã xử lý', withdrawal: updated });
}

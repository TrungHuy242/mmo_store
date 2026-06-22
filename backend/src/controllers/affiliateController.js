import { config } from '../config/env.js';
import { countUsersReferredBy, findUserById, updateUser } from '../repositories/userRepository.js';
import { findOrdersByAffiliate } from '../repositories/orderRepository.js';
import { createWithdrawal } from '../repositories/withdrawalRepository.js';

export async function affiliateInfo(req, res) {
  const refLink = `${config.frontendUrl}/register?ref=${req.user.refCode}`;
  const referredCount = await countUsersReferredBy(req.user.id);
  const earnedOrders = await findOrdersByAffiliate(req.user.id);
  res.json({
    refCode: req.user.refCode,
    refLink,
    commissionBalance: req.user.commissionBalance,
    referredCount,
    history: earnedOrders,
  });
}

export async function requestWithdrawal(req, res) {
  const { amount, method, details } = req.body;
  const user = await findUserById(req.user.id);
  if (!user || amount > user.commissionBalance) {
    return res.status(400).json({ message: 'Số dư hoa hồng không đủ' });
  }
  await updateUser(user.id, { commissionBalance: user.commissionBalance - amount });
  const w = await createWithdrawal({ userId: user.id, amount, method, details });
  res.status(201).json({ message: 'Đã gửi yêu cầu rút tiền', withdrawal: w });
}

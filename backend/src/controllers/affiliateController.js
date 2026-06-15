import User from '../models/User.js';
import Order from '../models/Order.js';
import Withdrawal from '../models/Withdrawal.js';
import { config } from '../config/env.js';

export async function affiliateInfo(req, res) {
  const refLink = `${config.frontendUrl}/register?ref=${req.user.refCode}`;
  const referredCount = await User.countDocuments({ referredBy: req.user._id });
  const earnedOrders = await Order.find({ affiliate: req.user._id }).select('commissionPaid code createdAt');
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
  const user = await User.findById(req.user._id);
  if (amount > user.commissionBalance) {
    return res.status(400).json({ message: 'So du hoa hong khong du' });
  }
  user.commissionBalance -= amount;
  await user.save();
  const w = await Withdrawal.create({ user: user._id, amount, method, details });
  res.status(201).json({ message: 'Da gui yeu cau rut tien', withdrawal: w });
}

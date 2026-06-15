import User from '../models/User.js';

const COMMISSION_RATE = 0.1; // 10%

// Chi hoa hong cho nguoi gioi thieu khi don duoc thanh toan
export async function payCommission(order) {
  const buyer = await User.findById(order.user);
  if (!buyer || !buyer.referredBy) return 0;
  const commission = Math.round(order.totalAmount * COMMISSION_RATE);
  if (commission <= 0) return 0;
  await User.findByIdAndUpdate(buyer.referredBy, {
    $inc: { commissionBalance: commission },
  });
  order.affiliate = buyer.referredBy;
  order.commissionPaid = commission;
  return commission;
}

export { COMMISSION_RATE };

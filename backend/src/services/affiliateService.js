import { findUserById, incrementUserCommission } from '../repositories/userRepository.js';
import { updateOrder } from '../repositories/orderRepository.js';

export const COMMISSION_RATE = 0.1; // 10%

// Chi hoa hong cho nguoi gioi thieu khi don duoc thanh toan
export async function payCommission(order) {
  const buyer = await findUserById(order.userId);
  if (!buyer || !buyer.referredBy) return 0;
  const commission = Math.round(order.totalAmount * COMMISSION_RATE);
  if (commission <= 0) return 0;
  await incrementUserCommission(buyer.referredBy, commission);
  await updateOrder(order.id, { affiliateId: buyer.referredBy, commissionPaid: commission });
  return commission;
}

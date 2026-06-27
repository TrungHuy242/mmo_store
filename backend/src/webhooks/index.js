import { Router } from 'express';
import paymentService from '../modules/payments/payment.service.js';
import orderService from '../modules/orders/service.js';
import deliveryService from '../services/delivery.service.js';
import prisma from '../database/prisma.js';

const router = Router();

// Casso webhook - VietQR / Bank Transfer
router.post('/casso', async (req, res) => {
  try {
    const { signature, data } = req.body;
    
    const results = await paymentService.processCassoWebhook({ signature, data });
    
    // Trigger immediate delivery for each confirmed order
    for (const result of results) {
      if (result.success && !result.skipped && result.orderId) {
        try {
          // Process delivery immediately (don't wait for worker)
          await deliveryService.processOrderDelivery(result.orderId);
          console.log(`✅ Auto-delivery triggered for order ${result.orderNumber}`);
        } catch (deliveryError) {
          console.error(`❌ Auto-delivery failed for order ${result.orderNumber}:`, deliveryError.message);
          // Worker will retry this later
        }
      }
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Casso webhook error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// TheSieuRe webhook - Card payment
router.post('/thesieure', async (req, res) => {
  try {
    const { status, trans_id, order_id, face_value, actual_value, message } = req.body;
    
    if (status === 'success') {
      console.log(`Card payment success: ${trans_id}, order: ${order_id}`);
      
      try {
        // Process TheSieuRe webhook and confirm order
        const result = await paymentService.processTheSieuReWebhook({
          trans_id,
          status,
          amount: actual_value,
          order_id,
        });
        
        if (result.success && result.orderId) {
          // Trigger immediate delivery
          await deliveryService.processOrderDelivery(result.orderId);
          console.log(`✅ Auto-delivery triggered for card order ${order_id}`);
        }
      } catch (processError) {
        console.error(`Failed to process card payment for order ${order_id}:`, processError.message);
      }
    } else {
      console.log(`Card payment failed: ${message}`);
      
      // Mark order as failed if it exists
      if (order_id) {
        try {
          const order = await prisma.order.findFirst({
            where: { orderNumber: order_id }
          });
          if (order && order.status === 'PENDING') {
            await prisma.order.update({
              where: { id: order.id },
              data: { status: 'FAILED' }
            });
            await prisma.orderTimeline.create({
              data: {
                orderId: order.id,
                status: 'FAILED',
                message: `Card payment failed: ${message}`,
              }
            });
          }
        } catch (err) {
          console.error('Failed to mark order as failed:', err.message);
        }
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('TheSieuRe webhook error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// USDT webhook (TronGrid)
router.post('/usdt', async (req, res) => {
  try {
    const { transactionHash, from, to, amount, symbol } = req.body;
    
    console.log(`USDT webhook received: ${transactionHash}`);
    
    // Validate this is a USDT transfer
    if (symbol !== 'USDT') {
      return res.status(400).json({ error: 'Not a USDT transaction' });
    }
    
    // Process USDT payment
    const result = await paymentService.processUsdtWebhook({
      transactionHash,
      from,
      to,
      amount,
    });
    
    if (result.success && result.orderId) {
      // Trigger immediate delivery
      await deliveryService.processOrderDelivery(result.orderId);
      console.log(`✅ Auto-delivery triggered for USDT order ${result.orderNumber}`);
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('USDT webhook error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

export default router;

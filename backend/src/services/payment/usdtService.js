import axios from 'axios';
import { config } from '../../config/env.js';

// USDT TRC20 contract tren Tron
const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

// Lay danh sach giao dich TRC20 gan day cua vi nhan tien
export async function getRecentUsdtTransfers(limit = 30) {
  if (!config.usdt.walletAddress) return [];
  const url = `https://api.trongrid.io/v1/accounts/${config.usdt.walletAddress}/transactions/trc20`;
  try {
    const res = await axios.get(url, {
      params: { limit, contract_address: USDT_CONTRACT, only_to: true },
      headers: config.usdt.trongridApiKey ? { 'TRON-PRO-API-KEY': config.usdt.trongridApiKey } : {},
      timeout: 15000,
    });
    return (res.data?.data || []).map((tx) => ({
      txid: tx.transaction_id,
      from: tx.from,
      to: tx.to,
      // USDT TRC20 co 6 decimals
      amount: Number(tx.value) / 1e6,
      timestamp: tx.block_timestamp,
    }));
  } catch (err) {
    console.error('[usdt] Lỗi gọi TronGrid:', err.message);
    return [];
  }
}

// Doi chieu: tim giao dich co so tien khop (unique amount) voi don pending
export function matchTransfer(transfers, expectedAmount) {
  // Cho phep sai so nho do lam tron
  return transfers.find((t) => Math.abs(t.amount - expectedAmount) < 0.01);
}

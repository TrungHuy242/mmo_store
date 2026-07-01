import axios from 'axios';
import prisma from '../../database/prisma.js';
import nextdnsService from './nextdns.service.js';
import { createError } from '../../middlewares/error.middleware.js';

// ── RevenueCat static headers (mimics real iOS Locket app) ──────────────────
const RC_HEADERS = {
  Host: 'api.revenuecat.com',
  Authorization: 'Bearer appl_JngFETzdodyLmCREOlwTUtXdQik',
  'X-Platform': 'iOS',
  'X-Platform-Version': 'Version 26.2',
  'X-Platform-Device': 'iPhone15,3',
  'X-Version': '5.41.0',
  'X-Client-Version': '2.32.2',
  'X-Client-Bundle-ID': 'com.locket.Locket',
  'X-StoreKit2-Enabled': 'true',
  'X-StoreKit-Version': '2',
  'X-Storefront': 'VNM',
  'X-Apple-Device-Identifier': '39A73C25D7F3E9B8C4F2A1D6E7B3C9A0',
  'X-Nonce': 'w0Mlb6+AmV4WYuVv',
  'User-Agent':
    'Locket/3 CFNetwork/1498.0.0.2 Darwin/23.6.0 (iPhone/17.5.1)',
};

// ── Queue state (in-memory) ──────────────────────────────────────────────────
/** @type {Map<string, {uid: string, username: string, status: string, userId: string, addedAt: Date, position: number}>} */
const queue = new Map();
let queueVersion = 0;

function bumpQueueVersion() { queueVersion++; }
function recalcPositions() {
  let pos = 1;
  for (const item of queue.values()) {
    if (item.status === 'WAITING') item.position = pos++;
  }
}

async function getServiceConfig() {
  let config = await prisma.locketServiceConfig.findFirst();
  if (!config) {
    config = await prisma.locketServiceConfig.create({
      data: { isEnabled: true, numWorkers: 2, dailyLimit: 5 },
    });
  }
  return config;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ── LocketService ────────────────────────────────────────────────────────────
class LocketService {
  // Config
  async getConfig() { return getServiceConfig(); }
  async updateConfig(data) {
    const config = await getServiceConfig();
    return prisma.locketServiceConfig.update({ where: { id: config.id }, data });
  }

  // Token management
  async getTokens() { return prisma.locketTokenSet.findMany({ orderBy: { createdAt: 'asc' } }); }
  async getActiveTokens() {
    return prisma.locketTokenSet.findMany({ where: { isActive: true }, orderBy: { lastUsedAt: 'asc' } });
  }
  async getToken(id) { return prisma.locketTokenSet.findUnique({ where: { id } }); }
  async createToken(data) { return prisma.locketTokenSet.create({ data }); }
  async updateToken(id, data) { return prisma.locketTokenSet.update({ where: { id }, data }); }
  async deleteToken(id) { return prisma.locketTokenSet.delete({ where: { id } }); }

  // Resolve UID from locket.cam/username
  async resolveUid(username) {
    try {
      const res = await axios.get(`https://locket.cam/${username}`, { maxRedirects: 5, timeout: 8000 });
      const finalUrl = res.request?.res?.responseUrl || res.request?.path || '';
      const urlMatch = finalUrl.match(/\/invites\/([A-Za-z0-9]{28})/);
      if (urlMatch) return urlMatch[1];
      const body = res.data || '';
      const bodyMatch = body.match(/\/invites\/([A-Za-z0-9]{28})/);
      if (bodyMatch) return bodyMatch[1];
      return null;
    } catch (err) {
      console.error('[Locket] resolveUid error:', err.message);
      return null;
    }
  }

  // Check Gold entitlement status
  async checkGoldStatus(uid) {
    try {
      const res = await axios.get(
        `https://api.revenuecat.com/v1/subscribers/${uid}`,
        { headers: { ...RC_HEADERS, 'X-Is-Sandbox': 'false' }, timeout: 8000 }
      );
      const entitlement = res.data?.subscriber?.entitlements?.Gold || null;
      if (entitlement?.expires_date) {
        const isActive = new Date(entitlement.expires_date) > new Date();
        return { active: isActive, expires: entitlement.expires_date };
      }
      return { active: false, expires: null };
    } catch (err) {
      if (err.response?.status === 404) return { active: false, expires: null };
      console.error('[Locket] checkGoldStatus error:', err.message);
      return { active: false, expires: null };
    }
  }

  // Core bypass: POST to RevenueCat /v1/receipts
  async injectGold(uid, tokenSet) {
    const headers = {
      ...RC_HEADERS,
      'X-Is-Sandbox': tokenSet.isSandbox ? 'true' : 'false',
    };
    if (tokenSet.hashParams) headers['X-Post-Params-Hash'] = tokenSet.hashParams;
    if (tokenSet.hashHeaders) headers['X-Headers-Hash'] = tokenSet.hashHeaders;

    const body = {
      product_id: 'locket_199_1m',
      fetch_token: tokenSet.fetchToken,
      app_transaction: tokenSet.appTransaction,
      app_user_id: uid,
      is_restore: true,
      store_country: 'VNM',
      currency: 'USD',
      price: '1.99',
      normal_duration: 'P1M',
      subscription_group_id: '21419447',
      observer_mode: false,
      initiation_source: 'restore',
      offers: [],
      attributes: { $attConsentStatus: { value: 3 } },
    };

    let lastError = 'Unknown error';
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const res = await axios.post('https://api.revenuecat.com/v1/receipts', body, { headers, timeout: 15000 });
        if (res.status === 529) {
          lastError = 'RevenueCat server overloaded, retrying...';
          await sleep(2000);
          continue;
        }
        if (res.status === 200) {
          await sleep(2000);
          const status = await this.checkGoldStatus(uid);
          if (status.active) return { success: true, message: 'Gold activated successfully' };
          lastError = 'Activation OK but Gold not active';
        }
      } catch (err) {
        lastError = err.response?.data?.message || err.response?.statusText || err.message;
        if (err.response?.status === 529) { await sleep(2000); continue; }
      }
    }
    return { success: false, message: lastError };
  }

  // Queue management
  async enqueue(userId, uid, username) {
    const config = await getServiceConfig();
    if (!config.isEnabled) throw createError(503, 'Service is temporarily unavailable');
    const existing = queue.get(userId);
    if (existing && existing.status === 'WAITING') return { position: existing.position, status: existing.status };
    queue.set(userId, { uid, username, userId, status: 'WAITING', addedAt: new Date(), position: queue.size + 1 });
    bumpQueueVersion();
    return { position: queue.size, status: 'WAITING' };
  }

  getQueuePosition(userId) {
    const item = queue.get(userId);
    if (!item) return null;
    if (item.status === 'SUCCESS' || item.status === 'FAIL') return item;
    recalcPositions();
    return queue.get(userId);
  }

  getQueueState() {
    return { version: queueVersion, items: Array.from(queue.values()), size: queue.size };
  }

  completeItem(userId, status, extra = {}) {
    const item = queue.get(userId);
    if (item) {
      item.status = status;
      item.position = 0;
      Object.assign(item, extra);
      bumpQueueVersion();
    }
  }

  // Daily limit
  async checkDailyLimit(userId) {
    const config = await getServiceConfig();
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const count = await prisma.locketUsageLog.count({
      where: { userId, createdAt: { gte: start }, status: { in: ['SUCCESS', 'PROCESSING'] } },
    });
    return { allowed: count < config.dailyLimit, used: count, limit: config.dailyLimit, remaining: Math.max(0, config.dailyLimit - count) };
  }

  // Stats
  async getStats() {
    const [total, success, fail, tokenSets, todayLogs] = await Promise.all([
      prisma.locketUsageLog.count(),
      prisma.locketUsageLog.count({ where: { status: 'SUCCESS' } }),
      prisma.locketUsageLog.count({ where: { status: 'FAIL' } }),
      prisma.locketTokenSet.findMany(),
      prisma.locketUsageLog.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } }),
    ]);
    return {
      total, success, fail, queueSize: queue.size,
      successRate: total > 0 ? Math.round((success / total) * 100) : 0,
      todayCount: todayLogs,
      tokenSets: tokenSets.map((t) => ({ id: t.id, name: t.name, isActive: t.isActive, isSandbox: t.isSandbox, useCount: t.useCount, lastUsedAt: t.lastUsedAt })),
    };
  }

  // Usage logs
  async getLogs({ page = 1, limit = 20, status, userId, from, to } = {}) {
    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }
    const [rows, total] = await Promise.all([
      prisma.locketUsageLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.locketUsageLog.count({ where }),
    ]);
    return { rows, total, page, limit, pages: Math.ceil(total / limit) };
  }
}

export default new LocketService();

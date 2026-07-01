import { Router } from 'express';
import service from './service.js';
import { startLocketWorkers, stopLocketWorkers } from './worker.js';
import prisma from '../../database/prisma.js';

const router = Router();

// ── Middleware helpers ──────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const adminRoles = ['SUPER_ADMIN', 'MANAGER', 'SUPPORT', 'FINANCE', 'INVENTORY_STAFF', 'MARKETING'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ── Public / Authenticated endpoints ────────────────────────────────────────

// GET /locket-gold/config — service status
router.get('/config', async (req, res, next) => {
  try {
    const config = await service.getConfig();
    res.json({ success: true, data: config });
  } catch (err) { next(err); }
});

// POST /locket-gold/activate — submit activation request
router.post('/activate', requireAuth, async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });

    const usernameClean = username.trim().toLowerCase().replace(/\s+/g, '');

    // Support both plain username and locket.cam/username link
    const match = usernameClean.match(/locket\.cam\/([^\/\?]+)/);
    const rawUsername = match ? match[1] : usernameClean;

    if (!rawUsername || rawUsername.length > 50) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    // Resolve UID
    const uid = await service.resolveUid(rawUsername);
    if (!uid) {
      return res.status(404).json({ error: 'Username not found on Locket' });
    }

    // Check daily limit
    const limit = await service.checkDailyLimit(req.user.id);
    if (!limit.allowed) {
      return res.status(429).json({
        error: `Daily limit reached (${limit.limit}/${limit.limit})`,
        used: limit.used,
        limit: limit.limit,
      });
    }

    // Check Gold status
    const status = await service.checkGoldStatus(uid);

    // Enqueue
    const result = await service.enqueue(req.user.id, uid, rawUsername);

    // Log the attempt (non-fatal)
    await prisma.locketUsageLog.create({
      data: {
        userId: req.user.id,
        uid,
        username: rawUsername,
        status: 'PROCESSING',
        ipAddress: req.ip,
      },
    }).catch(() => {}); // non-fatal

    res.json({
      success: true,
      data: {
        uid,
        username: rawUsername,
        goldActive: status.active,
        goldExpires: status.expires,
        queuePosition: result.position,
        dailyUsed: limit.used,
        dailyRemaining: limit.remaining,
      },
    });
  } catch (err) { next(err); }
});

// GET /locket-gold/status/:uid — check Gold status of a specific UID
router.get('/status/:uid', requireAuth, async (req, res, next) => {
  try {
    const { uid } = req.params;
    if (!uid || uid.length !== 28) {
      return res.status(400).json({ error: 'Invalid UID format' });
    }
    const status = await service.checkGoldStatus(uid);
    res.json({ success: true, data: status });
  } catch (err) { next(err); }
});

// GET /locket-gold/queue — current user's queue position
router.get('/queue', requireAuth, async (req, res, next) => {
  try {
    const pos = service.getQueuePosition(req.user.id);
    if (!pos) return res.json({ success: true, data: { inQueue: false } });
    res.json({ success: true, data: { inQueue: true, ...pos } });
  } catch (err) { next(err); }
});

// GET /locket-gold/usage — user's daily usage stats
router.get('/usage', requireAuth, async (req, res, next) => {
  try {
    const limit = await service.checkDailyLimit(req.user.id);
    res.json({ success: true, data: limit });
  } catch (err) { next(err); }
});

// ── Admin endpoints ──────────────────────────────────────────────────────────

// GET /locket-gold/stats — dashboard stats
router.get('/stats', requireAdmin, async (req, res, next) => {
  try {
    const stats = await service.getStats();
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
});

// GET /locket-gold/logs — paginated usage logs
router.get('/logs', requireAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, userId, from, to } = req.query;
    const result = await service.getLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      userId,
      from,
      to,
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// GET /locket-gold/tokens — list token sets
router.get('/tokens', requireAdmin, async (req, res, next) => {
  try {
    const tokens = await service.getTokens();
    res.json({ success: true, data: tokens });
  } catch (err) { next(err); }
});

// POST /locket-gold/tokens — create token set
router.post('/tokens', requireAdmin, async (req, res, next) => {
  try {
    const { name, fetchToken, appTransaction, hashParams, hashHeaders, isSandbox } = req.body;
    if (!fetchToken || !appTransaction) {
      return res.status(400).json({ error: 'fetchToken and appTransaction are required' });
    }
    const token = await service.createToken({
      name: name || `Token ${Date.now()}`,
      fetchToken,
      appTransaction,
      hashParams: hashParams || null,
      hashHeaders: hashHeaders || null,
      isSandbox: !!isSandbox,
    });
    res.status(201).json({ success: true, data: token });
  } catch (err) { next(err); }
});

// PUT /locket-gold/tokens/:id — update token set
router.put('/tokens/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, fetchToken, appTransaction, hashParams, hashHeaders, isSandbox, isActive } = req.body;
    const existing = await service.getToken(id);
    if (!existing) return res.status(404).json({ error: 'Token not found' });

    const updated = await service.updateToken(id, {
      ...(name !== undefined && { name }),
      ...(fetchToken !== undefined && { fetchToken }),
      ...(appTransaction !== undefined && { appTransaction }),
      ...(hashParams !== undefined && { hashParams }),
      ...(hashHeaders !== undefined && { hashHeaders }),
      ...(isSandbox !== undefined && { isSandbox }),
      ...(isActive !== undefined && { isActive }),
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// DELETE /locket-gold/tokens/:id — delete token set
router.delete('/tokens/:id', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await service.getToken(id);
    if (!existing) return res.status(404).json({ error: 'Token not found' });
    await service.deleteToken(id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /locket-gold/queue-state — full queue for admin
router.get('/queue-state', requireAdmin, async (req, res, next) => {
  try {
    const state = service.getQueueState();
    res.json({ success: true, data: state });
  } catch (err) { next(err); }
});

// PUT /locket-gold/config — update service config
router.put('/config', requireAdmin, async (req, res, next) => {
  try {
    const { isEnabled, numWorkers, dailyLimit } = req.body;
    const updated = await service.updateConfig({
      ...(isEnabled !== undefined && { isEnabled }),
      ...(numWorkers !== undefined && { numWorkers }),
      ...(dailyLimit !== undefined && { dailyLimit }),
    });

    // Restart workers if numWorkers changed
    stopLocketWorkers();
    if (updated.isEnabled && updated.numWorkers > 0) {
      startLocketWorkers(updated.numWorkers);
    }

    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

// POST /locket-gold/restart-workers — force restart workers
router.post('/restart-workers', requireAdmin, async (req, res, next) => {
  try {
    stopLocketWorkers();
    const config = await service.getConfig();
    if (config.isEnabled) {
      startLocketWorkers(config.numWorkers);
    }
    res.json({ success: true, message: 'Workers restarted' });
  } catch (err) { next(err); }
});

// POST /locket-gold/broadcast — admin broadcast
router.post('/broadcast', requireAdmin, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const { default: telegramService } = await import('../notifications/telegram.service.js');
    const users = await prisma.user.findMany({
      where: { telegramId: { not: null }, status: 'ACTIVE' },
      select: { id: true, telegramId: true },
    });

    let sent = 0;
    for (const user of users) {
      try {
        await telegramService.sendMessage(message, user.telegramId);
        sent++;
        await sleep(50);
      } catch { /* skip */ }
    }

    res.json({ success: true, data: { total: users.length, sent } });
  } catch (err) { next(err); }
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default router;

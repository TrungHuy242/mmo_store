import service from './service.js';
import nextdnsService from './nextdns.service.js';
import prisma from '../../database/prisma.js';
import telegramService from '../notifications/telegram.service.js';

let workerIntervals = [];
let isRunning = false;

// How long a result stays visible in the queue (ms)
const RESULT_TTL_MS = 30_000;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assign a token to a worker in round-robin order.
 */
function pickToken(tokenSets, workerIndex) {
  return tokenSets[workerIndex % tokenSets.length];
}

/**
 * Run one worker loop. Each worker is an independent setInterval that:
 * 1. Checks for waiting items in the queue
 * 2. Picks the next one (oldest WAITING item)
 * 3. Processes it via injectGold()
 * 4. Creates NextDNS profile on success
 * 5. Notifies user via Telegram
 * 6. Sleeps 45s (token cooldown)
 */
async function runWorkerLoop(workerId, tokenSet) {
  const queueState = service.getQueueState();

  // Find the oldest WAITING item
  let target = null;
  let targetUserId = null;
  let minAddedAt = null;

  for (const [userId, item] of queueState.items) {
    if (item.status === 'WAITING') {
      if (!minAddedAt || item.addedAt < minAddedAt) {
        minAddedAt = item.addedAt;
        target = item;
        targetUserId = userId;
      }
    }
  }

  if (!target) {
    // Nothing to do — wait before checking again
    return;
  }

  console.log(
    `[LocketWorker#${workerId}] Processing UID=${target.uid} | User=${target.username}`
  );

  // Mark as processing
  service.completeItem(targetUserId, 'PROCESSING');

  let success = false;
  let errorMsg = '';
  let nextDnsProfileId = null;
  let nextDnsProfileUrl = null;

  try {
    // ── Step 1: Inject Gold via RevenueCat ──────────────────────────────
    const result = await service.injectGold(target.uid, tokenSet);
    success = result.success;
    errorMsg = result.message;

    if (!success) {
      console.error(`[LocketWorker#${workerId}] FAIL: ${errorMsg}`);
    } else {
      console.log(`[LocketWorker#${workerId}] SUCCESS for UID=${target.uid}`);

      // ── Step 2: Create NextDNS profile ────────────────────────────────
      try {
        const dnsResult = await nextdnsService.createDailyProfile();
        if (dnsResult) {
          nextDnsProfileId = dnsResult.profileId;
          nextDnsProfileUrl = dnsResult.profileUrl;
          console.log(
            `[LocketWorker#${workerId}] NextDNS profile created: ${nextDnsProfileId}`
          );
        }
      } catch (dnsErr) {
        console.error(
          `[LocketWorker#${workerId}] NextDNS error:`,
          dnsErr.message
        );
      }

      // ── Step 3: Update token usage ────────────────────────────────────
      await prisma.locketTokenSet.update({
        where: { id: tokenSet.id },
        data: {
          useCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });

      // ── Step 4: Notify user via Telegram ─────────────────────────────
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { telegramId: true, telegramUsername: true },
      });

      if (user?.telegramId) {
        try {
          const lang = user.telegramUsername ? 'vi' : 'en';
          const instructions = nextdnsService.getSetupInstructions(lang);

          let msg = `✅ <b>Kích hoạt Locket Gold thành công!</b>\n`;
          msg += `👤 Username: <code>${target.username}</code>\n\n`;
          msg += instructions.msg
            .replace('{profileId}', nextDnsProfileId || '')
            .replace('👉 profile-id', nextDnsProfileId || '');

          if (nextDnsProfileUrl) {
            msg += `\n🔗 <a href="${nextDnsProfileUrl}">Cài đặt DNS bảo vệ</a>`;
          }

          await telegramService.sendMessage(msg, user.telegramId);
        } catch (tgErr) {
          console.error(
            `[LocketWorker#${workerId}] Telegram notification error:`,
            tgErr.message
          );
        }
      }
    }
  } catch (err) {
    errorMsg = err.message;
    console.error(`[LocketWorker#${workerId}] Unexpected error:`, err);
  }

  // ── Step 5: Log to database ───────────────────────────────────────────
  try {
    await prisma.locketUsageLog.create({
      data: {
        userId: targetUserId,
        uid: target.uid,
        username: target.username,
        status: success ? 'SUCCESS' : 'FAIL',
        errorMsg: errorMsg || null,
        nextDnsProfileId,
        nextDnsProfileUrl,
      },
    });
  } catch (logErr) {
    console.error('[LocketWorker] Failed to log result:', logErr.message);
  }

  // Mark as final state
  service.completeItem(targetUserId, success ? 'SUCCESS' : 'FAIL', {
    errorMsg,
    nextDnsProfileId,
    nextDnsProfileUrl,
  });

  // Token cooldown — sleep before this worker can accept a new job
  console.log(`[LocketWorker#${workerId}] Cooldown 45s...`);
  await sleep(45_000);
}

/**
 * Start N Locket Gold worker loops.
 * Each worker is a setInterval that polls the queue.
 * @param {number} numWorkers
 */
export async function startLocketWorkers(numWorkers = 2) {
  if (isRunning) return;
  isRunning = true;

  console.log(`[LocketWorker] Starting ${numWorkers} workers...`);

  for (let i = 1; i <= numWorkers; i++) {
    const workerId = i;

    const interval = setInterval(async () => {
      try {
        // Reload active tokens on each iteration so admin changes take effect
        const tokenSets = await service.getActiveTokens();
        if (tokenSets.length === 0) {
          console.warn(`[LocketWorker#${workerId}] No active tokens — skipping`);
          return;
        }

        const token = pickToken(tokenSets, workerId - 1);
        await runWorkerLoop(workerId, token);
      } catch (err) {
        console.error(`[LocketWorker#${workerId}] Error:`, err.message);
      }
    }, 3000); // poll every 3 seconds

    workerIntervals.push(interval);
  }

  console.log(`[LocketWorker] ${numWorkers} workers started`);
}

/**
 * Stop all worker loops.
 */
export function stopLocketWorkers() {
  for (const id of workerIntervals) clearInterval(id);
  workerIntervals = [];
  isRunning = false;
  console.log('[LocketWorker] All workers stopped');
}

/**
 * Redis client singleton.
 *
 * Uses ioredis for its superior performance, built-in reconnection
 * handling, and Lua scripting support (useful for cache stampede
 * prevention later).
 *
 * The connection is lazy — it only opens when the first command is
 * issued. If REDIS_HOST is not set (e.g. local dev without Docker) the
 * client stays null and every cache operation becomes a no-op so the app
 * continues to work without Redis.
 */

import Redis from 'ioredis';
import config from './index.js';

let _client = null;

function createClient() {
  if (!config.redis?.host) {
    console.warn(
      '[Redis] REDIS_HOST is not set — caching is disabled. ' +
      'Set REDIS_HOST in .env to enable Redis caching.'
    );
    return null;
  }

  const client = new Redis({
    host: config.redis.host,
    port: config.redis.port ?? 6379,
    password: config.redis.password || undefined,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  client.on('connect', () => {
    console.log(`[Redis] Connected to ${config.redis.host}:${config.redis.port}`);
  });

  client.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  client.on('close', () => {
    console.warn('[Redis] Connection closed');
  });

  return client;
}

/** Returns the shared Redis client (null if not configured). */
export function getRedis() {
  if (!_client) {
    _client = createClient();
  }
  return _client;
}

/** Returns true only when Redis is connected and ready. */
export function isRedisReady() {
  return _client?.status === 'ready';
}

/**
 * Gracefully connect to Redis. Call once at startup.
 * Errors are swallowed so the app can start even if Redis is unreachable.
 */
export async function connectRedis() {
  const client = getRedis();
  if (!client) return;

  try {
    await client.connect();
    await client.ping();
    console.log('[Redis] Ready');
  } catch (err) {
    console.error('[Redis] Failed to connect:', err.message);
  }
}

/**
 * Disconnect and destroy the client. Call on graceful shutdown.
 */
export async function disconnectRedis() {
  if (_client) {
    await _client.quit();
    _client = null;
    console.log('[Redis] Disconnected');
  }
}

export default { getRedis, isRedisReady, connectRedis, disconnectRedis };
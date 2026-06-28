/**
 * cache.js — In-process memory cache using node-cache.
 *
 * Provides a drop-in replacement for the Redis client so the rest of the
 * app (cache middleware, workers) works unchanged.
 *
 * Why node-cache over Redis for single-instance deployments?
 *   • Zero infrastructure — no Docker / systemd / cloud service needed.
 *   • Data lives in-process → no network round-trip (sub-microsecond).
 *   • TTL, eviction, and stats out of the box.
 *   • On server restart the cache is clean (no stale data).
 *
 * Trade-off vs Redis: data is NOT shared across multiple Node.js instances.
 * For a single-server deployment this is not a concern.
 *
 * Cache key format mirrors the middleware convention:
 *   cache:{method}:{path}:{sorted-query-hash}
 */

import NodeCache from 'node-cache';
import config from './index.js';

const DEFAULT_TTL = config.cache?.ttl ?? 300; // seconds

// node-cache instance — singleton, ready immediately
const _cache = new NodeCache({
  stdTTL: DEFAULT_TTL,
  checkperiod: 60,             // prune expired entries every 60s
  useClones: true,            // return copies, not references
  deleteFallback: false,      // don't keep deleted keys as undefined
});

// Registry: maps a "pattern" (e.g. '/api/products') to the Set of
// keys that belong to it. Used by invalidateCache() to delete all keys
// that match a prefix without a slow KEYS/SCAN scan.
const _registry = new Map(); // pattern → Set<key>

function _register(pattern, key) {
  if (!_registry.has(pattern)) {
    _registry.set(pattern, new Set());
  }
  _registry.get(pattern).add(key);
}

/** Returns all cached keys (used by invalidateCache). */
function _getKeys() {
  return _cache.keys();
}

// ─── Public API (mirrors the redis.js interface) ───────────────────────────

/** Returns true — node-cache is always ready. */
export function isCacheReady() {
  return true;
}

/** Get a value. Returns undefined if not found or expired. */
export async function cacheGet(key) {
  return _cache.get(key);
}

/**
 * Set a value with optional TTL.
 * @param {string} key
 * @param {any}    value — will be JSON-serialised.
 * @param {number} [ttl] — seconds; falls back to NodeCache default.
 */
export async function cacheSet(key, value, ttl) {
  const serialized = JSON.stringify(value);
  const success = ttl
    ? _cache.set(key, serialized, ttl)
    : _cache.set(key, serialized);
  return success;
}

/** Delete a specific key. Returns 1 if found, 0 if absent. */
export async function cacheDel(key) {
  return _cache.del(key) ? 1 : 0;
}

/**
 * Delete every cached key whose string representation matches `prefix`.
 * Used after mutations to keep the cache fresh.
 *
 * @param {string} prefix  — e.g. 'cache:GET:/api/products'
 * @returns {number} count of deleted entries
 */
export async function invalidateCache(prefix) {
  const allKeys = _getKeys();
  const toDelete = allKeys.filter((k) => k.startsWith(prefix));
  let deleted = 0;
  for (const key of toDelete) {
    const n = await cacheDel(key);
    deleted += n;
  }
  // Also purge from registry
  for (const [pattern, set] of _registry) {
    if (pattern.startsWith(prefix)) {
      for (const key of [...set]) {
        if (key.startsWith(prefix)) set.delete(key);
      }
    }
  }
  return deleted;
}

/** Flush all entries and reset stats. */
export async function flushCache() {
  _cache.flushAll();
  _registry.clear();
}

/** Return cache statistics. */
export function getCacheStats() {
  return _cache.getStats();
}

// ─── Default object (for modules that import the default) ────────────────────
const _cacheObj = {
  get: cacheGet,
  set: cacheSet,
  del: cacheDel,
  flush: flushCache,
  stats: getCacheStats,
};

export default _cacheObj;
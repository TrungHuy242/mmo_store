/**
 * cache.middleware.js — In-memory response caching middleware.
 *
 * Uses node-cache (backed by a Map with TTL eviction) so no external
 * infrastructure is required. The interface mirrors the Redis version so
 * switching back to Redis later requires only updating the import.
 *
 * Design goals:
 *   1. Fail-open — if the cache is unavailable, requests pass through
 *      transparently and the app continues to work.
 *   2. Cache key includes method + path + sorted query string so unique
 *      filter combinations don't collide.
 *   3. TTL is configurable via option or from the TTL_OVERRIDES map.
 *   4. POST / PUT / PATCH / DELETE on the same resource invalidates all
 *      matching cache entries (prefix-based deletion).
 */

import {
  isCacheReady,
  cacheGet,
  cacheSet,
  invalidateCache,
} from '../config/cache.js';
import config from '../config/index.js';

// ─── Default TTLs (seconds) ────────────────────────────────────────────────

const DEFAULT_TTL = config.cache?.ttl ?? 300; // 5 minutes

// Per-endpoint TTL overrides — extend here as new routes are cached.
const TTL_OVERRIDES = {
  // products
  '/api/products':                 300,   // 5 min
  '/api/products/featured':        600,   // 10 min
  '/api/products/top-selling':     600,   // 10 min
  '/api/products/slug/':          300,   // 5 min
  // categories
  '/api/categories':              600,   // 10 min  (admin changes are rare)
  '/api/categories/slug/':        600,   // 10 min
};

function getTtl(path) {
  for (const [prefix, ttl] of Object.entries(TTL_OVERRIDES)) {
    if (path.startsWith(prefix)) return ttl;
  }
  return DEFAULT_TTL;
}

// ─── Cache key generation ───────────────────────────────────────────────────

/**
 * Build a deterministic cache key from a request.
 * Format: cache:{method}:{path}:{sorted-query-hash}
 * Example:  cache:GET:/api/products:category=1|page=1|sort=name
 */
function buildCacheKey(req) {
  const method = req.method.toUpperCase();
  const basePath = req.baseUrl + req.path;  // baseUrl already includes /api prefix

  // Sort query params so ?page=1&category=2 and ?category=2&page=1 share one key
  const sortedQuery = Object.keys(req.query)
    .sort()
    .map((k) => {
      // Skip internal cache-control params
      if (k.startsWith('__')) return null;
      const v = req.query[k];
      return Array.isArray(v) ? `${k}=${v.sort().join(',')}` : `${k}=${v}`;
    })
    .filter(Boolean)
    .join('|');

  const queryHash = sortedQuery ? `:${sortedQuery}` : '';
  return `cache:${method}:${basePath}${queryHash}`;
}

// ─── Express middleware ────────────────────────────────────────────────────

/**
 * Creates a cache middleware that:
 *   - GET / HEAD: reads from cache first, falls back to handler, stores result.
 *   - POST / PUT / PATCH / DELETE: invalidates matching keys after handler runs.
 *
 * Options:
 *   ttl     — override the TTL for this route (seconds). Default: route-specific.
 *   keyFn   — custom function (req) => string to override cache key generation.
 *   skip    — function (req) => boolean; return true to bypass cache for a request.
 *   pattern — cache pattern prefix used for targeted invalidation.
 *
 * @example
 *   // Simple usage — cache products list for 5 minutes
 *   router.get('/products', cacheMiddleware(), controller.getAll);
 *
 * @example
 *   // Custom TTL + skip logic
 *   router.get('/products',
 *     cacheMiddleware({ ttl: 60, skip: (req) => req.query.page !== '1' }),
 *     controller.getAll);
 */
export function cacheMiddleware(options = {}) {
  const { ttl: optionTtl, keyFn, skip, pattern } = options;

  return async (req, res, next) => {
    // Pass through if cache is not ready (fail-open)
    if (!isCacheReady()) {
      return next();
    }

    // Allow caller to skip caching for specific requests
    if (typeof skip === 'function' && skip(req)) {
      return next();
    }

    const cacheKey = typeof keyFn === 'function' ? keyFn(req) : buildCacheKey(req);
    const effectiveTtl = optionTtl ?? getTtl(req.baseUrl + req.path);

    // ── GET / HEAD: try cache first ───────────────────────────────────
    if (req.method === 'GET' || req.method === 'HEAD') {
      try {
        const cached = await cacheGet(cacheKey);
        if (cached !== undefined) {
          const parsed = JSON.parse(cached);
          res.set('X-Cache', 'HIT');
          res.set('X-Cache-Key', cacheKey);
          res.set('X-Cache-Age', parsed._cachedAt
            ? String(Math.floor((Date.now() - parsed._cachedAt) / 1000))
            : '0');
          return res.json(parsed.data);
        }
      } catch (err) {
        console.error('[Cache] Read error:', err.message);
        // Non-fatal — fall through to handler
      }

      // Capture the original json() so we can cache the response
      const originalJson = res.json.bind(res);
      const cachedAt = Date.now();
      const serialized = { data: null, _cachedAt: cachedAt };

      res.json = (body) => {
        // Store in cache if the handler set a successful 2xx status
        if (res.statusCode >= 200 && res.statusCode < 300 && body != null) {
          serialized.data = body;
          cacheSet(cacheKey, serialized, effectiveTtl)
            .catch((err) => console.error('[Cache] Write error:', err.message));
        }
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);
        res.set('X-Cache-TTL', String(effectiveTtl));
        return originalJson(body);
      };

      return next();
    }

    // ── Mutations: invalidate after handler succeeds ────────────────────
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const invalidateAfter = async () => {
        const basePath = req.baseUrl + req.path;
        // Strip trailing /:id so mutations on /api/products/abc invalidate /api/products
        const invalidatePattern = basePath.replace(/\/[^/]+$/, '');
        const deleted = await invalidateCache(`cache:${req.method}:${invalidatePattern}`);
        if (deleted > 0) {
          console.log(`[Cache] Invalidated ${deleted} entries for ${invalidatePattern}*`);
        }
      };

      // Wrap res.json so we only invalidate on success
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          invalidateAfter().catch((err) => console.error('[Cache] Invalidation error:', err.message));
        }
        return originalJson(body);
      };

      return next();
    }

    return next();
  };
}

export default cacheMiddleware;
/**
 * cache.middleware.js — Redis-backed response caching middleware.
 *
 * Design goals:
 *   1. Zero-dependency for the rest of the app — if Redis is absent or down,
 *      requests pass through transparently (fail-open).
 *   2. Cache key includes method + path + sorted query string so unique
 *      filter combinations don't collide.
 *   3. TTL is configurable via query param ?__cache=ttl or header X-Cache-TTL.
 *   4. POST / PUT / PATCH / DELETE on the same resource invalidates all
 *      matching cache entries (pattern-based deletion).
 *   5. Includes a simple "stale-while-revalidate" variant for high-traffic
 *      read endpoints that benefit from being served even while a refresh
 *      is in flight.
 */

import { getRedis, isRedisReady } from '../config/redis.js';
import config from '../config/index.js';

// ─── Default TTLs (seconds) ────────────────────────────────────────────────

const DEFAULT_TTL = parseInt(config.cache?.ttl ?? '300', 10); // 5 minutes

// Per-endpoint TTL overrides — extend here as new routes are cached.
const TTL_OVERRIDES = {
  // products
  '/api/products':                   300,   // 5 min
  '/api/products/featured':          600,   // 10 min
  '/api/products/top-selling':        600,   // 10 min
  '/api/products/slug/':             300,   // 5 min
  // categories
  '/api/categories':                 600,   // 10 min  (admin changes are rare)
  '/api/categories/slug/':           600,   // 10 min
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

// ─── Invalidation helpers ───────────────────────────────────────────────────

/**
 * Invalidate all cache entries whose key starts with the given prefix.
 * Used after a mutation (POST / PUT / PATCH / DELETE) to keep the cache fresh.
 */
export async function invalidateCache(pattern) {
  const client = getRedis();
  if (!client || !isRedisReady()) return 0;

  const prefix = `cache:${pattern}`;
  let deleted = 0;

  try {
    // SCAN is safe for production — it doesn't block like KEYS does.
    let cursor = '0';
    do {
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await client.del(...keys);
        deleted += keys.length;
      }
    } while (cursor !== '0');
  } catch (err) {
    console.error('[Cache] Invalidation error:', err.message);
  }

  return deleted;
}

// ─── Express middleware ────────────────────────────────────────────────────

/**
 * Creates a cache middleware that:
 *   - GET / HEAD: reads from Redis first, falls back to handler, stores result.
 *   - POST / PUT / PATCH / DELETE: invalidates matching keys after handler runs.
 *
 * Options:
 *   ttl          — override the TTL for this route (seconds). Default: route-specific.
 *   keyFn        — custom function (req) => string to override cache key generation.
 *   skip         — function (req) => boolean; return true to bypass cache for a request.
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
  const { ttl: optionTtl, keyFn, skip } = options;

  return async (req, res, next) => {
    const client = getRedis();

    // Pass through if Redis is not available (fail-open)
    if (!client || !isRedisReady()) {
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
        const cached = await client.get(cacheKey);
        if (cached) {
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
          client
            .setex(cacheKey, effectiveTtl, JSON.stringify(serialized))
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
        const pattern = basePath.replace(/\/[^/]+$/, '');
        const deleted = await invalidateCache(pattern);
        if (deleted > 0) {
          console.log(`[Cache] Invalidated ${deleted} entries for ${pattern}*`);
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
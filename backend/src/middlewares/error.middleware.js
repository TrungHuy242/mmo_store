/**
 * Global error handler.
 *
 * Normalises errors from three sources into a consistent response shape:
 *   { success: false, error: '...' }
 *
 * Priority:
 *   1. Service errors  — plain Error() thrown by business logic (e.g. auth
 *      service throws 'Invalid email or password'). These have no statusCode
 *      set, so we need to infer the appropriate HTTP status from the
 *      error message prefix or fall back to 400.
 *   2. Validation      — express-validator / zod errors (array of objects).
 *   3. Prisma errors   — P2002 duplicate, P2025 not found, etc.
 *   4. JWT errors      — token expired / malformed.
 *   5. Generic errors  — always 500.
 *
 * IMPORTANT: service errors from auth, orders, products, etc. always set
 * statusCode via next(new Error('message')) pattern so we get the right
 * HTTP status. This handler is the last-resort normaliser.
 */

const SERVICE_STATUS_MAP = {
  // 401 Unauthorized — credentials wrong
  'Invalid email or password': 401,
  'Invalid credentials': 401,
  'Token expired': 401,
  'Invalid token': 401,
  'Token has been revoked': 401,
  // 403 Forbidden — valid creds but no permission
  'Admin access required': 403,
  'Access denied': 403,
  'Account is suspended': 403,
  'Account is banned': 403,
  'Account is inactive': 403,
  'Account not active': 403,
  'Insufficient permissions': 403,
  'Permission denied': 403,
  // 404 Not Found
  'User not found': 404,
  'Not found': 404,
  'Review not found': 404,
  // 409 Conflict
  'Email already registered': 409,
  'Username already taken': 409,
  // 429 Too Many Requests
  'Too many': 429,
};

function inferStatusFromMessage(message) {
  // Match exact full string first, then by prefix as fallback
  if (SERVICE_STATUS_MAP[message]) return SERVICE_STATUS_MAP[message];
  for (const [prefix, status] of Object.entries(SERVICE_STATUS_MAP)) {
    if (message.startsWith(prefix)) return status;
  }
  return 400; // default for service errors
}

/**
 * Helper for throwing errors from service layer with proper HTTP status.
 * Use this instead of plain `new Error(msg)` so the error middleware
 * preserves the right status code instead of falling back to 400.
 *
 *   throw createError(401, 'Invalid email or password');
 *   throw createError(409, 'Email already registered');
 */
export function createError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

export default (err, req, res, next) => {
  // Log in development (never log sensitive body data)
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error] ${err.name || 'Error'}: ${err.message}`);
  }

  // ── 1. Express-validator / express-async-errors array errors ────────────────
  if (Array.isArray(err.errors)) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path || e.param,
        message: e.msg || e.message,
      })),
    });
  }

  // ── 2. Prisma duplicate key (P2002) ───────────────────────────────────────
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Giá trị đã tồn tại trong hệ thống',
    });
  }

  // ── 3. Prisma record not found (P2025) ────────────────────────────────────
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Bản ghi không tồn tại',
    });
  }

  // ── 4. JWT errors ──────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token không hợp lệ',
      code: 'INVALID_TOKEN',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      code: 'TOKEN_EXPIRED',
    });
  }

  // ── 5. Service errors (business logic) ────────────────────────────────────
  //    These are plain Error() thrown from service layer. The message is
  //    user-facing and already human-readable in Vietnamese.
  if (err.statusCode && err.message) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // ── 6. Plain Error() with no statusCode — infer from message prefix ────────
  if (err instanceof Error && !err.statusCode) {
    const status = inferStatusFromMessage(err.message);
    return res.status(status).json({
      success: false,
      error: err.message,
    });
  }

  // ── 7. Everything else (unknown error) ─────────────────────────────────────
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'development'
      ? err.message
      : 'Đã xảy ra lỗi phía máy chủ. Vui lòng thử lại sau.';

  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

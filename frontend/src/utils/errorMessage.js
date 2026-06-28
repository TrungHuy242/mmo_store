import i18n from '../i18n';

/**
 * Map known backend error messages (English) → i18n key.
 * Backend currently only returns English error strings, so we translate
 * them client-side based on the user's selected UI language.
 *
 * The map uses lowercased substring matching, so partial strings also work
 * (e.g. "Invalid email or password" matches key "invalid_credentials").
 *
 * Add new entries here whenever the backend introduces a new error string.
 */
const BACKEND_ERROR_MAP = [
  // Auth
  { match: /invalid email or password/i, key: 'errors.invalid_credentials' },
  { match: /email already registered/i, key: 'errors.email_already_registered' },
  { match: /username already taken/i, key: 'errors.username_already_taken' },
  { match: /please verify your email/i, key: 'errors.email_not_verified' },
  { match: /user not found/i, key: 'errors.user_not_found' },
  { match: /invalid or expired token/i, key: 'errors.invalid_token' },
  { match: /token has expired/i, key: 'errors.token_expired' },
  { match: /session.*(expired|invalid)/i, key: 'errors.session_expired' },
  { match: /too many (requests|attempts)/i, key: 'errors.too_many_requests' },
  { match: /access denied|forbidden|not authorized/i, key: 'errors.forbidden' },
  { match: /unauthorized/i, key: 'errors.unauthorized' },
  { match: /invalid (otp|code|verification)/i, key: 'errors.invalid_otp' },
  { match: /otp.*(expired|invalid)/i, key: 'errors.otp_expired' },

  // Products / Orders
  { match: /product not found/i, key: 'errors.product_not_found' },
  { match: /out of stock|insufficient stock/i, key: 'errors.out_of_stock' },
  { match: /order not found/i, key: 'errors.order_not_found' },
  { match: /insufficient balance/i, key: 'errors.insufficient_balance' },
  { match: /some products not found/i, key: 'errors.products_not_found' },

  // Payments
  { match: /payment (failed|not found)/i, key: 'errors.payment_failed' },
  { match: /invalid (coupon|promo)/i, key: 'errors.invalid_coupon' },
  { match: /coupon (expired|used up)/i, key: 'errors.coupon_expired' },

  // Assets / Downloads
  { match: /invalid download token/i, key: 'errors.invalid_download_token' },
  { match: /download token has expired/i, key: 'errors.download_token_expired' },
  { match: /download token has already been used/i, key: 'errors.download_token_used' },
  { match: /asset not (available|found)/i, key: 'errors.asset_not_found' },
  { match: /file not found on server/i, key: 'errors.file_not_found' },
  { match: /you have not purchased/i, key: 'errors.not_purchased' },
  { match: /token does not match asset/i, key: 'errors.token_mismatch' },

  // Generic
  { match: /network error|failed to fetch/i, key: 'errors.network_error' },
  { match: /server error|internal server error/i, key: 'errors.server_error' },
  { match: /not found/i, key: 'errors.not_found' },
  { match: /validation failed/i, key: 'errors.validation_failed' },
];

/**
 * Get a translated error message from any thrown value.
 * Falls back through: axios response data → known backend string → fallback key.
 *
 * @param {any} err - The thrown error (axios error, plain Error, or string)
 * @param {string} [fallbackKey] - i18n key to use when nothing matches
 * @returns {string} Translated message in the current UI language
 */
export function getErrorMessage(err, fallbackKey = 'errors.unknown_error') {
  if (!err) return i18n.t(fallbackKey);

  // Plain Error object that we threw ourselves already carries a translated
  // message — return as-is instead of double-translating.
  if (err instanceof Error && !(err.isAxiosError || err.response)) {
    // Heuristic: if the message looks like an i18n key itself, translate it
    if (typeof err.message === 'string' && /^[a-z][a-z0-9_]*\.[a-z0-9_]+$/i.test(err.message)) {
      return i18n.t(err.message, { defaultValue: err.message });
    }
    return err.message || i18n.t(fallbackKey);
  }

  // Pull the server message out of axios-shaped errors
  const serverMsg =
    err.response?.data?.error ||
    err.response?.data?.message ||
    err.message ||
    '';

  if (serverMsg) {
    const match = BACKEND_ERROR_MAP.find((entry) => entry.match.test(serverMsg));
    if (match) return i18n.t(match.key);
    // Unknown server message — return it as-is so the user at least sees
    // something meaningful. UI language stays consistent for known codes.
    return serverMsg;
  }

  return i18n.t(fallbackKey);
}

export default getErrorMessage;
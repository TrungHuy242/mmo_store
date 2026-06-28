/**
 * Centralised helpers for the axios 401 interceptor.
 *
 * Because the response interceptor runs outside the React tree, it cannot
 * call useNavigate() directly. We expose a small pub/sub that the AuthProvider
 * subscribes to from inside <BrowserRouter>. When a 401 is detected the
 * interceptor calls redirectToLogin(currentPath) which:
 *   1. clears the auth store
 *   2. shows a toast
 *   3. asks the registered navigate callback to push to /login?redirect=...
 *
 * Falls back to window.location.assign if the provider hasn't registered yet
 * (cold boot, before React mounts) so we never lose the redirect.
 */
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/index.js';

let navigateRef = null;

export function registerAuthNavigator(fn) {
  navigateRef = fn;
  return () => {
    if (navigateRef === fn) navigateRef = null;
  };
}

function getSafeRedirectTarget() {
  const current = window.location.pathname + window.location.search + window.location.hash;
  // Don't redirect back to login or auth pages (would be a loop)
  if (!current || current === '/' || current.startsWith('/login') ||
      current.startsWith('/register') || current.startsWith('/forgot-password') ||
      current.startsWith('/reset-password') || current.startsWith('/verify-otp')) {
    return '/';
  }
  return current;
}

export function buildLoginPath(redirectTo) {
  const target = redirectTo || getSafeRedirectTarget();
  // Encode once; React Router will decode on read.
  return `/login?redirect=${encodeURIComponent(target)}`;
}

/**
 * Force logout + smooth redirect to /login. Safe to call multiple times -
 * uses the module-level `isHandling401` flag to debounce concurrent 401s
 * so we don't show 5 toasts when 5 in-flight requests all fail.
 */
let isHandling401 = false;
export function handleSessionExpired(reason = 'expired') {
  if (isHandling401) return;
  isHandling401 = true;

  try {
    // 1. Clear auth store (Zustand). logout() also wipes localStorage tokens.
    const authStore = useAuthStore.getState();
    if (authStore?.logout) {
      authStore.logout();
    } else {
      // Defensive fallback if store shape ever changes
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }

    // 2. Show the user-facing toast. Skip if the session check on cold boot
    //    rejected a stale token - that's not really a "session expired",
    //    it's "we couldn't log you in". Only toast for true expirations.
    if (reason !== 'cold-boot') {
      toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', {
        id: 'session-expired', // dedupe toasts if handler is called twice
        duration: 4000,
      });
    }

    // 3. Smooth redirect - prefer React Router so we don't blow up state.
    const target = buildLoginPath();
    if (navigateRef) {
      navigateRef(target, { replace: true });
    } else {
      // Fallback: use replaceState so back-button doesn't take the user
      // back to the page that just kicked them out.
      window.history.replaceState({}, '', target);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  } finally {
    // Release the guard after a tick so future fresh sessions can logout
    // through the same path if needed.
    setTimeout(() => { isHandling401 = false; }, 500);
  }
}
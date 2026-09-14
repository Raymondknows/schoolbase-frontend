/**
 * Get the backend URL based on environment
 * - Explicit env var: use NEXT_PUBLIC_API_URL or NEXT_PUBLIC_BACKEND_URL
 * - Client-side: detect from window.location.hostname
 * - Server-side: use sensible defaults
 */
function normalizeBackendUrl(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

export function getBackendUrl(): string {
  // Admin pages use same-origin proxy routes so the browser keeps the staff
  // session cookie attached to settings and other protected requests.
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return window.location.origin;
  }

  // First, check if explicitly set in environment
  if (process.env.NEXT_PUBLIC_API_URL) {
    return normalizeBackendUrl(process.env.NEXT_PUBLIC_API_URL);
  }

  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return normalizeBackendUrl(process.env.NEXT_PUBLIC_BACKEND_URL);
  }

  // Allow server-side BACKEND_URL fallback if only backend env is defined.
  if (process.env.BACKEND_URL) {
    return normalizeBackendUrl(process.env.BACKEND_URL);
  }

  if (process.env.API_URL) {
    return normalizeBackendUrl(process.env.API_URL);
  }

  if (process.env.BACKEND_API_URL) {
    return normalizeBackendUrl(process.env.BACKEND_API_URL);
  }

  // Client-side: detect from window.location
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;

    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return 'http://localhost:3006';
    }

    if (host.includes('schoolbase.live')) {
      return 'https://api.schoolbase.live';
    }

    if (host.includes('vercel.app')) {
      return 'https://api.schoolbase.live';
    }
  }

  // Server-side or fallback: use NODE_ENV-based default
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.schoolbase.live';
  }

  return 'http://localhost:3006';
}

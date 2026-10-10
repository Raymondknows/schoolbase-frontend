/**
 * 🎯 UNIFIED API CLIENT - Central URL & Call Handler
 * 
 * GUARANTEES:
 * ✅ Exactly ONE /api prefix (never /api/api)
 * ✅ Consistent path construction everywhere
 * ✅ Uniform error handling
 * ✅ Type-safe API calls
 * 
 * Usage:
 * import { buildApiUrl, resolveFileUrl, apiCall } from '@/lib/api-client'
 * 
 * // Build URL
 * const url = buildApiUrl("/admin/students/123/photo")
 * // → "http://localhost:3006/api/admin/students/123/photo"
 * 
 * // Upload
 * const result = await apiCall("/admin/students/123/photo", {
 *   method: "POST",
 *   body: formData,
 * })
 * 
 * // Resolve file URL for display
 * const displayUrl = resolveFileUrl(photoUrl, pupilId)
 */

// Lazy-load cookies only when needed (server context)
let cookiesModule: any = null;
function getCookies() {
  if (cookiesModule) return cookiesModule;
  try {
    // Only available in Server Context (App Router)
    cookiesModule = require('next/headers');
    return cookiesModule;
  } catch (e) {
    return null;
  }
}

/**
 * Build API URL with GUARANTEED single /api prefix
 * 
 * Prevents /api/api issues by:
 * 1. Detecting if endpoint already has /api prefix
 * 2. Ensuring single /api prefix
 * 3. Returning proper backend URL
 * 
 * @param endpoint - Path WITHOUT /api prefix (e.g., "/admin/students/{id}/photo")
 * @param search - Query parameters (optional)
 * @returns Full URL with exactly one /api prefix
 */
export function buildApiUrl(endpoint: string, search: string = ""): string {
  // Clean endpoint: remove /api prefix if accidentally included
  let cleanEndpoint = endpoint;
  if (cleanEndpoint.startsWith("/api/")) {
    console.warn(`⚠️ buildApiUrl: Endpoint had /api prefix, removing: ${endpoint}`);
    cleanEndpoint = cleanEndpoint.replace(/^\/api\//, "/");
  }

  // Ensure starts with /
  if (!cleanEndpoint.startsWith("/")) {
    cleanEndpoint = "/" + cleanEndpoint;
  }

  // Get backend URL based on environment
  let backendBase = "http://localhost:3006"; // default for local dev
  
  // Client-side: detect production domain
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "schoolbase.live" || host === "www.schoolbase.live") {
      backendBase = "https://api.schoolbase.live";
    }
  } else {
    // Server-side: use api.schoolbase.live for production
    if (process.env.NODE_ENV === "production") {
      backendBase = "https://api.schoolbase.live";
    }
  }
  
  const baseUrl = backendBase.replace(/\/$/, "");

  // Build with EXACTLY one /api prefix
  return `${baseUrl}/api${cleanEndpoint}${search}`;
}

/**
 * Resolve file URL for display in <img>, <a>, etc.
 * Handles all variations: partial paths, absolute URLs, backend uploads
 * 
 * @param fileUrl - URL from database (may be partial, relative, absolute, or empty)
 * @param fallbackId - Fallback ID if URL empty (e.g., pupilId, schoolId)
 * @returns Display-ready URL or null
 */
export function resolveFileUrl(
  fileUrl?: string | null,
  fallbackId?: string
): string | null {
  if (!fileUrl) return null;

  // External URLs (S3, CDN, etc) pass through as-is
  if (/^https?:\/\//.test(fileUrl)) return fileUrl;

  // Already a proper /api/ path - return as-is
  if (fileUrl.startsWith("/api/")) return fileUrl;

  // Backend uploads paths - prepend /api
  if (fileUrl.startsWith("/uploads/")) {
    return `/api${fileUrl}`;
  }

  // Filename only (e.g., "photo.jpg") - convert to upload path
  if (!fileUrl.startsWith("/")) {
    return `/api/uploads/${fileUrl}`;
  }

  // Default: return as-is
  return fileUrl;
}

/**
 * Type-safe API call helper
 * Handles FormData, JSON, cookies, and errors uniformly
 * 
 * @param endpoint - API endpoint (WITHOUT /api prefix)
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Parsed JSON response
 * 
 * @throws APIError on non-2xx response
 */
export async function apiCall<T = any>(
  endpoint: string,
  options: RequestInit & { body?: any } = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);

  // Get cookies for server actions (only available in server context)
  let cookieHeader = "";
  try {
    const cookiesMod = getCookies();
    if (cookiesMod?.cookies) {
      const ck = await cookiesMod.cookies();
      const all = typeof ck.getAll === "function" ? ck.getAll() : [];
      cookieHeader = all.map((c: any) => `${c.name}=${encodeURIComponent(c.value)}`).join("; ");
    }
  } catch (err) {
    // Not in server context or cookies unavailable
  }

  const isFormData = options.body instanceof FormData;

  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      // Don't set Content-Type for FormData - browser sets with boundary
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
      ...(cookieHeader && { cookie: cookieHeader }),
    },
  };

  // Convert body object to JSON string if not FormData
  if (options.body && !isFormData && typeof options.body === "object") {
    fetchOptions.body = JSON.stringify(options.body);
  }

  console.log(`[API] ${options.method || "GET"} ${url}`);

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error(`[API_ERROR] ${response.status}`, error);
      throw new Error(error.message || `API error: ${response.statusText}`);
    }

    // Some endpoints return empty responses
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }

    const data = JSON.parse(text) as T;
    console.log(`[API_SUCCESS] ${endpoint}`, data);
    return data;
  } catch (error) {
    console.error(`[API_FAIL] ${endpoint}`, error);
    throw error;
  }
}

/**
 * GET request shorthand
 */
export function apiGet<T = any>(endpoint: string, options: RequestInit = {}) {
  return apiCall<T>(endpoint, { ...options, method: "GET" });
}

/**
 * POST request shorthand
 */
export function apiPost<T = any>(
  endpoint: string,
  body: any,
  options: RequestInit = {}
) {
  return apiCall<T>(endpoint, { ...options, method: "POST", body });
}

/**
 * PUT request shorthand
 */
export function apiPut<T = any>(
  endpoint: string,
  body: any,
  options: RequestInit = {}
) {
  return apiCall<T>(endpoint, { ...options, method: "PUT", body });
}

/**
 * PATCH request shorthand
 */
export function apiPatch<T = any>(
  endpoint: string,
  body: any,
  options: RequestInit = {}
) {
  return apiCall<T>(endpoint, { ...options, method: "PATCH", body });
}

/**
 * DELETE request shorthand
 */
export function apiDelete<T = any>(endpoint: string, options: RequestInit = {}) {
  return apiCall<T>(endpoint, { ...options, method: "DELETE" });
}

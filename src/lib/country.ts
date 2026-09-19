import { jwtVerify, SignJWT } from "jose";
import countriesJson from "../../config/countries.json";

const COOKIE_NAME = "country_v1";
export const SUPPORTED_COUNTRIES = Object.keys((countriesJson as any).countries || {}).sort();

export function parseCookies(cookieHeader?: string | null) {
  const obj: Record<string, string> = {};
  if (!cookieHeader) return obj;
  cookieHeader.split(";").forEach((part) => {
    const [k, ...v] = part.split("=");
    if (!k) return;
    obj[k.trim()] = decodeURIComponent((v || []).join("=").trim());
  });
  return obj;
}

export function normalizeCountryCode(value?: string | null) {
  if (!value) return null;
  const country = value.trim().toUpperCase();
  return SUPPORTED_COUNTRIES.includes(country) ? country : null;
}

export function getCountryFromAcceptLanguage(acceptLanguage?: string | null) {
  if (!acceptLanguage) return null;
  const parts = acceptLanguage
    .split(",")
    .map((item) => item.split(";")[0].trim().toUpperCase())
    .filter(Boolean);

  for (const part of parts) {
    const region = part.split("-")[1];
    if (region && SUPPORTED_COUNTRIES.includes(region)) {
      return region;
    }
  }

  for (const part of parts) {
    const candidate = part.slice(-2);
    if (SUPPORTED_COUNTRIES.includes(candidate)) {
      return candidate;
    }
  }

  return null;
}

function secret() {
  const key = process.env.SESSION_SECRET?.trim();
  if (!key) {
    throw new Error("SESSION_SECRET is not configured for this frontend deployment");
  }
  return new TextEncoder().encode(key);
}

export async function getCountryFromCookieHeader(cookieHeader?: string | null) {
  try {
    const cookies = parseCookies(cookieHeader);
    const token = cookies[COOKIE_NAME];
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    return normalizeCountryCode((payload as any).country ?? null);
  } catch (err) {
    console.warn("country cookie verify failed", err);
    return null;
  }
}

export function getCountryFromGeoHeaders(geoCountry?: string | null) {
  return normalizeCountryCode(geoCountry ?? null);
}

export async function getCountryFromHeaders(
  cookieHeader?: string | null,
  acceptLanguage?: string | null,
  geoCountry?: string | null,
) {
  const cookieCountry = await getCountryFromCookieHeader(cookieHeader);
  if (cookieCountry) return cookieCountry;

  const geo = getCountryFromGeoHeaders(geoCountry);
  if (geo) return geo;

  return getCountryFromAcceptLanguage(acceptLanguage);
}

export async function getCountryFromRequest(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const acceptLanguage = req.headers.get("accept-language");
    const geoCountry =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-appengine-country") ||
      req.headers.get("x-country") ||
      req.headers.get("x-country-code") ||
      req.headers.get("x-forwarded-country") ||
      req.headers.get("x-real-country") ||
      req.headers.get("x-geo-country") ||
      req.headers.get("x-edge-country") ||
      req.headers.get("x-geoip-country");

    return await getCountryFromHeaders(cookieHeader, acceptLanguage, geoCountry);
  } catch (err) {
    console.warn("country detection failed", err);
    return null;
  }
}

export async function makeCountryCookie(country: string, maxAgeSeconds = 30 * 24 * 60 * 60) {
  const token = await new SignJWT({ country }).setProtectedHeader({ alg: "HS256" }).sign(secret() as any);
  const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
  return cookie;
}

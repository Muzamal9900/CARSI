/**
 * Public site origin for client-side fetch (same-origin relative paths).
 */

const DEFAULT_PUBLIC_SITE_URL = 'https://carsi.com.au';

/**
 * Canonical absolute URL for metadata, sitemap, and SEO (metadataBase, OG URLs).
 * Treats empty/whitespace env (e.g. platform placeholder) as unset so `new URL()` never receives ''.
 */
export function getPublicSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_FRONTEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  return fromEnv || DEFAULT_PUBLIC_SITE_URL;
}

export function getBackendOrigin(): string {
  return '';
}

export function getHealthCheckPath(): string {
  const path = process.env.NEXT_PUBLIC_BACKEND_HEALTH_PATH?.trim() || '/health';
  return path.startsWith('/') ? path : `/${path}`;
}

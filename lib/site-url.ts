/**
 * The site's canonical base URL (no trailing slash), used for sitemap, robots,
 * and metadata. Prefers an explicit NEXT_PUBLIC_SITE_URL, then Vercel's
 * production URL, and finally localhost for local dev.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return 'http://localhost:3000';
}

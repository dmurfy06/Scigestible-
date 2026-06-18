import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The app and its API are user-specific and behind auth — no value to crawlers.
      disallow: ['/app', '/api/', '/auth/'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}

// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// NOTE: `site` must be the real production URL for the sitemap + canonical
// tags to be correct. This is a placeholder — update it once the Cloudflare
// domain is confirmed (e.g. https://<project>.pages.dev or a custom domain).
export default defineConfig({
  site: 'https://ai-agent-affiliate.pages.dev',
  integrations: [sitemap()],
});

// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// `site` is the production URL used for canonical tags + the sitemap.
// Currently the Cloudflare Workers URL; change this to a custom domain when
// one is added (then rebuild + redeploy so the tags/sitemap update).
export default defineConfig({
  site: 'https://ai-agent-affiliate.stevejeffery1703.workers.dev',
  integrations: [sitemap()],
});

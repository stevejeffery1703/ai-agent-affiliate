// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// `site` is the production URL used for canonical tags + the sitemap.
// Currently the Cloudflare Workers URL; change this to a custom domain when
// one is added (then rebuild + redeploy so the tags/sitemap update).
export default defineConfig({
  site: 'https://ai-agent-affiliate.stevejeffery1703.workers.dev',
  integrations: [sitemap()],

  // The finder used to live at /finder; it's now the homepage. Keep the old URL
  // working for anything already linking to it rather than 404ing.
  redirects: {
    '/finder': '/',
  },

  // Fonts are downloaded at build time and served from our own origin. That is
  // deliberate: loading them from the Google Fonts CDN would send every
  // visitor's IP to Google, which contradicts what we promise on /privacy.
  fonts: [
    {
      // Editorial serif for headings — the reference class for this site is a
      // review publication, not a SaaS landing page.
      provider: fontProviders.google(),
      name: 'Newsreader',
      cssVariable: '--font-display',
      weights: ['400 600'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-body',
      weights: ['400 700'],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});

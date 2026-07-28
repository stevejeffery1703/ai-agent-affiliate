# ai-agent-affiliate

"AgentLife" — a fast, SEO-friendly AI-agent affiliate site built with
[Astro](https://astro.build) and deployed on Cloudflare.

## Develop

```bash
npm install
npm run dev
```

Local dev server runs at http://localhost:4321.

## Build

```bash
npm run build
```

Outputs a static site to `dist/` (plus `sitemap-index.xml`).

## Deploy

The site builds to `dist/`, which Cloudflare serves as static assets
(see `wrangler.jsonc`). The GitHub repo can be connected to Cloudflare for
automatic build-and-deploy on push.

> **TODO:** set the real production URL as `site` in `astro.config.mjs` so
> canonical tags and the sitemap use the correct domain.

## Structure

- `src/pages/` — routes (file-based routing)
- `src/layouts/Base.astro` — shared HTML shell + SEO/meta head
- `src/components/` — `Header`, `Footer`, and other UI components
- `src/styles/global.css` — theme variables + global styles
- `public/` — static assets served as-is (e.g. `favicon.svg`)

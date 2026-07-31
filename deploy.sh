#!/usr/bin/env bash
# Deploy straight to Cloudflare.
#
# The Astro build is configured in wrangler.jsonc (`build.command`), so wrangler
# runs it itself — that way a Cloudflare Git-connected build, which clones the
# repo without the gitignored dist/, builds the site too instead of failing on a
# missing assets directory. Don't add `npm run build` back here; it would just
# build twice.
set -euo pipefail

npx wrangler deploy

#!/usr/bin/env bash
# Deploy straight to Cloudflare: build the Astro site, then wrangler deploy.
# GitHub is separate — run `git push` when you want to back up / sync the repo.
set -euo pipefail

npm run build
npx wrangler deploy

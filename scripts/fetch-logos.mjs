// One-off maintenance script: download a local logo for every tool that lacks
// one, and write the `logo:` field into its markdown.
//
// Logos are stored in public/assets/logos/ and served from our own origin —
// never hotlinked. A visitor's browser must not make a request to a third party
// just to render a result card (same reasoning as the self-hosted fonts).
//
//   node scripts/fetch-logos.mjs                       # fill in only the missing ones
//   node scripts/fetch-logos.mjs --force               # re-fetch everything
//   node scripts/fetch-logos.mjs --force canva tldv    # re-fetch just these slugs
//
// Source order per tool: the tool's own site first (best fidelity), then
// DuckDuckGo's icon service as a fallback. Anything that fails is reported and
// left alone — the UI already falls back to a coloured initial.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOOLS_DIR = join(ROOT, 'src/content/tools');
const LOGO_DIR = join(ROOT, 'public/assets/logos');
const FORCE = process.argv.includes('--force');
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('--'));

// A 32px favicon is blurry on a 2x display at our 32px render size, and .ico is
// a last resort — so rank candidates rather than taking the first that loads.
const MIN_RASTER = 64;
function quality(c) {
  if (c.dim.vector) return 100000; // scales perfectly, always wins
  return c.ext === 'ico' ? c.dim.w * 0.5 : c.dim.w;
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// --------------------------------------------------------------- dimensions
// Enough header parsing to reject tiny icons, without pulling in an image lib.
function dimensions(buf, contentType) {
  if (contentType.includes('svg') || buf.subarray(0, 200).toString('utf8').includes('<svg')) {
    return { w: 1024, h: 1024, vector: true }; // scalable — always preferred
  }
  // PNG: IHDR width/height at bytes 16..23
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  // ICO: first directory entry at byte 6; 0 encodes 256
  if (buf.length > 8 && buf.readUInt16LE(0) === 0 && buf.readUInt16LE(2) === 1) {
    return { w: buf[6] || 256, h: buf[7] || 256 };
  }
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) return { w: 64, h: 64 }; // JPEG, assume ok
  return null;
}

function extFor(contentType, buf) {
  if (contentType.includes('svg') || buf.subarray(0, 200).toString('utf8').includes('<svg')) return 'svg';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('icon') || contentType.includes('ico')) return 'ico';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  return null;
}

async function tryFetch(url) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': UA, accept: 'image/*,*/*' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('text/html')) return null; // soft-404 page
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 300) return null; // placeholder/empty
    const ext = extFor(ct, buf);
    if (!ext) return null;
    const dim = dimensions(buf, ct);
    if (!dim || dim.w < 32) return null;
    // Reject wordmarks. The card renders logos in a 32px square, so a wide
    // lockup like "900x258" would shrink to ~32x9 and be unreadable — we need
    // the square app mark, not the horizontal logo.
    if (!dim.vector && (dim.w / dim.h > 1.4 || dim.h / dim.w > 1.4)) return null;
    return { buf, ext, dim, url };
  } catch {
    return null;
  }
}

// Web app manifests are the best single source: they usually declare 192px and
// 512px icons, which beats anything in <link rel=icon>.
async function fromManifest(origin) {
  for (const name of ['/site.webmanifest', '/manifest.json', '/manifest.webmanifest']) {
    try {
      const res = await fetch(origin + name, {
        redirect: 'follow',
        headers: { 'user-agent': UA },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const json = JSON.parse(await res.text());
      const icons = json.icons || json.shortcuts?.[0]?.icons;
      if (!Array.isArray(icons)) continue;
      return icons
        .map((i) => ({
          url: new URL(i.src, res.url).href,
          size: Math.max(...String(i.sizes || '0').split(/\s+/).map((s) => parseInt(s) || 0)),
        }))
        .sort((a, b) => b.size - a.size)
        .map((i) => i.url)
        .slice(0, 4);
    } catch {
      /* try the next manifest name */
    }
  }
  return [];
}

// Pull icon hrefs out of the homepage when it's reachable — this is where the
// genuinely good, product-specific logos live.
async function fromHomepage(siteUrl) {
  try {
    const res = await fetch(siteUrl, {
      redirect: 'follow',
      headers: { 'user-agent': UA, accept: 'text/html' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const html = (await res.text()).slice(0, 200000);
    const out = [];
    const re = /<link\b[^>]*>/gi;
    let m;
    while ((m = re.exec(html))) {
      const tag = m[0];
      if (!/rel\s*=\s*["'][^"']*icon/i.test(tag)) continue;
      const href = /href\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
      if (!href) continue;
      const sizes = /sizes\s*=\s*["'](\d+)/i.exec(tag)?.[1];
      out.push({ url: new URL(href, res.url).href, hint: sizes ? Number(sizes) : 0 });
    }
    // Biggest declared size first; apple-touch-icons tend to be the cleanest.
    return out.sort((a, b) => b.hint - a.hint).map((o) => o.url).slice(0, 5);
  } catch {
    return [];
  }
}

function frontmatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  return m ? m[1] : '';
}

const files = readdirSync(TOOLS_DIR).filter((f) => f.endsWith('.md'));
if (!existsSync(LOGO_DIR)) mkdirSync(LOGO_DIR, { recursive: true });

const results = { ok: [], skipped: [], failed: [], lowRes: [] };

for (const file of files) {
  const slug = file.replace(/\.md$/, '');
  const path = join(TOOLS_DIR, file);
  const raw = readFileSync(path, 'utf8');
  const fm = frontmatter(raw);

  if (ONLY.length && !ONLY.includes(slug)) continue;

  if (/^logo:/m.test(fm) && !FORCE) {
    results.skipped.push(slug);
    continue;
  }

  const site = /^websiteUrl:\s*"?([^"\n\r]+)"?/m.exec(fm)?.[1]?.trim();
  if (!site) {
    results.failed.push(`${slug} (no websiteUrl)`);
    continue;
  }

  const origin = new URL(site).origin;
  const host = new URL(site).hostname.replace(/^www\./, '');

  const candidates = [
    ...(await fromManifest(origin)),
    ...(await fromHomepage(site)),
    `${origin}/favicon.svg`,
    `${origin}/icon.svg`,
    `${origin}/apple-touch-icon.png`,
    `${origin}/apple-touch-icon-precomposed.png`,
    `${origin}/apple-icon-180x180.png`,
    `${origin}/icon.png`,
    `${origin}/logo.png`,
    `${origin}/favicon-192x192.png`,
    `${origin}/favicon-96x96.png`,
    // Third-party fallbacks. Fetched ONCE here and stored locally — a visitor's
    // browser never touches these.
    `https://www.google.com/s2/favicons?domain=${host}&sz=256`,
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
    `${origin}/favicon.ico`,
  ];

  let best = null;
  for (const url of candidates) {
    const got = await tryFetch(url);
    if (!got) continue;
    if (!best || quality(got) > quality(best)) best = got;
    // Good enough to stop paying for more requests.
    if (best.dim.vector || (best.ext !== 'ico' && best.dim.w >= 180)) break;
  }

  if (!best) {
    results.failed.push(`${slug} (${host})`);
    continue;
  }
  if (!best.dim.vector && best.dim.w < MIN_RASTER) {
    results.lowRes.push(`${slug} ${best.dim.w}px .${best.ext} — best available`);
  }

  // Remove any previous file for this slug so changing extension doesn't
  // orphan the old one.
  for (const old of readdirSync(LOGO_DIR)) {
    if (old.replace(/\.[^.]+$/, '') === slug) rmSync(join(LOGO_DIR, old));
  }

  const outName = `${slug}.${best.ext}`;
  writeFileSync(join(LOGO_DIR, outName), best.buf);

  // Insert `logo:` right after websiteUrl to match the existing field order.
  const logoLine = `logo: "/assets/logos/${outName}"`;
  let updated;
  if (/^logo:.*$/m.test(fm)) {
    updated = raw.replace(/^logo:.*$/m, logoLine);
  } else {
    updated = raw.replace(/^(websiteUrl:.*)$/m, `$1\n${logoLine}`);
  }
  writeFileSync(path, updated);

  results.ok.push(`${slug} ${best.dim.vector ? 'svg' : best.dim.w + 'px'} ${(best.buf.length / 1024).toFixed(1)}kb`);
}

console.log(`\nFetched ${results.ok.length}:`);
for (const r of results.ok) console.log('  ' + r);
if (results.skipped.length) console.log(`\nAlready had a logo (${results.skipped.length}): ${results.skipped.join(', ')}`);
if (results.failed.length) {
  console.log(`\nFAILED ${results.failed.length} — these keep the coloured-initial fallback:`);
  for (const r of results.failed) console.log('  ' + r);
}

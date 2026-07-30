# Task icons

Vendored from [Lucide](https://lucide.dev) v1.28.0 — ISC License,
Copyright (c) 2026 Lucide Icons and Contributors.

Copied in rather than imported from `node_modules` so the build doesn't depend
on the package staying installed (same reasoning as the self-hosted fonts).
They are inlined at build time by `src/components/TaskIcon.astro`.

`stroke="currentColor"` is load-bearing: it lets an icon inherit `--accent`
when its option is selected. Don't replace it with a fixed colour.

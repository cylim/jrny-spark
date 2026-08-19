# Spark ✦ — jrny-spark

A couples intimacy game PWA by [JRNY](https://jrny.app) — a board-game
journey (snakes & ladders with a twist) where the cards do the real work.
Live target: **spark.jrny.app**.

📄 **Read [PRD.md](./PRD.md) first** — product scope, game design, the
privacy line, and architecture decisions all live there.

## Stack

TanStack Start (React 19, Vite) · Convex · Clerk · Tailwind CSS v4 ·
IndexedDB (`idb`) · Workbox PWA · Bun.

## Quick start (zero config — demo mode)

```sh
bun install
bun dev            # http://localhost:3000
```

With no env vars the app runs in **demo mode**: fully playable with a small
bundled sample deck, no sign-in, no cloud saves. A dev-only banner reminds
you what's unconfigured.

## Full setup

1. **Convex** — `bun run dev:convex` (creates/attaches a deployment, writes
   `VITE_CONVEX_URL` into `.env.local`, watches functions, regenerates
   `convex/_generated/`). Keep it running next to `bun dev`.
2. **Seed the starter decks** — `bun run seed` (idempotent; re-run any time
   you edit `convex/starterDecks.ts` — deck iteration needs no redeploy).
3. **Clerk** — create an app at dashboard.clerk.com with **Google + Apple
   OAuth only** (no passwords, PRD §6.1). Copy keys into `.env.local`
   (see `.env.example`).
4. **Connect Clerk → Convex** — in the Clerk dashboard create a JWT template
   named `convex`; in the Convex dashboard set `CLERK_JWT_ISSUER_DOMAIN` to
   your Clerk Frontend API URL (see `convex/auth.config.ts`).

## Scripts

| Script | What |
|---|---|
| `bun dev` | Vite dev server (port 3000) |
| `bun run dev:convex` | Convex dev deployment + codegen watcher |
| `bun run build` | Production build **+ service worker** (`scripts/build-pwa.ts`) |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run seed` | Seed/refresh starter decks |
| `bun run icons` | Regenerate placeholder PWA icons |
| `bun scripts/simulate.ts` | Simulate 2000 games through the engine — termination check + session-length stats |

## Architecture notes (scaffold decisions)

- **Game engine is pure TS** (`src/game/engine.ts`) — `(state, event) → state`,
  all randomness enters via events, sessions persist to IndexedDB and
  auto-resume. Framework-agnostic on purpose (PRD §9, stack-churn risk).
- **Privacy line is structural** (PRD §2.1): no Convex function accepts
  session/gameplay payloads — standing code-review rule.
- **PWA**: static `public/manifest.webmanifest` + post-build Workbox SW.
  `vite-plugin-pwa` is intentionally NOT used — its SW generation is
  silently skipped alongside `tanstackStart()` (TanStack/router#4988).
- **Plain `convex/react` hooks** (no `@convex-dev/react-query` yet) — data
  is client-side; add the React Query integration when SSR'd data pages
  appear (documented upgrade path, PRD §6.2).
- `convex/_generated/` **is committed** — TypeScript fails without it. If
  it's stale, run `bunx convex codegen` (or let `dev:convex` regenerate).

## Deploy (spark.jrny.app)

Not wired yet — PRD §10.5. `bun run build` produces `dist/client` +
`dist/server` and drops `sw.js` into `dist/client`. Host on
Vercel/Netlify/Cloudflare, set `VITE_CONVEX_URL` + Clerk prod keys in build
env, run `npx convex deploy` for the prod Convex deployment.

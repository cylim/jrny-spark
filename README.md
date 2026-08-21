# Spark ✦ — jrny-spark

A couples intimacy game PWA by [JRNY](https://jrny.app) — a board-game
journey (snakes & ladders with a twist) where the cards do the real work.
Live target: **spark.jrny.app**.

📄 **Read [PRD.md](./PRD.md) first** — product scope, game design, the
privacy line, and architecture decisions all live there. Vocabulary follows
[CONTEXT.md](./CONTEXT.md); the privacy boundary is
[ADR 0001](./docs/adr/0001-play-data-never-leaves-the-device.md).

## Stack

TanStack Start (React 19, Vite) · Convex · Clerk · Tailwind CSS v4 ·
IndexedDB (`idb`) · Workbox PWA · PostHog (content-free analytics) · Bun.

## Quick start (zero config)

```sh
bun install
bun dev            # http://localhost:3000
```

With no env vars the app falls back to the bundled **Sample Deck**: fully
playable, no sign-in, no cloud saves. A dev-only banner reminds you what's
unconfigured. (The Sample Deck is a fallback, not a mode — it also covers a
first-ever visit that happens offline.)

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
5. **PostHog (optional)** — create a project in the **US** region and put its
   API key in `VITE_POSTHOG_KEY`. Without it no analytics code runs. In the
   project settings turn on "Discard client IP data". See _Analytics_ below.

## Scripts

| Script                    | What                                                                              |
| ------------------------- | --------------------------------------------------------------------------------- |
| `bun dev`                 | Vite dev server (port 3000)                                                       |
| `bun run dev:convex`      | Convex dev deployment + codegen watcher                                           |
| `bun run build`           | Production build **+ service worker** (`scripts/build-pwa.ts`)                    |
| `bun run typecheck`       | `tsc --noEmit`                                                                    |
| `bun run seed`            | Seed/refresh starter decks                                                        |
| `bun run icons`           | Regenerate placeholder PWA icons                                                  |
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
- **Analytics are content-free by construction** (PRD §6.9, ADR 0001).
  `src/lib/analytics/events.ts` is the single reviewed allow-list: a typed
  event union (closed values, bucketed numbers) plus a runtime property table
  installed as PostHog's `before_send`, so anything not on the list — PostHog's
  own internal events included — is dropped before it leaves the device.
  PostHog runs cookieless (a resettable anonymous id in localStorage only),
  with autocapture, session replay, surveys, feature flags and external
  scripts off. The Settings opt-out is read from IndexedDB _before_ PostHog is
  initialized. Adding an event = editing that one file and re-reviewing it
  against the Privacy Line; `track()` accepts nothing else.

## Deploy (spark.jrny.app)

Not wired yet — target is **Cloudflare Workers** (PRD §6.1). `bun run build`
produces `dist/client` + `dist/server` and drops `sw.js` into `dist/client`.
Set `VITE_CONVEX_URL` + Clerk prod keys in build env, run `npx convex deploy`
for the prod Convex deployment.

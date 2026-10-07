# Spark ✦ — jrny-spark

A couples intimacy game PWA by [JRNY](https://jrny.app) — a board-game
journey (snakes & ladders with a twist) where the cards do the real work.
Live target: **spark.jrny.app**.

📄 **Read [PRD.md](./PRD.md) first** — product scope, game design, the
privacy line, and architecture decisions all live there. Vocabulary follows
[GLOSSARY.md](./GLOSSARY.md); the privacy boundary is
[ADR 0001](./docs/adr/0001-play-data-never-leaves-the-device.md).

## Stack

TanStack Start (React 19, Vite) · Convex · Clerk · Tailwind CSS v4 ·
IndexedDB (`idb`) · Workbox PWA · PostHog (content-free analytics) · Bun ·
Cloudflare Workers.

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

| Script                    | What                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `bun dev`                 | Vite dev server (port 3000)                                                                                          |
| `bun run dev:convex`      | Convex dev deployment + codegen watcher                                                                              |
| `bun run build`           | Production build **+ service worker** (`scripts/build-pwa.ts`)                                                       |
| `bun run preview`         | Serve the built app in Miniflare (the real workerd runtime)                                                          |
| `bun run deploy`          | Full manual prod deploy: Convex functions + build + Worker (CI does the same on push)                                |
| `bun run deploy:dev`      | Manual deploy to `jrny-spark-dev` — builds against `.env.local`'s dev Convex URL (functions stay `dev:convex`'s job) |
| `bun run typecheck`       | `tsc --noEmit`                                                                                                       |
| `bun run test`            | vitest — engine tests (node) + Convex function tests (edge-runtime)                                                  |
| `bun run seed`            | Seed/refresh starter decks                                                                                           |
| `bun run icons`           | Regenerate placeholder PWA icons                                                                                     |
| `bun scripts/simulate.ts` | Simulate 2000 games through the engine — termination check + session-length stats                                    |

## Architecture notes (scaffold decisions)

- **Game engine is pure TS** (`src/game/engine.ts`) — `(state, event) → state`,
  all randomness enters via events, sessions persist to IndexedDB and
  auto-resume. Framework-agnostic on purpose (PRD §9, stack-churn risk).
- **Privacy line is structural** (PRD §2.1): no Convex function accepts
  session/gameplay payloads — standing code-review rule.
- **PWA**: static `public/manifest.webmanifest` + post-build Workbox SW.
  `vite-plugin-pwa` is intentionally NOT used — its SW generation is
  silently skipped alongside `tanstackStart()` (TanStack/router#4988).
  Updates are **prompted, not silent** (`skipWaiting: false`): when a new
  deploy is live, installed/home-screen apps get an "Update" toast
  (`src/components/RegisterSW.tsx`, which also re-checks hourly and on
  foreground since home-screen PWAs rarely navigate).
- **Plain `convex/react` hooks** (no `@convex-dev/react-query` yet) — data
  is client-side; add the React Query integration when SSR'd data pages
  appear (documented upgrade path, PRD §6.2).
- `convex/_generated/` **is committed** — TypeScript fails without it. If
  it's stale, run `bunx convex codegen` (or let `dev:convex` regenerate).
- **Analytics are content-free by construction** (PRD §6.9, ADR 0001).
  `src/lib/analytics.ts` is the single reviewed allow-list: a typed
  event union (closed values, bucketed numbers) plus a runtime property table
  installed as PostHog's `before_send`, so anything not on the list — PostHog's
  own internal events included — is dropped before it leaves the device.
  PostHog runs cookieless (a resettable anonymous id in localStorage only),
  with autocapture, session replay, surveys, feature flags and external
  scripts off. The Settings opt-out is read from IndexedDB _before_ PostHog is
  initialized. Adding an event = editing that one file and re-reviewing it
  against the Privacy Line; `track()` accepts nothing else.

## Deploy (spark.jrny.app)

Spark ships as a Cloudflare Worker: the TanStack Start SSR handler plus
the `dist/client` static assets (including `sw.js`), built by
`@cloudflare/vite-plugin` (config: `wrangler.jsonc`). `vite preview` runs
the same workerd runtime locally via Miniflare.

There are **two deployed environments** — separate Workers, separate
secrets, separate backends:

|          | Worker                          | Deployed by                           | Convex                                          | Clerk                      |
| -------- | ------------------------------- | ------------------------------------- | ----------------------------------------------- | -------------------------- |
| **prod** | `jrny-spark` (→ spark.jrny.app) | push to `main`                        | prod deployment                                 | prod (`pk_live`/`sk_live`) |
| **dev**  | `jrny-spark-dev` (workers.dev)  | push to `dev`, or manual Run workflow | the dev deployment (same one `dev:convex` uses) | dev (`pk_test`/`sk_test`)  |

The environment is chosen at **build time** (`CLOUDFLARE_ENV=dev` selects
`env.dev` in `wrangler.jsonc`; wrangler auto-names the Worker
`jrny-spark-dev`) — a plain `wrangler deploy` then ships whichever env the
build baked in. Since CI's dev deploys push functions to the shared dev
Convex deployment, a locally running `dev:convex` watcher and a dev deploy
can overwrite each other — fine solo, just don't be surprised.

**CI/CD is wired** — `.github/workflows/deploy.yml`. Every deploy run:
typecheck → `convex deploy --cmd 'bun run build'` (pushes Convex functions
and bakes that deployment's `VITE_CONVEX_URL` into the bundle) → seed
starter decks (idempotent — editing `convex/starterDecks.ts` auto-ships) →
`wrangler deploy`. PRs get typecheck only.

### One-time setup

Fastest path: `bash scripts/setup-deploy.sh` — an interactive wizard that
opens each dashboard, tells you what to copy, and writes the GitHub
secrets/vars, Worker secrets, and Convex env vars for you (re-runnable;
remembers values in the gitignored `.env.deploy.local`). By hand:

1. **GitHub Actions secrets/vars** (repo → Settings → Secrets and
   variables → Actions):

   | Name                                        | Kind                   | Where it comes from                                                             |
   | ------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------- |
   | `CONVEX_DEPLOY_KEY`                         | secret                 | Convex dashboard → **prod** deployment → Settings → Deploy key (`prod:…`)       |
   | `CONVEX_DEPLOY_KEY_DEV`                     | secret                 | Convex dashboard → **dev** deployment → Settings → Deploy key (`dev:…`)         |
   | `CLOUDFLARE_API_TOKEN`                      | secret                 | dash.cloudflare.com → profile → API Tokens → "Edit Cloudflare Workers" template |
   | `CLOUDFLARE_ACCOUNT_ID`                     | secret                 | Cloudflare dashboard → Workers overview, right sidebar                          |
   | `VITE_CLERK_PUBLISHABLE_KEY`                | **variable**           | Clerk prod instance (`pk_live_…`) — public, ends up in the JS bundle            |
   | `VITE_CLERK_PUBLISHABLE_KEY_DEV`            | **variable**           | Clerk dev instance (`pk_test_…`, same as `.env.local`)                          |
   | `VITE_POSTHOG_KEY` / `VITE_POSTHOG_KEY_DEV` | **variable**, optional | PostHog project key per environment — leave unset and no analytics code runs    |

2. **Worker runtime secrets** (once per Worker, not per-deploy):
   `bunx wrangler secret put CLERK_SECRET_KEY` (prod `sk_live_…`) and
   `bunx wrangler secret put CLERK_SECRET_KEY --env dev` (dev `sk_test_…`).
   They reach `src/start.ts` as `process.env.CLERK_SECRET_KEY` via the
   Workers `nodejs_compat` process.env population.
3. **Convex dashboard** (prod deployment → Settings → Environment
   Variables): `CLERK_JWT_ISSUER_DOMAIN` = your Clerk prod Frontend API
   URL. (Goes in the _Convex_ dashboard, not Cloudflare — Convex functions
   run on Convex's servers. Easiest thing to misplace.) The **dev**
   deployment needs the same var with the Clerk _dev_ Frontend API URL —
   already set if sign-in works locally.
4. **Clerk prod instance** (created for the `jrny.app` domain, which
   covers spark.jrny.app): Google + Apple OAuth only, JWT template named
   `convex`. The Clerk **dev** instance needs the same `convex` template —
   already there if sign-in works locally — and dev instances work from any
   origin, so the workers.dev URL needs no Clerk config.
5. **Custom domain**: once the `jrny.app` zone is on this Cloudflare
   account, uncomment `routes` in `wrangler.jsonc` — until then the app
   lives at `jrny-spark.<account>.workers.dev`.

Env var placement, at a glance: `VITE_*` are **build-time** (GitHub
Actions env; `VITE_CONVEX_URL` is injected by `convex deploy` — never set
it in CI), `CLERK_SECRET_KEY` is **Worker runtime** (wrangler secret),
`CLERK_JWT_ISSUER_DOMAIN` is **Convex runtime** (Convex dashboard).

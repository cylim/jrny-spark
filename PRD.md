# Spark — Couples Intimacy Game PWA — PRD v1

> Codename: `jrny-spark` · Live at `spark.jrny.app` · Part of the JRNY family (`jrny.app`)

## 1. Product Overview

### 1.1 App Identity

| Attribute | Value |
|-----------|-------|
| **App Name** | Spark |
| **Brand** | Spark — by JRNY |
| **Tagline** | Play your way closer. |
| **Domain** | spark.jrny.app (subdomain of jrny.app, owned) |
| **Codename / Repo** | jrny-spark |
| **Platform** | Mobile-first PWA (installable, offline-capable); responsive desktop works but is secondary |
| **Distribution** | Web only — no app stores. Add-to-homescreen is the install path |
| **Age Rating** | 18+ gate for Spicy tier; Sweet/Flirty tiers are all-ages-appropriate romantic content |

### 1.2 App Purpose

Spark is an intimacy game platform for two people — couples at any stage (newly met, long-term, or taking the next step). It launches with one game: a **Snakes & Ladders–style board game** where landing on tiles draws conversation/action prompt cards. The board is the delivery mechanism; **the prompt cards are the product**.

The platform is designed to grow beyond one game and beyond two players:

1. **Journey Board** (MVP) — Snakes & Ladders with escalating intimacy prompts
2. **More game modes** (later) — Truth or Dare, Date Dice, themed card decks
3. **Group play** (later) — bonding/icebreaker decks for friends, families, team onboarding

### 1.3 Positioning & Brand Constraints

- Brand voice is **romantic wellness / couples bonding** — warm, playful, tasteful. Never explicit in public copy, store metadata, or payment descriptions. This is a hard constraint: payment processors (Stripe et al.) restrict "adult" products, and explicit branding would get the product flagged.
- Spicy-tier content lives behind the 18+ age gate and is written as suggestive/intimate, not pornographic.
- JRNY is the umbrella brand ("a relationship is a journey; the board is literally a path"). Sibling apps live on other subdomains (e.g. fuel.jrny.app).

### 1.4 Target Users

| Segment | Need | Priority |
|---------|------|----------|
| New couples (first months) | Fun, low-pressure way to learn about each other | MVP |
| Long-term couples | Reconnect, break routine, rediscover each other | MVP |
| Couples "taking the next step" | Structured, playful escalation at their own pace | MVP |
| Friend groups / gatherings | Bonding and icebreaker play (3+ players) | Phase 3 |
| Teams / onboarding | Get-to-know-you play in a professional register | Phase 3 (exploratory) |

### 1.5 Success Metrics

| Metric | MVP Target | Phase 2 Target |
|--------|-----------|----------------|
| Session completion rate (reach recap screen) | 60% | 70% |
| Median session length | 15–30 min | 15–30 min |
| Prompts drawn per session | ≥ 12 | ≥ 15 |
| Return play (2nd session within 14 days) | 30% | 40% |
| PWA install rate (of repeat visitors) | 20% | 30% |
| Account creation (of players who build a custom game) | 50% | 60% |
| Premium deck attach rate | — (free MVP) | 5% of accounts |

*Measurement note: metrics must respect the privacy line (§2.1). We can count that a prompt was drawn; we never record which prompt or anything entered/answered. See §6.9.*

---

## 2. Core Principles

### 2.1 The Privacy Line (non-negotiable)

This is sensitive data. Trust is the product's survival condition — any privacy slip kills it permanently.

| Server KNOWS | Server NEVER knows |
|--------------|--------------------|
| Who you are (Clerk identity) | What happened during a session |
| What you bought (Phase 2 purchases) | Which prompts you drew or skipped |
| Game configs you saved (board + custom prompt text + tier) | Any answer, note, photo, or partner name |
| Coarse product analytics (screens, counts — no content) | Player names (local-only) |

Rules that follow from the line:

- **Local-first**: live gameplay state lives in memory + IndexedDB on the device. It is never sent to Convex.
- No server-side logging of prompt draws or session content. Convex functions never accept session-state payloads.
- Anonymous play is always allowed. An account is only needed to **save custom games** (and later, premium unlock).
- A plain-language privacy statement ships in the app (`/privacy`) stating exactly the table above.
- "Clear all local data" is one tap in Settings.

### 2.2 Content Tiers

| Tier | Name | Register | Examples of register (not final copy) |
|------|------|----------|----------------------------------------|
| 1 | **Sweet** | Warm, curious, PG | "What's a small thing I do that you secretly love?" |
| 2 | **Flirty** | Playful, teasing, romantic | "Give your partner a 10-second compliment — eye contact required." |
| 3 | **Spicy** | Intimate, suggestive, 18+ | Suggestive dares/questions; never explicit in wording |

- Tier is chosen at session setup; the age gate (18+ self-confirmation, remembered locally) is required before Spicy is selectable.
- Tiers widen the market: the same product serves date-night-sweet through spicy.

### 2.3 Session Design

- Target session length: **15–30 minutes** with a clear ending (recap screen).
- **Escalation**: prompt intensity rises as players climb the board, matching the ladder mechanic. Within a tier, the board is split into three zones (see §4.4).
- One phone, passed between partners — no pairing, no latency, no accounts required to start playing within 30 seconds of first visit.

### 2.4 Prompt Quality Bar

Boring prompts kill the product — this is the #1 product risk. Deck authoring rules:

- 100+ prompts per tier at maturity; MVP ships with ≥ 60 per tier and grows weekly.
- Every prompt is **actionable in under 2 minutes**, requires no props (prop prompts are tagged and optional), and works regardless of gender pairing.
- Mix: ~60% questions, ~30% micro-actions/dares, ~10% "together" mini-activities.
- Every prompt readable aloud comfortably — the reader test: "would this feel awkward to read to your partner, in a bad way?"
- Skipping is always allowed and free of penalty (a "skip" is not tracked server-side).

---

## 3. Scope & Phases

### 3.1 Phase 1 — MVP (free, target: 2–3 weeks to beta)

| Feature | In MVP | Notes |
|---------|--------|-------|
| Journey Board game (Snakes & Ladders) | ✅ | One board preset, classic 10×10 |
| Pass-the-phone play, 2 players | ✅ | Local player names, local turn state |
| 3 content tiers with starter decks | ✅ | Decks fetched from Convex, cached in IndexedDB for offline |
| Age gate (18+) for Spicy | ✅ | Local flag; blocks Spicy tier only |
| Anonymous play | ✅ | Zero-friction first session |
| Clerk auth (Google + Apple OAuth) | ✅ | No email/password. Only needed to save games |
| Custom game builder | ✅ | Name, tier, custom prompts on chosen tiles; playable without saving |
| Saved games (cloud) | ✅ | Config-only sync to Convex; local IndexedDB copy for offline |
| Session auto-resume | ✅ | Local only — reload/app-switch safe |
| PWA: installable + offline | ✅ | Full offline play with cached decks |
| Recap screen | ✅ | Local stats only (tiles travelled, cards drawn) |
| Privacy statement + clear-data | ✅ | |
| Payments / premium | ❌ | Schema stubs only (§6.5); no Stripe in MVP |
| Realtime / two-device play | ❌ | Phase 3 |
| Analytics | ❌ (or §6.9 minimal) | Decide before beta |

### 3.2 Phase 2 — Premium & More Games

- **Premium decks**: one-time unlock per deck (one-time beats subscription for this niche). Stripe Checkout → webhook → Convex `httpAction` → `purchases` insert. Deck prompts are **server-gated** (§6.5) — never shipped in the client bundle.
- Themed decks: e.g. "First Date", "Long Distance Reunion", "Anniversary", seasonal.
- New game modes on the same deck system: **Truth or Dare**, **Date Dice** (roll-to-prompt without a board).
- Deck localization groundwork (i18n).

### 3.3 Phase 3 — Together & Groups

- **Two-device play** via room codes — Convex reactivity makes this near-trivial: move the (consented) shared board state into a table. The privacy line still holds: prompts drawn sync; answers never leave the room's devices... and are never persisted.
- **Group mode** (3+ players): icebreaker/bonding decks, turn rotation, group-safe register.
- Public deck marketplace / community decks — exploratory, heavy moderation implications.

### 3.4 Non-Goals (explicit)

- No native iOS/Android apps (PWA only; revisit only if install friction proves fatal).
- No chat/messaging, no photo sharing, no user-generated public content in MVP/Phase 2.
- No subscription billing in Phase 2 (one-time unlocks only) unless data argues otherwise.
- No ads, ever — incompatible with trust positioning.

---

## 4. Game Design — Journey Board

### 4.1 Board

- Classic **10×10 grid, 100 tiles**, boustrophedon path (left→right, then right→left ascending), start off-board at tile 0, finish at tile 100.
- Default preset: 8 ladders, 8 snakes, hand-tuned so median game (2 players, d6) lands in the 15–30 min window with prompt time included.
- Board rendered as a responsive CSS grid; portrait-first (one-hand hold while passing the phone).

### 4.2 Tile Types

| Tile | Effect | Prompt behavior |
|------|--------|-----------------|
| **Prompt tile** (~65% of tiles) | none | Draw a card from the active deck for the current zone |
| **Ladder foot** | Climb to ladder top | Draw a **"closer" card** (reward-flavored, from the same zone as the ladder top — a taste of what's ahead) |
| **Snake head** | Slide to snake tail | Player choice: accept the slide, or **"charm the snake"** — take a dare-flavored card one zone up to stay put |
| **Neutral** (20%) | none | Breather — no card (density is the main session-length tuning knob — see `scripts/simulate.ts`) |
| **Finish (100)** | Game ends | Recap screen |

The "charm the snake" choice is the signature mechanic: it converts the game's only negative beat into an opt-in intimacy beat, and it lets the trailing player stay competitive.

### 4.3 Dice & Turns

- Single d6, tap-to-roll with animation + haptics (Vibration API where available).
- Exact roll **not** required to finish (MVP simplification — overshoot lands on 100).
- Turn banner shows whose turn it is by (local) player name; phone is passed on card resolution.

### 4.4 Escalation Zones

Within the selected tier, prompts carry a zone tag; the board position selects the zone:

| Zone | Tiles | Register within the tier |
|------|-------|--------------------------|
| Warm-up | 1–33 | Light, easy openers |
| Deeper | 34–66 | More personal, more daring |
| Close | 67–100 | The tier's full intensity |

A **Sweet zone-3** card is still sweet; a **Spicy zone-1** card is still an easy on-ramp. Escalation is within-tier, so consent granted at setup (tier choice) is never exceeded mid-game.

### 4.5 Decks & Cards

- A **deck** = tier + ordered pool of prompts, each prompt tagged with zone (1–3), kind (`question` | `action` | `together`), and optional `props: true`.
- Draw = uniform random from the active deck's matching zone, without replacement per session (reshuffle when a zone pool is exhausted).
- MVP ships 3 starter decks (one per tier), ≥ 60 prompts each, authored to the §2.4 bar.
- **Custom games** may override/add prompts on specific tiles (fixed-tile prompts trump deck draws).

### 4.6 Recap

End screen shows: tiles travelled, snakes charmed, ladders climbed, cards drawn, session duration — all computed locally, displayed once, stored only in local history (optional), never uploaded. CTA: "Save this game setup" (→ auth) and "Play again".

---

## 5. UX — Screens & Routes

Mobile-first. All routes are TanStack Start file routes.

| Route | Screen | Auth | Notes |
|-------|--------|------|-------|
| `/` | Landing | — | Value prop, "Play now", install hint, tier explainer |
| `/play/setup` | Session setup | — | Player names (local), tier select (age gate intercepts Spicy), deck/saved-game select |
| `/play` | Game board | — | The Journey Board session; auto-resume from IndexedDB |
| `/play/recap` | Recap | — | Local stats; save-game CTA |
| `/games` | Saved games | ✅ | List/duplicate/delete saved configs; syncs Convex ↔ IndexedDB |
| `/games/new` | Custom game builder | save = ✅ | Build board/prompt overrides; playing a draft needs no account |
| `/sign-in` | Clerk sign-in | — | Google + Apple only |
| `/settings` | Settings | — | Age-gate reset, clear local data, install app, account section |
| `/privacy` | Privacy statement | — | The §2.1 table in plain language |

**Key components**: `Board`, `Tile`, `PlayerToken`, `Dice`, `PromptCard` (full-screen card modal with flip animation), `TierBadge`, `AgeGate`, `DeckPicker`, `TurnBanner`, `InstallPrompt`, `SnakeCharmChoice`.

**First-session flow (30-second rule)**: Landing → Play now → names + tier (2 taps + optional typing) → rolling within 30 seconds. No account wall anywhere on this path.

---

## 6. Technical Architecture

### 6.1 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | TanStack Start (React 19, Vite, SSR) | File-based routing, server functions, PWA-friendly Vite build |
| **Language** | TypeScript (strict) | Type safety end-to-end |
| **Runtime / PM** | Bun | Install, dev, scripts (`bun dev`) |
| **Styling** | Tailwind CSS v4 | Utility-first, `@tailwindcss/vite` |
| **Auth** | Clerk (`@clerk/tanstack-react-start`) | Google + Apple OAuth; no passwords |
| **Backend / DB** | Convex | Decks, saved games, (later) purchases; reactive queries |
| **Convex↔Clerk** | `ConvexProviderWithClerk` (`convex/react-clerk`) | Clerk JWT verified server-side in every function |
| **Local storage** | IndexedDB (`idb`) | Session state, deck cache, age-gate flag, drafts |
| **PWA** | Workbox (`workbox-build`, post-build script) | Installability, offline app shell — `vite-plugin-pwa` is skipped alongside `tanstackStart()` (TanStack/router#4988), so the SW is generated by `scripts/build-pwa.ts` and the manifest is static |
| **State** | React state + custom hooks | No state library — game engine is a reducer; Convex covers server state |
| **Deploy** | spark.jrny.app | Host TBD (Vercel/Netlify/Cloudflare — decide at deploy time) |

### 6.2 Architecture Decisions

**Why TanStack Start** — Vite-native React framework with typed file routing and server functions; SSR for the landing/SEO surface while the game itself is a pure client-side experience; pairs cleanly with vite-plugin-pwa.

**Why Convex + Clerk** — native pairing (`ConvexProviderWithClerk`), JWT verified in every function via `ctx.auth.getUserIdentity()`; Convex free tier (~1M function calls/mo) covers well past MVP; Convex reactivity is admittedly overkill for one-phone play, but it makes Phase 3 two-device play trivial — deliberate future-proofing.

**Why local-first gameplay** — the privacy line (§2.1) plus resilience: bedroom wifi shouldn't matter. Convex is consulted only to fetch decks (cached immediately) and sync saved configs.

**Why prompts are server-side** — even free decks are fetched from Convex rather than bundled: (a) premium gating later requires it anyway (anyone can read the JS bundle), (b) decks iterate weekly without redeploys, (c) the offline cache in IndexedDB restores the offline property. One deliberate exception: a 9-prompt sweet-tier sample deck is bundled (`src/game/demo-deck.ts`) so demo mode and a first-ever-visit-offline stay playable — falling back down in intensity is the consent-safe direction.

**Why no state library** — the game session is a single reducer (`(state, event) → state`) persisted to IndexedDB on every event. Redux/Zustand would add ceremony without benefit at this size.

**Why one-time unlock over subscription (Phase 2)** — for this niche, a subscription reads as a meter running in the bedroom; one-time deck purchases match the "buy a card deck" mental model.

### 6.3 Data Flow

```
┌──────────── device (source of truth for play) ────────────┐
│  React UI ── events ──▶ game reducer ──▶ IndexedDB        │
│     ▲                                     │ session,      │
│     └── deck cache (IndexedDB) ◀──────────┘ age flag,     │
│              ▲                              drafts        │
└──────────────┼────────────────────────────────────────────┘
               │ decks.list / decks.getPrompts (read-only)
               │ games.save / games.list (auth’d, config-only)
        ┌──────┴───────┐         ┌──────────┐
        │    Convex    │◀── JWT ─│  Clerk   │
        └──────────────┘         └──────────┘
```

### 6.4 Convex Schema

```ts
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const tier = v.union(v.literal("sweet"), v.literal("flirty"), v.literal("spicy"));

export default defineSchema({
  decks: defineTable({
    slug: v.string(),               // "starter-sweet"
    title: v.string(),
    description: v.string(),
    tier,
    isPremium: v.boolean(),         // MVP: always false
    isActive: v.boolean(),          // unpublish without deleting
    promptCount: v.number(),        // denormalized for listings
  }).index("by_slug", ["slug"]).index("by_tier", ["tier"]),

  prompts: defineTable({
    deckId: v.id("decks"),
    zone: v.union(v.literal(1), v.literal(2), v.literal(3)),
    kind: v.union(v.literal("question"), v.literal("action"), v.literal("together")),
    text: v.string(),
    props: v.optional(v.boolean()),
  }).index("by_deck", ["deckId"]),

  games: defineTable({              // saved game CONFIGS — never live sessions
    userId: v.string(),             // Clerk user id (identity.subject)
    name: v.string(),
    tier,
    deckSlug: v.string(),
    boardPreset: v.string(),        // "classic" for MVP
    customPrompts: v.array(v.object({
      tile: v.number(),
      text: v.string(),
      kind: v.union(v.literal("question"), v.literal("action"), v.literal("together")),
    })),
  }).index("by_user", ["userId"]),

  purchases: defineTable({          // Phase 2 — schema reserved, unused in MVP
    userId: v.string(),
    deckSlug: v.string(),
    stripeSessionId: v.string(),
  }).index("by_user", ["userId"]).index("by_user_deck", ["userId", "deckSlug"]),
});
```

*Prompts are a separate table (not an array on `decks`) so premium gating, per-zone queries, and weekly authoring don't rewrite whole deck documents.*

### 6.5 Premium Gating Contract (Phase 2, designed now)

- `decks.list` — public; returns metadata only (never prompt text).
- `decks.getPrompts(deckSlug)` — returns prompts **iff** `!deck.isPremium` **or** a `purchases` row exists for `(identity.subject, deckSlug)`. Unauthenticated + premium ⇒ error.
- Stripe Checkout (one-time) → webhook → Convex `httpAction` verifies signature → inserts `purchases`. Deck names/descriptions in Stripe metadata stay non-explicit (§1.3).
- Premium prompt text therefore never exists in any client bundle or public query result.

### 6.6 Convex Function Surface (MVP)

| Function | Type | Auth | Purpose |
|----------|------|------|---------|
| `decks.list` | query | public | Deck metadata for pickers |
| `decks.getPrompts` | query | public (MVP) | Prompt pool for a free deck; gate lands here in Phase 2 |
| `games.save` | mutation | required | Upsert a saved game config |
| `games.list` | query | required* | Current user's saved games (*returns `[]` unauthenticated instead of throwing, so unauthenticated renders don't crash; mutations always throw) |
| `games.remove` | mutation | required | Delete own saved game |
| `seed.seedDecks` | internalMutation | dashboard/CLI | Idempotent starter-deck seeding |

Every auth'd function begins with `const identity = await ctx.auth.getUserIdentity(); if (!identity) throw ...` and scopes by `identity.subject`. No function accepts session/gameplay payloads — enforced by code review as a standing rule.

### 6.7 Local Data Model (IndexedDB, via `idb`)

| Store | Contents | Lifetime |
|-------|----------|----------|
| `session` | Current game reducer state (positions, turn, drawn-card ids, zone cursors) | Until finished/abandoned |
| `deckCache` | Prompt pools by deck slug + fetchedAt | Refresh on fetch; enables offline play |
| `prefs` | Age-gate confirmation, last tier, player display names | Until "Clear local data" |
| `drafts` | Unsaved custom game builder state | Until saved/discarded |
| `history` | Local-only recap summaries (opt-in) | Until cleared |

### 6.8 PWA Behavior

- Workbox service worker generated post-build (`scripts/build-pwa.ts`): precache static assets (never SSR HTML), runtime-cache visited pages NetworkFirst so a previously-opened app works offline, `/offline.html` as last-resort navigation fallback. Static `public/manifest.webmanifest`.
- **Offline definition**: previously-fetched decks are fully playable offline (board, dice, cards, recap, resume) on previously-visited pages. Online-only: first-ever visit, first deck fetch, sign-in, saved-game sync (queued locally, synced on reconnect — MVP: simple "retry on next online + app open").
- Manifest: `display: standalone`, portrait, theme/background colors from brand palette, maskable icons (192/512), apple-touch-icon for iOS.
- Custom in-app install prompt (`beforeinstallprompt` on Android/desktop; instructional sheet on iOS Safari).

### 6.9 Analytics (decide before beta)

Default position: **no analytics in MVP** beyond server-side counts Convex gives for free (function call counts). If product analytics become necessary, the bar is: EU-hostable, cookieless, event allow-list reviewed against §2.1 (no prompt ids, no session content, no player names). Candidates: PostHog (EU) or Plausible. Never Google Analytics.

### 6.10 Environments & Config

| Env | Convex | Clerk | URL |
|-----|--------|-------|-----|
| Local dev | `convex dev` deployment | Clerk dev instance | localhost |
| Production | Convex prod deployment | Clerk prod instance | spark.jrny.app |

Env vars (see `.env.example`): `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN` (Convex dashboard side).

---

## 7. Project Structure

```
jrny-spark/
├── PRD.md
├── README.md                     # setup: bun install, convex dev, clerk keys
├── package.json                  # bun scripts: dev / build / typecheck / seed
├── vite.config.ts                # tanstackStart() + tailwindcss()
├── tsconfig.json
├── .env.example
├── convex/
│   ├── schema.ts                 # §6.4
│   ├── auth.config.ts            # Clerk JWT issuer
│   ├── decks.ts                  # list, getPrompts
│   ├── games.ts                  # save, list, remove
│   ├── starterDecks.ts           # deck content (server-only, never imported from src/)
│   └── seed.ts                   # idempotent starter decks (sweet/flirty/spicy)
├── scripts/
│   ├── build-pwa.ts              # post-build Workbox SW (§6.8)
│   ├── make-icons.ts             # placeholder icon generator
│   └── simulate.ts               # board-tuning simulator (§4.1, §10.2)
├── public/
│   ├── manifest.webmanifest      # static PWA manifest
│   ├── offline.html              # last-resort offline fallback
│   ├── icons/                    # pwa-192, pwa-512, maskable, apple-touch
│   └── favicon.svg
└── src/
    ├── router.tsx
    ├── routes/
    │   ├── __root.tsx            # doc shell, providers (Clerk→Convex), nav
    │   ├── index.tsx             # landing
    │   ├── play/
    │   │   ├── setup.tsx
    │   │   ├── index.tsx         # the board
    │   │   └── recap.tsx
    │   ├── games/
    │   │   ├── index.tsx         # saved games (auth)
    │   │   └── new.tsx           # custom game builder
    │   ├── sign-in.tsx
    │   ├── settings.tsx
    │   └── privacy.tsx
    ├── components/
    │   ├── board/                # Board, Tile, PlayerToken, SnakeLadderLayer
    │   ├── play/                 # Dice, PromptCard, TurnBanner, SnakeCharmChoice
    │   ├── AgeGate.tsx
    │   ├── DeckPicker.tsx
    │   ├── InstallPrompt.tsx
    │   └── ui/                   # buttons, sheets, badges
    ├── game/
    │   ├── types.ts              # GameState, GameEvent, Prompt, BoardPreset
    │   ├── board-presets.ts      # classic 10×10 snakes/ladders layout
    │   ├── engine.ts             # pure reducer: (state, event) → state
    │   ├── draw.ts               # zone-aware draw-without-replacement
    │   └── rng.ts
    ├── lib/
    │   ├── storage.ts            # idb stores (§6.7)
    │   ├── deck-cache.ts
    │   └── install.ts            # beforeinstallprompt handling
    └── styles/
        └── app.css               # tailwind v4 entry + theme tokens
```

---

## 8. Milestones

| Week | Deliverable |
|------|-------------|
| **W1** | Scaffold (this repo): runnable Start+Clerk+Convex+PWA skeleton, schema, seeded decks, engine with tests-by-hand playable board |
| **W2** | Full MVP loop: setup→play→recap, custom builder, saved games, offline cache, install prompt, privacy page, prompt decks to ≥60/tier |
| **W3** | Polish (animations, haptics, empty states), beta with real couples, prompt iteration from feedback |
| **W4+** | Beta feedback loop → public launch on spark.jrny.app |

---

## 9. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Prompt quality is boring** | Fatal | §2.4 quality bar; weekly deck iteration (server-side decks = no redeploy); beta with real couples before launch |
| **Privacy slip destroys trust** | Fatal | §2.1 architecture (server literally never receives session data); standing code-review rule; plain-language privacy page |
| **Payment processor flags the product** (Phase 2) | High | §1.3 branding constraint; neutral Stripe metadata; review processor ToS before enabling payments |
| **iOS PWA friction** (install, storage eviction) | Medium | Custom install instructions; IndexedDB persistence request (`navigator.storage.persist()`); session is re-creatable worst-case |
| **Name recall** | Medium | "Spark" is a plain word + JRNY umbrella; tagline reinforces ("Play your way closer") |
| **Stack churn** (Start is young) | Low-Med | Pin versions; skeleton kept thin; game engine is framework-agnostic pure TS |

---

## 10. Open Questions

1. **Prompt authorship** — who writes/curates decks to the §2.4 bar? (AI-drafted + human-curated is the likely pipeline; needs an editorial pass per tier.)
2. **Board tuning** — validate the 15–30 min target with real play; adjust snake/ladder density and neutral-tile ratio.
3. **Recap sharing** — a shareable (image) recap is great growth but touches the privacy line; if built, it must contain only counts, and only via explicit user action.
4. **Group mode register** — how far the brand stretches toward "team onboarding" without diluting the couples positioning; possibly a separate JRNY subdomain later.
5. **Hosting** — pick between Vercel / Netlify / Cloudflare for Start SSR + the `spark.jrny.app` DNS at deploy time.

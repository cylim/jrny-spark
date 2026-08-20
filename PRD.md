# Spark — Couples Intimacy Game PWA — PRD v2

> Codename: `jrny-spark` · Live at `spark.jrny.app` · Part of the JRNY family (`jrny.app`)
>
> Vocabulary follows the glossary in [`CONTEXT.md`](./CONTEXT.md); the privacy boundary is [ADR 0001](./docs/adr/0001-play-data-never-leaves-the-device.md). Both are authoritative — where this document and they disagree, they win.

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
| **Languages** | English (required fallback), Korean, Traditional Chinese — UI localized from day one (§6.10) |
| **Age Rating** | 18+ gate for Spicy tier; Sweet/Flirty tiers are all-ages-appropriate romantic content |

### 1.2 App Purpose

Spark is an intimacy game platform for two people — couples at any stage (newly met, long-term, or taking the next step). It launches with one Game Type: **Journey Board**, a Snakes & Ladders–style board game where landing on tiles draws conversation/action prompt Cards. The board is the delivery mechanism; **the Prompt Cards are the product**.

The platform is designed to grow beyond one Game Type and beyond two players:

1. **Journey Board** (MVP) — Snakes & Ladders with escalating intimacy Prompts
2. **More Game Types** (later) — Truth or Dare, Date Dice, themed Decks
3. **Group play** (later) — bonding/icebreaker Decks for friends, families, team onboarding — pass-the-phone on a single device (ADR 0001)

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
| Friend groups / gatherings | Bonding and icebreaker play (3+ players, pass-the-phone on one device — ADR 0001) | Phase 3 |
| Teams / onboarding | Get-to-know-you play in a professional register (pass-the-phone on one device — ADR 0001) | Phase 3 (exploratory) |

### 1.5 Success Metrics

| Metric | MVP Target | Phase 2 Target |
|--------|-----------|----------------|
| Session completion rate (reach recap screen) | 60% | 70% |
| Median session length | 15–30 min | 15–30 min |
| Prompts drawn per session | ≥ 12 | ≥ 15 |
| Return play (2nd session within 14 days) | 30% | 40% |
| PWA install rate (of repeat visitors) | 20% | 30% |
| Account creation (of players who build a Game Template) | 50% | 60% |
| Premium deck attach rate | — (free MVP) | 5% of accounts |

*Measurement note: metrics are measured through the content-free analytics allow-list (§6.9, Appendix A) and must respect the Privacy Line (§2.1, ADR 0001). We can count that a Card was drawn; we never record which Prompt or anything entered/answered.*

---

## 2. Core Principles

### 2.1 The Privacy Line (non-negotiable)

This is sensitive data. Trust is the product's survival condition — any privacy slip kills it permanently. The authoritative statement of this boundary is **ADR 0001: play data never leaves the device**.

| Server KNOWS | Server NEVER knows |
|--------------|--------------------|
| Who you are (Clerk identity) | What happened during a Session |
| What you bought (Phase 2 purchases) | Which Prompts you drew, skipped, or passed |
| Game Templates you saved (Deck reference + board preset + Pinned Prompt text) | Any answer, note, photo, or partner name |
| Allow-listed behavioral analytics events (content-free — Appendix A) | Player names (local-only) |

Rules that follow from the line:

- **Local-first**: live Session state lives in memory + IndexedDB on the device. It is never sent to Convex.
- No server-side logging of Card draws or Session content. Convex functions never accept Session-state payloads.
- Anonymous play is always allowed. An account is only needed to **save Game Templates** (and later, premium unlock).
- Analytics events carry behavioral metadata only — never prompt ids, prompt text, or player names — and can be switched off in Settings (§6.9).
- A plain-language privacy statement ships in the app (`/privacy`) stating exactly the table above, naming the analytics provider, and listing what is and isn't collected.
- "Clear all local data" is one tap in Settings.

### 2.2 Content Tiers

| Tier | Name | Register | Examples of register (not final copy) |
|------|------|----------|----------------------------------------|
| 1 | **Sweet** | Warm, curious, PG | "What's a small thing I do that you secretly love?" |
| 2 | **Flirty** | Playful, teasing, romantic | "Give your partner a 10-second compliment — eye contact required." |
| 3 | **Spicy** | Intimate, suggestive, 18+ | Suggestive dares/questions; never explicit in wording |

- **Tier is an attribute of the Deck, derived server-side** — a Game Template's Tier is always its Deck's true Tier and can never be misdeclared by a client (§6.6).
- Session setup picks a Deck; the age gate (18+ self-confirmation, remembered locally) checks the Deck's Tier at **every Session start** — fresh setup, saved Template, or draft — and again on any mid-Session Advance into Spicy (§4.7).
- Tiers widen the market: the same product serves date-night-sweet through spicy.

### 2.3 Session Design

- Target session length: **15–30 minutes** with a clear ending (recap screen).
- **Escalation**: Prompt intensity rises as players climb the board, matching the ladder mechanic. Within a Deck, Prompts are banded into three Zones (§4.4). Escalation beyond the setup Tier happens only through the explicit both-players **Advance** choice (§4.7) — never automatically.
- One phone, passed between partners — no pairing, no latency, no accounts required to start playing within 30 seconds of first visit.

### 2.4 Prompt Quality Bar

Boring prompts kill the product — this is the #1 product risk. Deck authoring rules:

- 100+ Prompts per tier at maturity; MVP ships with ≥ 60 per tier and grows weekly.
- Every Prompt is **actionable in under 2 minutes**, requires no props (prop Prompts are tagged and optional), and works regardless of gender pairing.
- Every Card **speaks in the Active Player's voice** — the player holding the phone reads it as their own line, not as a narrator's instruction.
- Mix: ~60% questions, ~30% micro-actions/dares, ~10% "together" mini-activities.
- Every Prompt readable aloud comfortably — the reader test: "would this feel awkward to read to your partner, in a bad way?"
- **Skip** is a budgeted redraw: discard the Card, draw a replacement from the same Zone. The per-player budget is set on the Game Template (default 3, configurable 0–unlimited — §4.6).
- **Pass** — putting a Card away with nothing in its place — is always available, uncounted, and unpenalized, even at zero Skips remaining: no Card ever has to be performed. Neither Skips nor Passes are tracked server-side.

---

## 3. Scope & Phases

### 3.1 Phase 1 — MVP (free, target: 2–3 weeks to beta)

| Feature | In MVP | Notes |
|---------|--------|-------|
| Journey Board Game Type (Snakes & Ladders) | ✅ | One board preset, classic 10×10 |
| Pass-the-phone play, 2 players | ✅ | Local player names, local turn state |
| 3 content tiers with starter Decks | ✅ | Decks fetched from Convex, cached in IndexedDB for offline |
| Age gate (18+) for Spicy | ✅ | Local flag; checks the Deck's Tier at every Session start |
| Skip & Pass | ✅ | Budgeted redraw + always-free Pass (§4.6) |
| Zone-exhaustion choice: Stay / Advance | ✅ | Both-players consent to escalate (§4.7) |
| Anonymous play | ✅ | Zero-friction first session |
| Clerk auth (Google + Apple OAuth) | ✅ | No email/password. Only needed to save Game Templates |
| Template builder | ✅ | Name, Deck, Pinned Prompts, skip budget; playable without saving |
| Game Templates (cloud) | ✅ | Config-only sync to Convex; local IndexedDB copy for offline |
| Session auto-resume | ✅ | Local only — reload/app-switch safe, including remaining Skips and any pending exhaustion choice |
| PWA: installable + offline | ✅ | Full offline play with cached Decks |
| Recap screen | ✅ | Local stats only; Winner nod; skips-used when budgeted (§4.8) |
| UI i18n: EN / KO / zh-Hant | ✅ | Scaffolding + localized UI; translated Deck content is separate authoring work (§6.10) |
| Analytics (content-free) | ✅ | PostHog US, cookieless, allow-list only, Settings opt-out (§6.9) |
| Privacy statement + clear-data | ✅ | |
| Payments / premium | ❌ | Schema stubs only (§6.5); no Stripe in MVP |
| Realtime / two-device play | ❌ | **Cut per ADR 0001 — not deferred.** Play state never leaves the device |

### 3.2 Phase 2 — Premium & More Games

- **Premium decks**: one-time unlock per Deck (one-time beats subscription for this niche). Stripe Checkout → webhook → Convex `httpAction` → `purchases` insert. Deck Prompts are **server-gated** (§6.5) — never shipped in the client bundle. **Buying a Deck includes all its languages** — locales are not separate purchases.
- Themed Decks: e.g. "First Date", "Long Distance Reunion", "Anniversary", seasonal.
- **Spark Premium pin authoring**: authoring Pinned Prompts becomes a premium feature later; it ships ungated in MVP. **Playing a Template that contains pins is always free** — a shared or saved Template never locks its player out.
- Card-reference pins (pinning existing Deck Cards, gate-resolved text) and Template sharing.
- New Game Types on the same Deck system: **Truth or Dare**, **Date Dice** (roll-to-prompt without a board).
- Translated Deck *content* — per-language authoring passes on the i18n scaffolding (§6.10).

### 3.3 Phase 3 — Groups

- **Group mode** (3+ players): icebreaker/bonding Decks, turn rotation, group-safe register — pass-the-phone on a single device, like couples play.
- Public Deck marketplace / community Decks — exploratory, heavy moderation implications.

*Two-device play and room codes, formerly slated here, are **cut per ADR 0001**: any play state on a server breaks the promise the product depends on. Do not revisit by adding a sessions table.*

### 3.4 Non-Goals (explicit)

- No native iOS/Android apps (PWA only; revisit only if install friction proves fatal).
- No play-state sync of any kind — no rooms, no room codes, no sessions table (ADR 0001).
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
| **Prompt tile** (~65% of tiles) | none | Draw a Card from the active Deck for the current Zone |
| **Ladder foot** | Climb to ladder top | Draw a **"closer" Card** (reward-flavored, from the same Zone as the ladder top — a taste of what's ahead) |
| **Snake head** | Slide to snake tail | Player choice: accept the slide, or **"charm the snake"** — take a dare-flavored Card one Zone up to stay put |
| **Neutral** (20%) | none | Breather — no Card, *unless a Pinned Prompt converts it into a prompt tile (§4.5)*. Density is the main session-length tuning knob — see `scripts/simulate.ts` |
| **Finish (100)** | Game ends | Recap screen |

The "charm the snake" choice is the signature mechanic: it converts the game's only negative beat into an opt-in intimacy beat, and it lets the trailing player stay competitive. Skipping or Passing a charm Card keeps the stay-put — hitting a comfort boundary is never punished with a setback (§4.6).

### 4.3 Dice & Turns

- Single d6, tap-to-roll with animation + haptics (Vibration API where available).
- Exact roll **not** required to finish (MVP simplification — overshoot lands on 100).
- Turn banner shows whose turn it is by (local) player name; phone is passed on Card resolution.

### 4.4 Escalation Zones

A **Zone is a Deck escalation band**: every Deck's Prompts carry a Zone tag, and each Game Type maps its own progression onto the bands. Journey Board maps board position:

| Zone | Journey Board tiles | Register within the tier |
|------|---------------------|--------------------------|
| Warm-up | 1–33 | Light, easy openers |
| Deeper | 34–66 | More personal, more daring |
| Close | 67–100 | The tier's full intensity |

A future Game Type (Truth or Dare rounds, Date Dice streaks) maps its own progression onto the same three bands — Decks stay Game-Type-agnostic.

A **Sweet zone-3** Card is still sweet; a **Spicy zone-1** Card is still an easy on-ramp. Escalation within a Session stays inside the Deck chosen at setup; the Session moves beyond that Tier only through the explicit both-players **Advance** choice (§4.7) — never automatically.

### 4.5 Decks, Cards & Pinned Prompts

- A **Deck** = a Tier plus a pool of Prompts, each Prompt tagged with Zone (1–3), Kind (`question` | `action` | `together`), and optional `props: true`. Prompt text is a per-locale map (§6.10) — one canonical Card, per-language text.
- Draw = uniform random from the active Deck's matching Zone, without replacement per Session. When a Zone's pool runs dry, the game **never silently recycles** — the couple gets the Stay / Advance choice (§4.7).
- MVP ships 3 starter Decks (one per tier), ≥ 60 Prompts each, authored to the §2.4 bar.
- **Pinned Prompts**: a Game Template may pin Prompts to specific tiles. Pins are checked **before** neutral-tile classification, so a pin converts a Neutral Tile into a prompt tile — a pin is never silently dropped. Pins fire on plain tile landings only; the builder blocks pins on snake heads, ladder feet, and the finish tile (allowed on all other tiles 1–99), so pins never conflict with tile effects.
- Pin authoring is ungated in MVP and becomes a Spark Premium feature later; **playing a pinned Template is always free** (§3.2).

### 4.6 Skip & Pass

The consent model at the Card level:

- **Skip** — a budgeted redraw. The Card is discarded and a replacement is drawn from the same Zone with the same reason and preferred Kind: a skipped charm Card redraws another dare-flavored Card from the raised Zone, and the stay-put is unaffected. Each Skip decrements the acting player's budget.
- The **skip budget is per player, set on the Game Template** — default 3, configurable from 0 to unlimited — editable in the Template builder and at Session setup. At zero remaining, the Skip affordance is unavailable.
- **Pass** — the Card is put away with nothing in its place. Always available regardless of budget, never counted, never penalized, and deliberately indistinguishable from completing the Card. This is the consent guarantee: no Card ever has to be performed, and the finite budget means neither player can fish through the Deck for only easy Cards — but comfort is never rationed.
- Remaining Skips are part of Session state: reload/app-switch resume preserves them exactly (§6.7).

### 4.7 Zone Exhaustion: Stay / Advance

When the active Zone's pool runs dry mid-Session, a choice sheet appears — the game never stalls and never repeats a Card back-to-back:

- **Stay** — a true reshuffle of that Zone: its used-card list resets for a fresh no-repeat cycle.
- **Advance** — the Session's active Deck is swapped for the **next Tier's Deck** (sweet→flirty→spicy) at the same board position. Advance requires **one confirmation tap from each player** — consent is expanded by the couple, not by whoever holds the phone. Advancing into Spicy triggers the 18+ age gate if not already confirmed; declining the gate cancels the Advance. Advance is not offered when the Session is already at Spicy.
- **Offline**: only choices whose Deck is already cached appear; with nothing else cached the game silently reshuffles — bedroom wifi never dead-ends a Session.
- **Escalation is never automatic**, under any circumstance. (A Purchase option in this sheet is Phase 2.)
- A pending exhaustion choice is part of Session state and survives reload/app-switch (§6.7).

### 4.8 Recap

End screen shows: tiles travelled, snakes charmed, ladders climbed, Cards drawn, session duration — all computed locally, displayed once, stored only in local history (optional), never uploaded (ADR 0001). Plus:

- A playful **"first to the finish" nod** naming the Winner — celebration without win/lose pressure; no other win/lose framing exists anywhere.
- A **skips-used line, rendered only when a skip budget was configured** — an unlimited-skip game never guilt-trips.

CTA: "Save this as a Template" (→ auth) and "Play again".

---

## 5. UX — Screens & Routes

Mobile-first. All routes are TanStack Start file routes.

| Route | Screen | Auth | Notes |
|-------|--------|------|-------|
| `/` | Landing | — | Value prop, "Play now", install hint, tier explainer |
| `/play/setup` | Session setup | — | Player names (local), Deck select (age gate checks the Deck's Tier), Template select, skip budget |
| `/play` | Game board | — | The Journey Board Session; auto-resume from IndexedDB |
| `/play/recap` | Recap | — | Local stats; save-Template CTA |
| `/templates` | My Templates | ✅ | List/duplicate/delete Game Templates; syncs Convex ↔ IndexedDB |
| `/templates/new` | Template builder | save = ✅ | Deck, Pinned Prompts (pin-placement validation), skip budget; playing a draft needs no account |
| `/sign-in` | Clerk sign-in | — | Google + Apple only |
| `/settings` | Settings | — | Language picker, analytics opt-out, age-gate reset, clear local data, install app, account section |
| `/privacy` | Privacy statement | — | The §2.1 table in plain language + the Appendix A collected/not-collected lists |

**Key components**: `Board`, `Tile`, `PlayerToken`, `Dice`, `PromptCard` (full-screen card modal with flip animation; Skip/Pass affordances), `TierBadge`, `AgeGate`, `DeckPicker`, `TurnBanner`, `InstallPrompt`, `SnakeCharmChoice`, `ExhaustionChoiceSheet`, `LanguagePicker`.

**First-session flow (30-second rule)**: Landing → Play now → names + Deck (2 taps + optional typing) → rolling within 30 seconds. No account wall anywhere on this path.

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
| **Backend / DB** | Convex | Decks, Game Templates, (later) purchases; reactive queries |
| **Convex↔Clerk** | `ConvexProviderWithClerk` (`convex/react-clerk`) | Clerk JWT verified server-side in every function |
| **Local storage** | IndexedDB (`idb`) | Session state, Deck cache, prefs, drafts |
| **i18n** | Lightweight message layer (`src/lib/i18n/`) | EN (fallback) + KO + zh-Hant; locale persisted in prefs (§6.10) |
| **Analytics** | PostHog (`posthog-js`, US cloud) | Cookieless, allow-list only, opt-out (§6.9) |
| **PWA** | Workbox (`workbox-build`, post-build script) | Installability, offline app shell — `vite-plugin-pwa` is skipped alongside `tanstackStart()` (TanStack/router#4988), so the SW is generated by `scripts/build-pwa.ts` and the manifest is static |
| **State** | React state + custom hooks | No state library — game engine is a reducer; Convex covers server state |
| **Testing** | Vitest + `convex-test` | Engine tests with injected RNG; server tests on the public function surface |
| **Deploy** | Cloudflare Workers | spark.jrny.app — Start SSR on Workers, static assets + SW from the CDN |

### 6.2 Architecture Decisions

**Why TanStack Start** — Vite-native React framework with typed file routing and server functions; SSR for the landing/SEO surface while the game itself is a pure client-side experience.

**Why Convex + Clerk** — native pairing (`ConvexProviderWithClerk`), JWT verified in every function via `ctx.auth.getUserIdentity()`; Convex free tier (~1M function calls/mo) covers well past MVP; reactive queries keep Deck listings and My Templates live without cache invalidation ceremony.

**Why local-first gameplay** — the Privacy Line (§2.1, ADR 0001) plus resilience: bedroom wifi shouldn't matter. Convex is consulted only to fetch Decks (cached immediately) and sync Game Templates.

**Why prompts are server-side** — even free Decks are fetched from Convex rather than bundled: (a) premium gating later requires it anyway (anyone can read the JS bundle), (b) Decks iterate weekly without redeploys, (c) the offline cache in IndexedDB restores the offline property. One deliberate exception: a small Sweet-tier **Sample Deck** is bundled (`src/game/sample-deck.ts`, localized at build time) as a fallback so a first-ever-visit-offline stays playable — falling back down in intensity is the consent-safe direction.

**Why no state library** — the game Session is a single reducer (`(state, event) → state`) persisted to IndexedDB on every event. Redux/Zustand would add ceremony without benefit at this size.

**Why one-time unlock over subscription (Phase 2)** — for this niche, a subscription reads as a meter running in the bedroom; one-time Deck purchases match the "buy a card deck" mental model.

**Why Cloudflare Workers** — resolved (was TBD): the SSR surface is thin (landing + shell; the game is client-side), which suits the Workers runtime, and the static-first PWA serves from the CDN. The runtime-compatibility risk of Start-on-Workers is tracked in §9.

### 6.3 Data Flow

```
┌──────────── device (source of truth for play) ────────────┐
│  React UI ── events ──▶ game reducer ──▶ IndexedDB        │
│     ▲                                     │ session,      │
│     └── deck cache (IndexedDB) ◀──────────┘ prefs,        │
│              ▲                              drafts        │
└──────────────┼────────────────────────────────────────────┘
               │ decks.list / decks.getPrompts (read-only, locale-projected)
               │ gameTemplates.save / gameTemplates.list (auth’d, config-only)
        ┌──────┴───────┐         ┌──────────┐
        │    Convex    │◀── JWT ─│  Clerk   │
        └──────────────┘         └──────────┘
```

Allow-listed analytics events (Appendix A) flow separately to PostHog — behavioral metadata only, gated by the Settings opt-out.

### 6.4 Convex Schema

```ts
// convex/schema.ts (sketch — the checked-in file is authoritative)
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const tier = v.union(v.literal("sweet"), v.literal("flirty"), v.literal("spicy"));
const kind = v.union(v.literal("question"), v.literal("action"), v.literal("together"));

// Display text is a per-locale map — English required, others optional (§6.10)
const localizedText = v.object({
  en: v.string(),
  ko: v.optional(v.string()),
  "zh-Hant": v.optional(v.string()),
});

export default defineSchema({
  decks: defineTable({
    slug: v.string(),               // "starter-sweet"
    title: localizedText,
    description: localizedText,
    tier,                           // the Deck's Tier — the only place Tier is declared
    isPremium: v.boolean(),         // MVP: always false
    isActive: v.boolean(),          // unpublish without deleting
    promptCount: v.number(),        // denormalized for listings
  }).index("by_slug", ["slug"]).index("by_tier", ["tier"]),

  prompts: defineTable({
    deckId: v.id("decks"),
    zone: v.union(v.literal(1), v.literal(2), v.literal(3)),
    kind,
    text: localizedText,            // one canonical Card, per-language text
    props: v.optional(v.boolean()),
  }).index("by_deck", ["deckId"]),

  gameTemplates: defineTable({      // saved CONFIGS only — never live Sessions (ADR 0001)
    userId: v.string(),             // Clerk user id (identity.subject)
    name: v.string(),               // ≤ 80 chars (enforced in the save mutation)
    deckSlug: v.string(),           // must reference a known, active Deck
    tier,                           // server-derived from the Deck — never client-supplied
    gameType: v.string(),           // "journey-board" for MVP
    boardPreset: v.string(),        // "classic" for MVP
    skipsPerPlayer: v.union(v.number(), v.null()), // null = unlimited; default 3 (§4.6)
    pinnedPrompts: v.array(v.object({
      tile: v.number(),             // 1–99, excluding snake heads / ladder feet / finish
      text: v.string(),             // ≤ 280 chars; ≤ 100 pins per Template
      kind,
    })),
  }).index("by_user", ["userId"]),

  purchases: defineTable({          // Phase 2 — schema reserved, unused in MVP
    userId: v.string(),
    kind: v.union(v.literal("deck"), v.literal("feature")), // future-proofing only
    deckSlug: v.string(),           // deck slug, or feature slug for kind: "feature"
    stripeSessionId: v.string(),
  }).index("by_user", ["userId"]).index("by_user_deck", ["userId", "deckSlug"]),
});
```

*Prompts are a separate table (not an array on `decks`) so premium gating, per-zone queries, and weekly authoring don't rewrite whole deck documents. The `gameTemplates.tier` field exists for listings but is written only by the server, derived from the referenced Deck — the save mutation takes no tier argument.*

### 6.5 Premium Gating Contract (Phase 2, designed now)

- `decks.list` — public; returns metadata only (never Prompt text).
- `decks.getPrompts(deckSlug, locale)` — returns Prompts **iff** `!deck.isPremium` **or** a `purchases` row exists for `(identity.subject, deckSlug)`. Unauthenticated + premium ⇒ error. A purchased Deck includes **all** its languages — the locale argument selects presentation, never entitlement.
- Stripe Checkout (one-time) → webhook → Convex `httpAction` verifies signature → inserts `purchases`. Deck names/descriptions in Stripe metadata stay non-explicit (§1.3).
- Premium Prompt text therefore never exists in any client bundle or public query result.
- Pin *authoring* may later gate on a `purchases` row with `kind: "feature"`; playing pinned Templates is never gated (§3.2).

### 6.6 Convex Function Surface (MVP)

| Function | Type | Auth | Purpose |
|----------|------|------|---------|
| `decks.list` | query | public | Deck metadata for pickers (locale-projected titles, EN fallback) |
| `decks.getPrompts` | query | public (MVP) | Prompt pool for a free Deck, projected to one locale with EN fallback; gate lands here in Phase 2 |
| `gameTemplates.save` | mutation | required | Upsert a Game Template. Derives Tier from the referenced Deck server-side (unknown/inactive Deck ⇒ error); enforces caps: name ≤ 80 chars, pin text ≤ 280 chars, ≤ 100 pins/Template, ≤ 50 Templates/user |
| `gameTemplates.list` | query | required* | Current user's Templates (*returns `[]` unauthenticated instead of throwing, so unauthenticated renders don't crash; mutations always throw) |
| `gameTemplates.remove` | mutation | required | Delete own Template |
| `seed.seedDecks` | internalMutation | dashboard/CLI | Idempotent starter-Deck seeding |

Every auth'd function begins with `const identity = await ctx.auth.getUserIdentity(); if (!identity) throw ...` and scopes by `identity.subject`. No function accepts Session/gameplay payloads — ADR 0001, enforced by code review as a standing rule. The function surface is covered by `convex-test` suites (ownership, caps, Tier derivation, the premium gate).

### 6.7 Local Data Model (IndexedDB, via `idb`)

| Store | Contents | Lifetime |
|-------|----------|----------|
| `session` | Current game reducer state: positions, turn, drawn-card ids, Zone used-card cycles, **per-player remaining Skips**, **any pending exhaustion choice** | Until finished/abandoned |
| `deckCache` | Prompt pools by Deck slug + fetchedAt | Refresh on fetch; enables offline play and offline Advance (§4.7) |
| `prefs` | Age-gate confirmation, locale, analytics opt-out, last Deck, player display names | Until "Clear local data" |
| `drafts` | Unsaved Template builder state | Until saved/discarded |
| `history` | Local-only recap summaries (opt-in) | Until cleared |

### 6.8 PWA Behavior

- Workbox service worker generated post-build (`scripts/build-pwa.ts`): precache static assets (never SSR HTML), runtime-cache visited pages NetworkFirst so a previously-opened app works offline, `/offline.html` as last-resort navigation fallback. Static `public/manifest.webmanifest`.
- **Offline definition**: previously-fetched Decks are fully playable offline (board, dice, Cards, recap, resume) on previously-visited pages; the bundled Sample Deck covers the first-ever-visit-offline edge (§6.2). Zone-exhaustion choices offer only cached Decks offline (§4.7). Online-only: first Deck fetch, sign-in, Template sync (queued locally, synced on reconnect — MVP: simple "retry on next online + app open").
- Manifest: `display: standalone`, portrait, theme/background colors from brand palette, maskable icons (192/512), apple-touch-icon for iOS.
- Custom in-app install prompt (`beforeinstallprompt` on Android/desktop; instructional sheet on iOS Safari).

### 6.9 Analytics (settled)

**PostHog, US region, cookieless.** Autocapture **off**, session replay **off**. Only explicitly named events from the reviewed allow-list in **Appendix A** ever fire, defined in one place (`src/lib/analytics.ts`) — no ad-hoc capture calls.

- No event ever carries prompt ids, prompt text, or player names; card-level events carry Zone/Kind/reason metadata only; durations and counts are bucketed.
- An **opt-out toggle in Settings** is honored before any capture and persists locally.
- `/privacy` names the provider and lists exactly what is and isn't collected.
- Adding any event later requires re-review against the Privacy Line (ADR 0001) and a change to the single allow-list definition.
- Never Google Analytics.

### 6.10 Internationalization

- **Locales**: English (required fallback), Korean (`ko`), Traditional Chinese (`zh-Hant`).
- All UI strings flow through the i18n layer (`src/lib/i18n/`) from day one; a missing translation renders English, never a blank. The language picker in Settings persists the choice in local prefs.
- **Prompt and Deck display text are per-locale maps** with English required (§6.4) — one canonical Card, per-language text. `decks.getPrompts` takes a locale and projects a single language with English fallback, so the client-side Prompt shape (and the game engine) keeps working with plain strings.
- The bundled Sample Deck is localized at build time; seeded starter Decks use the localized shape.
- Buying a Deck (Phase 2) includes all its languages (§6.5).
- Translated Deck *content* is authoring work outside the scaffolding — the scaffolding makes it deployable.

### 6.11 Environments & Config

| Env | Convex | Clerk | URL |
|-----|--------|-------|-----|
| Local dev | `convex dev` deployment | Clerk dev instance | localhost |
| Production | Convex prod deployment | Clerk prod instance | spark.jrny.app (Cloudflare Workers) |

Env vars (see `.env.example`): `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN` (Convex dashboard side), `VITE_POSTHOG_KEY`.

---

## 7. Project Structure

```
jrny-spark/
├── PRD.md
├── CONTEXT.md                    # glossary — vocabulary source of truth
├── docs/
│   └── adr/
│       └── 0001-play-data-never-leaves-the-device.md
├── README.md                     # setup: bun install, convex dev, clerk keys
├── package.json                  # bun scripts: dev / build / typecheck / test / seed
├── vite.config.ts                # tanstackStart() + tailwindcss()
├── tsconfig.json
├── .env.example
├── convex/
│   ├── schema.ts                 # §6.4
│   ├── auth.config.ts            # Clerk JWT issuer
│   ├── decks.ts                  # list, getPrompts (locale-projected)
│   ├── gameTemplates.ts          # save, list, remove — server-derived Tier + caps
│   ├── gameTemplates.test.ts     # convex-test: ownership, caps, Tier derivation, gate
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
    │   ├── templates/
    │   │   ├── index.tsx         # My Templates (auth)
    │   │   └── new.tsx           # Template builder (pin-placement validation)
    │   ├── sign-in.tsx
    │   ├── settings.tsx          # language picker, analytics opt-out, age-gate reset…
    │   └── privacy.tsx           # §2.1 in plain language + Appendix A lists
    ├── components/
    │   ├── board/                # Board, Tile, PlayerToken, SnakeLadderLayer
    │   ├── play/                 # Dice, PromptCard (Skip/Pass affordances), TurnBanner,
    │   │                         #   SnakeCharmChoice, ExhaustionChoiceSheet
    │   ├── AgeGate.tsx
    │   ├── DeckPicker.tsx
    │   ├── InstallPrompt.tsx
    │   ├── LanguagePicker.tsx
    │   └── ui/                   # buttons, sheets, badges
    ├── game/
    │   ├── types.ts              # GameState, GameEvent, Prompt, BoardPreset
    │   ├── board-presets.ts      # classic 10×10 snakes/ladders layout
    │   ├── engine.ts             # pure reducer: (state, event) → state
    │   ├── engine.test.ts        # Vitest + injected RNG: skips, pins, reshuffle, advance
    │   ├── draw.ts               # zone-aware draw; surfaces the zone-dry signal
    │   ├── sample-deck.ts        # bundled offline fallback, localized at build time
    │   └── rng.ts
    ├── lib/
    │   ├── storage.ts            # idb stores (§6.7)
    │   ├── i18n/                 # message layer: en (fallback), ko, zh-Hant (§6.10)
    │   ├── analytics.ts          # the single event allow-list (Appendix A) + opt-out
    │   ├── use-decks.ts          # deck fetch + IndexedDB cache
    │   ├── use-game-session.ts   # session persistence/resume
    │   └── install.ts            # beforeinstallprompt handling
    └── styles/
        └── app.css               # tailwind v4 entry + theme tokens
```

---

## 8. Milestones

| Week | Deliverable |
|------|-------------|
| **W1** | Scaffold (this repo): runnable Start+Clerk+Convex+PWA skeleton, schema, seeded Decks, playable board |
| **W2** | Full MVP loop: setup→play→recap, Template builder + My Templates, offline cache, install prompt, privacy page. Domain-model alignment: Skip/Pass, Stay/Advance, pins that always fire, server-derived Tier — with the engine (Vitest) and server (`convex-test`) test harnesses |
| **W3** | **i18n scaffolding** (EN / KO / zh-Hant, localized UI + per-locale Prompt maps), **analytics integration** (allow-list, opt-out, `/privacy` disclosure); Prompt Decks to ≥ 60/tier |
| **W4** | Polish (animations, haptics, empty states), beta with real couples, prompt iteration from feedback |
| **W5+** | Beta feedback loop → public launch on spark.jrny.app |

---

## 9. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Prompt quality is boring** | Fatal | §2.4 quality bar; weekly Deck iteration (server-side Decks = no redeploy); beta with real couples before launch |
| **Privacy slip destroys trust** | Fatal | ADR 0001 architecture (server literally never receives Session data); standing code-review rule; plain-language privacy page |
| **Analytics reads as a broken privacy promise** | High | Content-free allow-list (Appendix A) reviewed against ADR 0001; cookieless, no autocapture, no replay; Settings opt-out honored before any capture; provider + collected/not-collected lists on `/privacy` |
| **Payment processor flags the product** (Phase 2) | High | §1.3 branding constraint; neutral Stripe metadata; review processor ToS before enabling payments |
| **Workers runtime compatibility** (TanStack Start SSR on Cloudflare Workers) | Medium | Keep the SSR surface thin (landing + shell — the game is client-side); `nodejs_compat` where needed; verify SSR + SW behavior on a Workers preview before W3 |
| **iOS PWA friction** (install, storage eviction) | Medium | Custom install instructions; IndexedDB persistence request (`navigator.storage.persist()`); Session is re-creatable worst-case |
| **Name recall** | Medium | "Spark" is a plain word + JRNY umbrella; tagline reinforces ("Play your way closer") |
| **Stack churn** (Start is young) | Low-Med | Pin versions; skeleton kept thin; game engine is framework-agnostic pure TS |

---

## 10. Open Questions

1. **Prompt authorship** — who writes/curates Decks to the §2.4 bar? (AI-drafted + human-curated is the likely pipeline; needs an editorial pass per tier — now × 3 locales, §6.10.)
2. **Board tuning** — validate the 15–30 min target with real play; adjust snake/ladder density and neutral-tile ratio (the simulator currently flags p90 ≈ 39 min — a separate tuning task).
3. **Recap sharing** — a shareable (image) recap is great growth but touches the Privacy Line; if built, it must contain only counts, and only via explicit user action.
4. **Group mode register** — how far the brand stretches toward "team onboarding" without diluting the couples positioning; possibly a separate JRNY subdomain later.
5. ~~**Hosting**~~ — **resolved: Cloudflare Workers** (§6.1, §6.2); runtime-compatibility risk tracked in §9.

---

## Appendix A — Analytics Event Allow-List

The complete reviewed list. Every event is behavioral metadata only; **no event ever carries prompt ids, prompt text, or player names**. Common properties on all events: device class, locale. Defined in one place (`src/lib/analytics.ts`); adding an event requires re-review against the Privacy Line (ADR 0001).

| Event | Properties | Notes |
|-------|------------|-------|
| `page_view` | route | Cookieless; no autocapture |
| `session_started` | tier, game type | |
| `session_completed` | duration bucket, cards-drawn bucket | Bucketed, never raw |
| `card_shown` | zone, kind, reason | Metadata only — which Card is never recorded |
| `skip` | — | The act, never the Card |
| `pass` | — | The act, never the Card |
| `charm_choice` | choice (charm / slide) | |
| `exhaustion_choice` | choice (stay / advance) | |
| `install_prompt` | outcome | |
| `template_saved` | — | Never the Template's content |
| `settings_toggle` | which toggle, new state | |
| `error` | error kind | Never message payloads containing user text |

Explicitly never collected: prompt ids, prompt text, player names, answers or any free text, session replay, autocaptured interactions, cookies.

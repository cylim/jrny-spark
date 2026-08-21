import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const tierValidator = v.union(
  v.literal("sweet"),
  v.literal("flirty"),
  v.literal("spicy")
);

const purchaseBase = v.object({
  userId: v.string(), // stable auth identity (identity.tokenIdentifier)
  stripeSessionId: v.string(),
});
export const kindValidator = v.union(
  v.literal("question"),
  v.literal("action"),
  v.literal("together")
);
export const zoneValidator = v.union(v.literal(1), v.literal(2), v.literal(3));

// MUST stay in sync with `Locale` in src/lib/i18n/messages.ts (and one
// catalog file per locale there) — the client can't import convex/ code.
export const localeValidator = v.union(
  v.literal("en"),
  v.literal("ko"),
  v.literal("zh-Hant")
);

// Display text is a per-locale map — English required, others optional
// (PRD §6.10). One canonical Card, per-language text.
export const localizedTextValidator = v.object({
  en: v.string(),
  ko: v.optional(v.string()),
  "zh-Hant": v.optional(v.string()),
});

// Rolling migration: rows written before i18n are plain strings (≙ English).
// Reads normalize via decks.ts `localize()`; re-seeding rewrites starter
// content in the localized shape. Keeping the union means a deploy never
// fails schema validation against old rows.
export const displayTextValidator = v.union(v.string(), localizedTextValidator);

// PRIVACY LINE (PRD §2.1): these tables hold identity, purchases and Game
// Templates (saved configurations) only. No table ever stores live sessions,
// drawn cards, answers, or player names — and no function accepts such
// payloads.
export default defineSchema({
  decks: defineTable({
    slug: v.string(), // "starter-sweet"
    title: displayTextValidator,
    description: displayTextValidator,
    tier: tierValidator,
    isPremium: v.boolean(), // MVP: always false
    isActive: v.boolean(), // unpublish without deleting
    promptCount: v.number(), // denormalized for listings
  })
    .index("by_slug", ["slug"])
    .index("by_tier", ["tier"]),

  prompts: defineTable({
    deckId: v.id("decks"),
    zone: zoneValidator,
    kind: kindValidator,
    text: displayTextValidator,
    props: v.optional(v.boolean()),
  }).index("by_deckId", ["deckId"]),

  gameTemplates: defineTable({
    userId: v.string(), // stable auth identity (identity.tokenIdentifier)
    name: v.string(),
    tier: tierValidator, // derived server-side from the Deck — never client-declared
    deckSlug: v.string(),
    boardPreset: v.string(), // "classic" for MVP
    // Per-player skip budget (§4.6): null = unlimited; absent on rows saved
    // before the field existed — clients treat absent as the default (3).
    skipsPerPlayer: v.optional(v.union(v.number(), v.null())),
    // Bounded by save(): ≤ 100 pins × ≤ 280 chars (~30 KB worst case).
    // Re-evaluate this inline array before ever lifting the mutation caps.
    customPrompts: v.array(
      v.object({
        tile: v.number(),
        text: v.string(),
        kind: kindValidator,
      })
    ),
  }).index("by_userId", ["userId"]),

  // Phase 2 — schema reserved, unused in MVP (PRD §6.5). `kind` discriminates
  // deck unlocks from future feature purchases; only deck rows reference a deck.
  purchases: defineTable(
    v.union(
      purchaseBase.extend({ kind: v.literal("deck"), deckSlug: v.string() }),
      purchaseBase.extend({ kind: v.literal("feature") })
    )
  )
    .index("by_userId", ["userId"])
    .index("by_userId_and_deckSlug", ["userId", "deckSlug"]),
});

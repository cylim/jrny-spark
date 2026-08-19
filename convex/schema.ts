import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const tierValidator = v.union(v.literal("sweet"), v.literal("flirty"), v.literal("spicy"));
export const kindValidator = v.union(
  v.literal("question"),
  v.literal("action"),
  v.literal("together"),
);
export const zoneValidator = v.union(v.literal(1), v.literal(2), v.literal(3));

// PRIVACY LINE (PRD §2.1): these tables hold identity, purchases and saved
// game CONFIGS only. No table ever stores live sessions, drawn cards,
// answers, or player names — and no function accepts such payloads.
export default defineSchema({
  decks: defineTable({
    slug: v.string(), // "starter-sweet"
    title: v.string(),
    description: v.string(),
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
    text: v.string(),
    props: v.optional(v.boolean()),
  }).index("by_deck", ["deckId"]),

  games: defineTable({
    userId: v.string(), // Clerk user id (identity.subject)
    name: v.string(),
    tier: tierValidator,
    deckSlug: v.string(),
    boardPreset: v.string(), // "classic" for MVP
    customPrompts: v.array(
      v.object({
        tile: v.number(),
        text: v.string(),
        kind: kindValidator,
      }),
    ),
  }).index("by_user", ["userId"]),

  purchases: defineTable({
    // Phase 2 — schema reserved, unused in MVP (PRD §6.5)
    userId: v.string(),
    deckSlug: v.string(),
    stripeSessionId: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_deck", ["userId", "deckSlug"]),
});

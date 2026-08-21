import { mutation, query, type QueryCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { kindValidator } from "./schema";

// Game Templates: saved CONFIGS only — board choice, tier, deck, pinned
// prompt text. Never live sessions or anything from during play (PRD §2.1).

const customPromptsValidator = v.array(
  v.object({ tile: v.number(), text: v.string(), kind: kindValidator })
);

// Save caps (spec #1) — explicit rejections instead of silent truncation.
const MAX_NAME_LENGTH = 80;
const MAX_PIN_TEXT_LENGTH = 280;
const MAX_PINS = 100;
const MAX_TEMPLATES_PER_USER = 50;
// §4.6 — MUST equal DEFAULT_SKIP_BUDGET in src/game/engine.ts (the server
// bundle can't import client code, so the invariant is by convention).
const DEFAULT_SKIP_BUDGET = 3;

async function requireUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.tokenIdentifier;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return []; // unauthenticated render — empty, not an error
    return ctx.db
      .query("gameTemplates")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .order("desc")
      .take(MAX_TEMPLATES_PER_USER);
  },
});

export const save = mutation({
  args: {
    id: v.optional(v.id("gameTemplates")),
    name: v.string(),
    deckSlug: v.string(),
    boardPreset: v.string(),
    // Per-player skip budget: null = unlimited, omitted = default (§4.6).
    skipsPerPlayer: v.optional(v.union(v.number(), v.null())),
    customPrompts: customPromptsValidator,
  },
  handler: async (ctx, { id, skipsPerPlayer, ...rest }) => {
    const userId = await requireUser(ctx);

    if (
      typeof skipsPerPlayer === "number" &&
      (!Number.isInteger(skipsPerPlayer) || skipsPerPlayer < 0)
    ) {
      throw new ConvexError(
        "The skip budget must be a whole number of skips (0 or more)"
      );
    }
    const fields = {
      ...rest,
      skipsPerPlayer:
        skipsPerPlayer === undefined ? DEFAULT_SKIP_BUDGET : skipsPerPlayer,
    };

    if (fields.name.length > MAX_NAME_LENGTH) {
      throw new ConvexError(
        `Template names can be at most ${MAX_NAME_LENGTH} characters`
      );
    }
    if (fields.customPrompts.length > MAX_PINS) {
      throw new ConvexError(
        `A Template can hold at most ${MAX_PINS} pinned prompts`
      );
    }
    for (const prompt of fields.customPrompts) {
      if (prompt.text.length > MAX_PIN_TEXT_LENGTH) {
        throw new ConvexError(
          `Pinned prompt text can be at most ${MAX_PIN_TEXT_LENGTH} characters`
        );
      }
    }

    // Tier is derived from the Deck, never client-declared — a Template's
    // intensity label can't lie about the 18+ gate (spec #1).
    const deck = await ctx.db
      .query("decks")
      .withIndex("by_slug", (q) => q.eq("slug", fields.deckSlug))
      .unique();
    if (!deck) throw new ConvexError(`Unknown deck: ${fields.deckSlug}`);
    if (!deck.isActive) {
      throw new ConvexError(`Deck "${fields.deckSlug}" is no longer available`);
    }

    if (id) {
      const existing = await ctx.db.get(id);
      if (!existing || existing.userId !== userId) throw new Error("Not found");
      await ctx.db.patch(id, { ...fields, tier: deck.tier });
      return id;
    }
    // Bounded threshold probe, not an unbounded count: reads at most the cap
    // (50 rows), so no counter table or aggregate component is warranted.
    const existingCount = (
      await ctx.db
        .query("gameTemplates")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .take(MAX_TEMPLATES_PER_USER)
    ).length;
    if (existingCount >= MAX_TEMPLATES_PER_USER) {
      throw new ConvexError(
        `You can keep at most ${MAX_TEMPLATES_PER_USER} Templates — delete one first`
      );
    }
    return ctx.db.insert("gameTemplates", {
      userId,
      ...fields,
      tier: deck.tier,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("gameTemplates") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(id);
  },
});

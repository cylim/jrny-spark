import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { STARTER_DECKS } from "./starterDecks";

/**
 * Idempotent starter-deck seeding. Run with:
 *   bun run seed        (alias for `convex run seed:seedDecks`)
 * Re-running replaces each starter deck's prompts with the current content
 * of convex/starterDecks.ts — safe to use as the deck-iteration workflow.
 */
export const seedDecks = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const deck of STARTER_DECKS) {
      const existing = await ctx.db
        .query("decks")
        .withIndex("by_slug", (q) => q.eq("slug", deck.slug))
        .unique();

      const meta = {
        slug: deck.slug,
        title: deck.title,
        description: deck.description,
        tier: deck.tier,
        isPremium: false,
        isActive: true,
        promptCount: deck.prompts.length,
      };

      let deckId: Id<"decks">;
      if (existing) {
        await ctx.db.patch(existing._id, meta);
        deckId = existing._id;
        const oldPrompts = await ctx.db
          .query("prompts")
          .withIndex("by_deck", (q) => q.eq("deckId", deckId))
          .collect();
        for (const p of oldPrompts) await ctx.db.delete(p._id);
      } else {
        deckId = await ctx.db.insert("decks", meta);
      }

      for (const prompt of deck.prompts) {
        await ctx.db.insert("prompts", { deckId, ...prompt });
      }
    }
    return { decks: STARTER_DECKS.length };
  },
});

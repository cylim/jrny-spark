import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { MAX_PROMPTS_PER_DECK } from "./decks";
import { STARTER_DECKS, type StarterText } from "./starterDecks";

/** Normalize authored text (plain English or localized map) to the DB shape. */
const toLocalized = (text: StarterText) =>
  typeof text === "string" ? { en: text } : text;

/**
 * Idempotent starter-deck seeding. Run with:
 *   bun run seed        (alias for `convex run seed:seedDecks`)
 * Re-running replaces each starter deck's prompts with the current content
 * of convex/starterDecks.ts — safe to use as the deck-iteration workflow,
 * and as the migration that rewrites pre-i18n rows in the localized shape.
 */
export const seedDecks = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const deck of STARTER_DECKS) {
      // decks.getPrompts reads at most MAX_PROMPTS_PER_DECK; refusing to seed
      // past it keeps that bound from ever silently truncating a pool.
      if (deck.prompts.length > MAX_PROMPTS_PER_DECK) {
        throw new Error(
          `Deck "${deck.slug}" has ${deck.prompts.length} prompts — the serving cap is ${MAX_PROMPTS_PER_DECK}`
        );
      }
      const existing = await ctx.db
        .query("decks")
        .withIndex("by_slug", (q) => q.eq("slug", deck.slug))
        .unique();

      const meta = {
        slug: deck.slug,
        title: toLocalized(deck.title),
        description: toLocalized(deck.description),
        tier: deck.tier,
        isPremium: false,
        isActive: true,
        promptCount: deck.prompts.length,
      };

      let deckId: Id<"decks">;
      if (existing) {
        await ctx.db.patch(existing._id, meta);
        deckId = existing._id;
        // Bounded batches until dry — never an unbounded collect().
        for (;;) {
          const oldPrompts = await ctx.db
            .query("prompts")
            .withIndex("by_deckId", (q) => q.eq("deckId", deckId))
            .take(200);
          if (oldPrompts.length === 0) break;
          for (const p of oldPrompts) await ctx.db.delete(p._id);
        }
      } else {
        deckId = await ctx.db.insert("decks", meta);
      }

      for (const prompt of deck.prompts) {
        await ctx.db.insert("prompts", {
          deckId,
          ...prompt,
          text: toLocalized(prompt.text),
        });
      }
    }
    return { decks: STARTER_DECKS.length };
  },
});

import { query } from "./_generated/server";
import { v } from "convex/values";

/** Deck metadata for pickers — public, never includes prompt text. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const decks = await ctx.db.query("decks").collect();
    return decks
      .filter((d) => d.isActive)
      .map(({ _id, slug, title, description, tier, isPremium, promptCount }) => ({
        _id,
        slug,
        title,
        description,
        tier,
        isPremium,
        promptCount,
      }));
  },
});

/**
 * Prompt pool for a deck. THE premium gate (PRD §6.5): premium prompt text
 * only ever leaves this function for a signed-in buyer — it is never in the
 * client bundle. All MVP decks are free (isPremium: false), but the gate is
 * live now so Phase 2 is a data change, not a code change.
 */
export const getPrompts = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const deck = await ctx.db
      .query("decks")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!deck || !deck.isActive) return null;

    if (deck.isPremium) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Sign in to access this deck");
      const purchase = await ctx.db
        .query("purchases")
        .withIndex("by_user_deck", (q) =>
          q.eq("userId", identity.subject).eq("deckSlug", deck.slug),
        )
        .first();
      if (!purchase) throw new Error("This deck hasn't been unlocked");
    }

    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_deck", (q) => q.eq("deckId", deck._id))
      .collect();

    return prompts.map((p) => ({
      id: p._id as string,
      zone: p.zone,
      kind: p.kind,
      text: p.text,
      props: p.props,
    }));
  },
});

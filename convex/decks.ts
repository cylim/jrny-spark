import { query } from "./_generated/server";
import { v, type Infer } from "convex/values";
import { displayTextValidator, localeValidator } from "./schema";

export type Locale = Infer<typeof localeValidator>;
type DisplayText = Infer<typeof displayTextValidator>;

/**
 * Project display text to one locale, English fallback (PRD §6.10) — the
 * client and game engine only ever see plain strings. Plain-string rows are
 * the pre-i18n shape (≙ English).
 */
export function localize(text: DisplayText, locale?: Locale): string {
  if (typeof text === "string") return text;
  return (locale && text[locale]) || text.en;
}

// Read bounds. The catalog is curated (a handful of starter decks; PRD
// tops out at tens), and the prompt cap is far above the authoring bar
// (~30 cards/deck) — the game needs a deck's ENTIRE pool, so the cap is a
// safety bound, not pagination. seed.ts refuses content above it, so the
// bound can never silently truncate a pool.
const MAX_DECKS = 100;
export const MAX_PROMPTS_PER_DECK = 1000;

/** Deck metadata for pickers — public, never includes prompt text. */
export const list = query({
  args: { locale: v.optional(localeValidator) },
  handler: async (ctx, { locale }) => {
    const decks = await ctx.db.query("decks").take(MAX_DECKS);
    return decks
      .filter((d) => d.isActive)
      .map(
        ({ _id, slug, title, description, tier, isPremium, promptCount }) => ({
          _id,
          slug,
          title: localize(title, locale),
          description: localize(description, locale),
          tier,
          isPremium,
          promptCount,
        })
      );
  },
});

/**
 * Prompt pool for a deck, projected to one locale with English fallback.
 * THE premium gate (PRD §6.5): premium prompt text only ever leaves this
 * function for a signed-in buyer — it is never in the client bundle. All MVP
 * decks are free (isPremium: false), but the gate is live now so Phase 2 is
 * a data change, not a code change. A purchased deck includes all its
 * languages — the locale argument selects presentation, never entitlement.
 */
export const getPrompts = query({
  args: { slug: v.string(), locale: v.optional(localeValidator) },
  handler: async (ctx, { slug, locale }) => {
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
        .withIndex("by_userId_and_deckSlug", (q) =>
          q.eq("userId", identity.tokenIdentifier).eq("deckSlug", deck.slug)
        )
        .first();
      if (!purchase) throw new Error("This deck hasn't been unlocked");
    }

    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_deckId", (q) => q.eq("deckId", deck._id))
      .take(MAX_PROMPTS_PER_DECK);

    return prompts.map((p) => ({
      id: p._id as string,
      zone: p.zone,
      kind: p.kind,
      text: localize(p.text, locale),
      props: p.props,
    }));
  },
});

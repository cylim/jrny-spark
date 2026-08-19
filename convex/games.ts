import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { kindValidator, tierValidator } from "./schema";

// Saved game CONFIGS only — board choice, tier, deck, custom prompt text.
// Never live sessions or anything from during play (PRD §2.1).

const customPromptsValidator = v.array(
  v.object({ tile: v.number(), text: v.string(), kind: kindValidator }),
);

async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.subject;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return []; // unauthenticated render — empty, not an error
    return ctx.db
      .query("games")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const save = mutation({
  args: {
    id: v.optional(v.id("games")),
    name: v.string(),
    tier: tierValidator,
    deckSlug: v.string(),
    boardPreset: v.string(),
    customPrompts: customPromptsValidator,
  },
  handler: async (ctx, { id, ...fields }) => {
    const userId = await requireUser(ctx);
    if (id) {
      const existing = await ctx.db.get(id);
      if (!existing || existing.userId !== userId) throw new Error("Not found");
      await ctx.db.patch(id, fields);
      return id;
    }
    return ctx.db.insert("games", { userId, ...fields });
  },
});

export const remove = mutation({
  args: { id: v.id("games") },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== userId) throw new Error("Not found");
    await ctx.db.delete(id);
  },
});

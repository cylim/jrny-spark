import type { convexTest } from "convex-test";
import type { Doc, Id } from "./_generated/dataModel";

// Shared convex-test fixtures. The convex-test import is type-only, so this
// module bundles as inert data on deploy — same as starterDecks.ts.

export type Harness = ReturnType<typeof convexTest>;

/** A deck row as inserted (no system fields) — typed so test overrides
 * catch misspelled or wrongly-typed fields at compile time. */
export type DeckSeed = Omit<Doc<"decks">, "_id" | "_creationTime">;

// Ownership keys are identity.tokenIdentifier — pinned explicitly so tests
// don't depend on how convex-test derives one from `subject`.
export const ALEX = { subject: "user_alex", tokenIdentifier: "test|user_alex" };
export const BLAIR = { subject: "user_blair", tokenIdentifier: "test|user_blair" };

export function seedDeck(
  t: Harness,
  overrides: Partial<DeckSeed> = {},
): Promise<Id<"decks">> {
  return t.run((ctx) =>
    ctx.db.insert("decks", {
      slug: "starter-flirty",
      title: "Starter — Flirty",
      description: "A test deck",
      tier: "flirty",
      isPremium: false,
      isActive: true,
      promptCount: 0,
      ...overrides,
    }),
  );
}

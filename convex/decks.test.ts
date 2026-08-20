/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { ALEX, seedDeck, type DeckSeed, type Harness } from "./testHelpers";

const modules = import.meta.glob("./**/*.ts");

async function seedDeckWithPrompt(t: Harness, overrides: Partial<DeckSeed> = {}) {
  const deckId = await seedDeck(t, {
    slug: "velvet",
    title: "Velvet",
    tier: "spicy",
    promptCount: 1,
    ...overrides,
  });
  await t.run(async (ctx) => {
    await ctx.db.insert("prompts", {
      deckId,
      zone: 1,
      kind: "question",
      text: "What made you smile today?",
    });
  });
}

test("a free deck's prompts are readable without signing in", async () => {
  const t = convexTest(schema, modules);
  await seedDeckWithPrompt(t);

  const prompts = await t.query(api.decks.getPrompts, { slug: "velvet" });
  expect(prompts).toHaveLength(1);
  expect(prompts?.[0]?.text).toBe("What made you smile today?");
});

test("an inactive deck's prompts are not served", async () => {
  const t = convexTest(schema, modules);
  await seedDeckWithPrompt(t, { isActive: false });

  expect(await t.query(api.decks.getPrompts, { slug: "velvet" })).toBeNull();
});

test("a premium deck requires sign-in", async () => {
  const t = convexTest(schema, modules);
  await seedDeckWithPrompt(t, { isPremium: true });

  await expect(t.query(api.decks.getPrompts, { slug: "velvet" })).rejects.toThrow(
    /sign in/i,
  );
});

test("a premium deck is gated until purchased", async () => {
  const t = convexTest(schema, modules);
  await seedDeckWithPrompt(t, { isPremium: true });
  const asAlex = t.withIdentity(ALEX);

  await expect(asAlex.query(api.decks.getPrompts, { slug: "velvet" })).rejects.toThrow(
    /unlocked/i,
  );

  await t.run(async (ctx) => {
    await ctx.db.insert("purchases", {
      userId: ALEX.tokenIdentifier,
      kind: "deck",
      deckSlug: "velvet",
      stripeSessionId: "cs_test_123",
    });
  });

  const prompts = await asAlex.query(api.decks.getPrompts, { slug: "velvet" });
  expect(prompts).toHaveLength(1);
});

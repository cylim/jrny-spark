/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { ALEX, seedDeck, type DeckSeed, type Harness } from "./testHelpers";

const modules = import.meta.glob("./**/*.ts");

async function seedDeckWithPrompt(
  t: Harness,
  overrides: Partial<DeckSeed> = {}
) {
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

  await expect(
    t.query(api.decks.getPrompts, { slug: "velvet" })
  ).rejects.toThrow(/sign in/i);
});

test("prompts project the requested locale, with English fallback for gaps", async () => {
  const t = convexTest(schema, modules);
  const deckId = await seedDeck(t, { promptCount: 2 });
  await t.run(async (ctx) => {
    await ctx.db.insert("prompts", {
      deckId,
      zone: 1,
      kind: "question",
      text: {
        en: "What made you smile today?",
        ko: "오늘 당신을 웃게 한 건 뭐였어요?",
      },
    });
    await ctx.db.insert("prompts", {
      deckId,
      zone: 2,
      kind: "action",
      text: { en: "Give a five-word compliment." }, // no translations yet
    });
  });

  const korean = await t.query(api.decks.getPrompts, {
    slug: "starter-flirty",
    locale: "ko",
  });
  expect(korean?.map((p) => p.text)).toEqual([
    "오늘 당신을 웃게 한 건 뭐였어요?", // translated
    "Give a five-word compliment.", // English fallback, never a blank
  ]);

  const chinese = await t.query(api.decks.getPrompts, {
    slug: "starter-flirty",
    locale: "zh-Hant",
  });
  expect(chinese?.[0]?.text).toBe("What made you smile today?"); // untranslated → English

  const noLocale = await t.query(api.decks.getPrompts, {
    slug: "starter-flirty",
  });
  expect(noLocale?.[0]?.text).toBe("What made you smile today?");
});

test("legacy plain-string prompts and deck text still serve under any locale", async () => {
  const t = convexTest(schema, modules);
  await seedDeckWithPrompt(t); // seeds pre-i18n string shapes
  const prompts = await t.query(api.decks.getPrompts, {
    slug: "velvet",
    locale: "ko",
  });
  expect(prompts?.[0]?.text).toBe("What made you smile today?");

  const decks = await t.query(api.decks.list, { locale: "ko" });
  expect(decks[0]?.title).toBe("Velvet");
});

test("deck listings project localized titles and descriptions", async () => {
  const t = convexTest(schema, modules);
  await seedDeck(t, {
    title: { en: "First Steps", ko: "첫걸음", "zh-Hant": "第一步" },
    description: { en: "Warm and curious." },
  });

  const korean = await t.query(api.decks.list, { locale: "ko" });
  expect(korean[0]?.title).toBe("첫걸음");
  expect(korean[0]?.description).toBe("Warm and curious."); // fallback

  const english = await t.query(api.decks.list, {});
  expect(english[0]?.title).toBe("First Steps");
});

test("seeding writes starter decks in the localized shape", async () => {
  const t = convexTest(schema, modules);
  await t.mutation(internal.seed.seedDecks, {});

  const { deck, prompt } = await t.run(async (ctx) => {
    const deck = await ctx.db.query("decks").first();
    const prompt = await ctx.db.query("prompts").first();
    return { deck, prompt };
  });
  expect(typeof deck?.title).toBe("object");
  expect((deck?.title as { en: string }).en).toBeTruthy();
  expect(typeof prompt?.text).toBe("object");
  expect((prompt?.text as { en: string }).en).toBeTruthy();
});

test("a premium deck is gated until purchased", async () => {
  const t = convexTest(schema, modules);
  await seedDeckWithPrompt(t, { isPremium: true });
  const asAlex = t.withIdentity(ALEX);

  await expect(
    asAlex.query(api.decks.getPrompts, { slug: "velvet" })
  ).rejects.toThrow(/unlocked/i);

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

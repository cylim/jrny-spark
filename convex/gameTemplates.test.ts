/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { ALEX, BLAIR, seedDeck } from "./testHelpers";

const modules = import.meta.glob("./**/*.ts");

const TEMPLATE = {
  name: "Date night",
  deckSlug: "starter-flirty",
  boardPreset: "classic",
  customPrompts: [],
};

test("list returns empty for unauthenticated visitors, even when Templates exist", async () => {
  const t = convexTest(schema, modules);
  await seedDeck(t);
  await t.withIdentity(ALEX).mutation(api.gameTemplates.save, TEMPLATE);

  expect(await t.query(api.gameTemplates.list, {})).toEqual([]);
});

test("save derives the Template's tier from the referenced deck", async () => {
  const t = convexTest(schema, modules);
  await seedDeck(t, { slug: "starter-spicy", tier: "spicy" });
  const asAlex = t.withIdentity(ALEX);

  await asAlex.mutation(api.gameTemplates.save, {
    ...TEMPLATE,
    deckSlug: "starter-spicy",
  });

  const [saved] = await asAlex.query(api.gameTemplates.list, {});
  expect(saved?.tier).toBe("spicy");
});

const pin = (tile: number, text = "Tell me a secret") => ({
  tile,
  text,
  kind: "question" as const,
});

test("save rejects a name over 80 characters", async () => {
  const t = convexTest(schema, modules);
  await seedDeck(t);
  const asAlex = t.withIdentity(ALEX);

  await expect(
    asAlex.mutation(api.gameTemplates.save, {
      ...TEMPLATE,
      name: "n".repeat(81),
    })
  ).rejects.toThrow(/80/);
});

test("save rejects a pinned prompt over 280 characters", async () => {
  const t = convexTest(schema, modules);
  await seedDeck(t);
  const asAlex = t.withIdentity(ALEX);

  await expect(
    asAlex.mutation(api.gameTemplates.save, {
      ...TEMPLATE,
      customPrompts: [pin(10, "x".repeat(281))],
    })
  ).rejects.toThrow(/280/);
});

test("save rejects more than 100 pinned prompts", async () => {
  const t = convexTest(schema, modules);
  await seedDeck(t);
  const asAlex = t.withIdentity(ALEX);

  const pins = Array.from({ length: 101 }, (_, i) => pin(i + 2));
  await expect(
    asAlex.mutation(api.gameTemplates.save, {
      ...TEMPLATE,
      customPrompts: pins,
    })
  ).rejects.toThrow(/100/);
});

test("save accepts values exactly at the caps", async () => {
  const t = convexTest(schema, modules);
  await seedDeck(t);
  const asAlex = t.withIdentity(ALEX);

  const pins = Array.from({ length: 100 }, (_, i) =>
    pin(i + 2, "x".repeat(280))
  );
  await asAlex.mutation(api.gameTemplates.save, {
    ...TEMPLATE,
    name: "n".repeat(80),
    customPrompts: pins,
  });

  const templates = await asAlex.query(api.gameTemplates.list, {});
  expect(templates).toHaveLength(1);
});

test("a user's 51st Template is rejected, but editing at the cap still works", async () => {
  const t = convexTest(schema, modules);
  await seedDeck(t);
  const asAlex = t.withIdentity(ALEX);

  await t.run(async (ctx) => {
    for (let i = 0; i < 50; i++) {
      await ctx.db.insert("gameTemplates", {
        userId: ALEX.tokenIdentifier,
        name: `Template ${i}`,
        tier: "flirty",
        deckSlug: "starter-flirty",
        boardPreset: "classic",
        customPrompts: [],
      });
    }
  });

  await expect(
    asAlex.mutation(api.gameTemplates.save, TEMPLATE)
  ).rejects.toThrow(/50/);

  const [existing] = await asAlex.query(api.gameTemplates.list, {});
  await asAlex.mutation(api.gameTemplates.save, {
    ...TEMPLATE,
    id: existing!._id,
    name: "Renamed at the cap",
  });
  const renamed = await asAlex.query(api.gameTemplates.list, {});
  expect(renamed.some((tpl) => tpl.name === "Renamed at the cap")).toBe(true);
});

test("skip budget: defaults to 3, stores explicit values, null means unlimited", async () => {
  const t = convexTest(schema, modules);
  await seedDeck(t);
  const asAlex = t.withIdentity(ALEX);

  await asAlex.mutation(api.gameTemplates.save, TEMPLATE);
  await asAlex.mutation(api.gameTemplates.save, {
    ...TEMPLATE,
    name: "Strict",
    skipsPerPlayer: 0,
  });
  await asAlex.mutation(api.gameTemplates.save, {
    ...TEMPLATE,
    name: "Free",
    skipsPerPlayer: null,
  });

  const templates = await asAlex.query(api.gameTemplates.list, {});
  const byName = Object.fromEntries(
    templates.map((tpl) => [tpl.name, tpl.skipsPerPlayer])
  );
  expect(byName[TEMPLATE.name]).toBe(3);
  expect(byName.Strict).toBe(0);
  expect(byName.Free).toBeNull();
});

test("skip budget rejects negative and fractional values", async () => {
  const t = convexTest(schema, modules);
  await seedDeck(t);
  const asAlex = t.withIdentity(ALEX);

  await expect(
    asAlex.mutation(api.gameTemplates.save, { ...TEMPLATE, skipsPerPlayer: -1 })
  ).rejects.toThrow(/skip/i);
  await expect(
    asAlex.mutation(api.gameTemplates.save, {
      ...TEMPLATE,
      skipsPerPlayer: 2.5,
    })
  ).rejects.toThrow(/skip/i);
});

test("another user cannot update or delete someone else's Template", async () => {
  const t = convexTest(schema, modules);
  await seedDeck(t);
  const asAlex = t.withIdentity(ALEX);
  const asBlair = t.withIdentity(BLAIR);

  const id = await asAlex.mutation(api.gameTemplates.save, TEMPLATE);

  await expect(
    asBlair.mutation(api.gameTemplates.save, {
      ...TEMPLATE,
      id,
      name: "Hijacked",
    })
  ).rejects.toThrow(/not found/i);
  await expect(
    asBlair.mutation(api.gameTemplates.remove, { id })
  ).rejects.toThrow(/not found/i);

  // Blair never sees it; Alex's copy is untouched and still deletable.
  expect(await asBlair.query(api.gameTemplates.list, {})).toEqual([]);
  const [alexs] = await asAlex.query(api.gameTemplates.list, {});
  expect(alexs?.name).toBe(TEMPLATE.name);
  await asAlex.mutation(api.gameTemplates.remove, { id });
  expect(await asAlex.query(api.gameTemplates.list, {})).toEqual([]);
});

test("save against an unknown deck is rejected", async () => {
  const t = convexTest(schema, modules);
  const asAlex = t.withIdentity(ALEX);

  await expect(
    asAlex.mutation(api.gameTemplates.save, {
      ...TEMPLATE,
      deckSlug: "no-such-deck",
    })
  ).rejects.toThrow(/unknown deck/i);
});

test("save against an inactive deck is rejected", async () => {
  const t = convexTest(schema, modules);
  await seedDeck(t, { isActive: false });
  const asAlex = t.withIdentity(ALEX);

  await expect(
    asAlex.mutation(api.gameTemplates.save, TEMPLATE)
  ).rejects.toThrow(/no longer available/i);
});

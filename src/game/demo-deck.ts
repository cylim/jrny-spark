import type { Prompt } from "./types";
import type { Locale } from "~/lib/i18n/messages";

/**
 * Tiny bundled deck (sweet tier) so the game is playable with no Convex
 * deployment (fresh clone, demo mode) and on a first-ever visit that
 * happens offline. Real decks live server-side (PRD §6.2) — this is a
 * deliberate, small exception and duplicates nothing premium.
 *
 * Localized at build time (PRD §6.10): text ships as per-locale maps in the
 * bundle and is projected to plain strings here, so the engine never sees a
 * map. English is required; card translations land with the per-language
 * authoring passes.
 */
export const DEMO_DECK_SLUG = "demo";

type DemoText = { en: string; ko?: string; "zh-Hant"?: string };

const localize = (text: DemoText, locale: Locale): string =>
  text[locale] ?? text.en;

const DEMO_CARDS: Array<Omit<Prompt, "text"> & { text: DemoText }> = [
  {
    id: "demo-1",
    zone: 1,
    kind: "question",
    text: {
      en: "What was your very first impression of me — and how wrong was it?",
    },
  },
  {
    id: "demo-2",
    zone: 1,
    kind: "action",
    text: {
      en: "Give your partner your best compliment using exactly five words.",
    },
  },
  {
    id: "demo-3",
    zone: 1,
    kind: "together",
    text: {
      en: "Invent a brand-new nickname for each other. Use them for the rest of the game.",
    },
  },
  {
    id: "demo-4",
    zone: 2,
    kind: "question",
    text: { en: "Which memory of us do you replay the most?" },
  },
  {
    id: "demo-5",
    zone: 2,
    kind: "action",
    text: {
      en: "Thank your partner for something you never actually said thank you for.",
    },
  },
  {
    id: "demo-6",
    zone: 2,
    kind: "question",
    text: {
      en: "What do I do when I think no one is watching that makes you smile?",
    },
  },
  {
    id: "demo-7",
    zone: 3,
    kind: "question",
    text: { en: "What do you hope we're doing ten years from today?" },
  },
  {
    id: "demo-8",
    zone: 3,
    kind: "action",
    text: {
      en: "Tell your partner the thing you love most about them. Full sentences.",
    },
  },
  {
    id: "demo-9",
    zone: 3,
    kind: "question",
    text: { en: "What's something about me you hope never changes?" },
  },
];

export function demoPrompts(locale: Locale): Prompt[] {
  return DEMO_CARDS.map((card) => ({
    ...card,
    text: localize(card.text, locale),
  }));
}

const DEMO_TITLE: DemoText = {
  en: "Demo — First Steps (sample)",
  ko: "데모 — 첫걸음 (샘플)",
  "zh-Hant": "示範——第一步(範例)",
};
const DEMO_DESCRIPTION: DemoText = {
  en: "A small built-in sample deck. Connect Convex for the full starter decks.",
  ko: "앱에 내장된 작은 샘플 덱이에요. Convex를 연결하면 전체 스타터 덱을 쓸 수 있어요.",
  "zh-Hant": "內建的小型範例牌組。連接 Convex 即可使用完整的入門牌組。",
};

export function demoDeckMeta(locale: Locale) {
  return {
    slug: DEMO_DECK_SLUG,
    title: localize(DEMO_TITLE, locale),
    description: localize(DEMO_DESCRIPTION, locale),
    tier: "sweet" as const,
    isPremium: false,
    promptCount: DEMO_CARDS.length,
  };
}

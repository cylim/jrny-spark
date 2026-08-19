import type { Prompt } from "./types";

/**
 * Tiny bundled deck (sweet tier) so the game is playable with no Convex
 * deployment (fresh clone, demo mode) and on a first-ever visit that
 * happens offline. Real decks live server-side (PRD §6.2) — this is a
 * deliberate, small exception and duplicates nothing premium.
 */
export const DEMO_DECK_SLUG = "demo";

export const DEMO_PROMPTS: Prompt[] = [
  { id: "demo-1", zone: 1, kind: "question", text: "What was your very first impression of me — and how wrong was it?" },
  { id: "demo-2", zone: 1, kind: "action", text: "Give your partner your best compliment using exactly five words." },
  { id: "demo-3", zone: 1, kind: "together", text: "Invent a brand-new nickname for each other. Use them for the rest of the game." },
  { id: "demo-4", zone: 2, kind: "question", text: "Which memory of us do you replay the most?" },
  { id: "demo-5", zone: 2, kind: "action", text: "Thank your partner for something you never actually said thank you for." },
  { id: "demo-6", zone: 2, kind: "question", text: "What do I do when I think no one is watching that makes you smile?" },
  { id: "demo-7", zone: 3, kind: "question", text: "What do you hope we're doing ten years from today?" },
  { id: "demo-8", zone: 3, kind: "action", text: "Tell your partner the thing you love most about them. Full sentences." },
  { id: "demo-9", zone: 3, kind: "question", text: "What's something about me you hope never changes?" },
];

export const DEMO_DECK_META = {
  slug: DEMO_DECK_SLUG,
  title: "Demo — First Steps (sample)",
  description: "A small built-in sample deck. Connect Convex for the full starter decks.",
  tier: "sweet" as const,
  isPremium: false,
  promptCount: DEMO_PROMPTS.length,
};

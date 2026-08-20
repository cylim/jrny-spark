import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { nextTier } from "~/game/engine";
import type { GameState, Prompt, Tier } from "~/game/types";
import { hasConvex } from "~/env";
import { useI18n } from "~/lib/i18n";
import {
  cacheDeck,
  getCachedDeck,
  getCachedDeckList,
  type CachedDeckMeta,
} from "./storage";

export interface AdvanceOption {
  tier: Tier;
  deckSlug: string;
}

/**
 * The Advance side of the exhaustion sheet (§4.7): the next tier's deck, but
 * only when its prompts are actually obtainable right now — server when
 * reachable, IndexedDB cache when offline. Never offered at spicy, and never
 * backed by a different tier's cards: escalation must not degrade into the
 * demo-deck fallback, so this deliberately bypasses usePromptPool.
 */
export function useAdvanceOption(
  state: GameState | null | undefined
): AdvanceOption | null {
  const { locale } = useI18n();
  const target =
    state?.phase === "exhaustionChoice" ? nextTier(state.config.tier) : null;

  // Deck metadata: live list first, the cached copy when offline.
  const serverList = useQuery(
    api.decks.list,
    hasConvex && target ? { locale } : "skip"
  );
  const [cachedList, setCachedList] = useState<CachedDeckMeta[] | null>(null);
  useEffect(() => {
    if (!target) return;
    let alive = true;
    getCachedDeckList().then((list) => {
      if (alive) setCachedList(list);
    });
    return () => {
      alive = false;
    };
  }, [target]);

  const decks = serverList ?? cachedList ?? [];
  // MVP decks are all free; premium candidates wait for the Phase 2
  // Purchase option rather than throwing an entitlement error here.
  const candidate = target
    ? decks.find((d) => d.tier === target && !d.isPremium)
    : undefined;

  // The candidate's pool — presence is what makes Advance offerable.
  const slug = candidate?.slug;
  const serverPool = useQuery(
    api.decks.getPrompts,
    hasConvex && slug ? { slug, locale } : "skip"
  );
  const [cachedPool, setCachedPool] = useState<Prompt[] | null>(null);
  useEffect(() => {
    setCachedPool(null);
    if (!slug) return;
    let alive = true;
    getCachedDeck(slug).then((p) => {
      if (alive && p) setCachedPool(p);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  // Warm the cache so the game can complete the advance even if the
  // connection drops between this sheet and the confirmation taps.
  useEffect(() => {
    if (slug && serverPool && serverPool.length > 0)
      void cacheDeck(slug, serverPool);
  }, [slug, serverPool]);

  const pool = serverPool ?? cachedPool;
  if (!target || !slug || !pool || pool.length === 0) return null;
  return { tier: target, deckSlug: slug };
}

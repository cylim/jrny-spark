import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Prompt, Tier } from "~/game/types";
import { DEMO_DECK_META, DEMO_DECK_SLUG, DEMO_PROMPTS } from "~/game/demo-deck";
import { hasConvex } from "~/env";
import { cacheDeck, getCachedDeck } from "./storage";

export interface DeckMeta {
  slug: string;
  title: string;
  description: string;
  tier: Tier;
  isPremium: boolean;
  promptCount: number;
}

/** Server decks (when Convex is configured) plus the built-in demo deck. */
export function useDeckList(): DeckMeta[] {
  const server = useQuery(api.decks.list, hasConvex ? {} : "skip");
  const serverDecks: DeckMeta[] = (server ?? []).map((d) => ({
    slug: d.slug,
    title: d.title,
    description: d.description,
    tier: d.tier,
    isPremium: d.isPremium,
    promptCount: d.promptCount,
  }));
  return [...serverDecks, DEMO_DECK_META];
}

/**
 * Prompt pool for a deck: Convex when reachable, IndexedDB cache when
 * offline, bundled demo deck for the demo slug. `null` = loading or
 * unavailable — callers keep the dice disabled.
 *
 * Tier is a consent boundary (PRD §2.2): a missing/deactivated deck falls
 * back to the same-deck IndexedDB cache or blocks — NEVER to a different
 * deck's prompts. The sweet demo deck is only ever a fallback in demo mode
 * (no backend), where falling DOWN in intensity is the safe direction.
 */
export function usePromptPool(slug: string | undefined): Prompt[] | null {
  const isDemo = slug === DEMO_DECK_SLUG;
  const skip = isDemo || !slug || !hasConvex;
  const server = useQuery(api.decks.getPrompts, skip ? "skip" : { slug });
  const [cached, setCached] = useState<Prompt[] | null>(null);

  useEffect(() => {
    if (isDemo || !slug) return;
    let alive = true;
    getCachedDeck(slug).then((p) => {
      if (alive && p) setCached(p);
    });
    return () => {
      alive = false;
    };
  }, [slug, isDemo]);

  useEffect(() => {
    if (!skip && slug && server && server.length > 0) {
      void cacheDeck(slug, server);
    }
  }, [server, slug, skip]);

  if (!slug) return null;
  if (isDemo) return DEMO_PROMPTS;
  // Session from an old backend-connected install, running without Convex:
  // same-deck cache first; the sweet sample only as a last resort.
  if (!hasConvex) return cached ?? DEMO_PROMPTS;
  // Deck deactivated/unknown server-side: same-deck cache, or block (null).
  if (server === null) return cached;
  return server ?? cached; // undefined while loading/offline → cache → null
}

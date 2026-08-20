import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Prompt, Tier } from "~/game/types";
import { DEMO_DECK_SLUG, demoDeckMeta, demoPrompts } from "~/game/demo-deck";
import { hasConvex } from "~/env";
import { useI18n } from "~/lib/i18n";
import { cacheDeck, cacheDeckList, getCachedDeck } from "./storage";

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
  const { locale } = useI18n();
  const server = useQuery(api.decks.list, hasConvex ? { locale } : "skip");
  const serverDecks: DeckMeta[] = (server ?? []).map((d) => ({
    slug: d.slug,
    title: d.title,
    description: d.description,
    tier: d.tier,
    isPremium: d.isPremium,
    promptCount: d.promptCount,
  }));

  // Keep the metadata cached so an offline mid-session Advance (§4.7) can
  // still discover the next tier's deck.
  useEffect(() => {
    if (server && server.length > 0) {
      void cacheDeckList(
        server.map(
          ({ slug, title, description, tier, isPremium, promptCount }) => ({
            slug,
            title,
            description,
            tier,
            isPremium,
            promptCount,
          })
        )
      );
    }
  }, [server]);

  return [...serverDecks, demoDeckMeta(locale)];
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
  const { locale } = useI18n();
  const isDemo = slug === DEMO_DECK_SLUG;
  const skip = isDemo || !slug || !hasConvex;
  const server = useQuery(
    api.decks.getPrompts,
    skip ? "skip" : { slug, locale }
  );
  const [cached, setCached] = useState<Prompt[] | null>(null);

  useEffect(() => {
    // Reset first: after a mid-session deck switch (Advance, §4.7) the
    // previous deck's cache must never masquerade as the new slug's pool.
    setCached(null);
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
  if (isDemo) return demoPrompts(locale);
  // Session from an old backend-connected install, running without Convex:
  // same-deck cache first; the sweet sample only as a last resort.
  if (!hasConvex) return cached ?? demoPrompts(locale);
  // Deck deactivated/unknown server-side: same-deck cache, or block (null).
  if (server === null) return cached;
  return server ?? cached; // undefined while loading/offline → cache → null
}

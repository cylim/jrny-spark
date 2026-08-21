import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Prompt } from "~/game/types";
import {
  SAMPLE_DECK_SLUG,
  sampleDeckMeta,
  sampleDeckPrompts,
} from "~/game/sample-deck";
import { hasConvex } from "~/env";
import { useI18n } from "~/lib/i18n";
import {
  cacheDeck,
  cacheDeckList,
  getCachedDeck,
  type CachedDeckMeta as DeckMeta,
} from "./storage";

export type { DeckMeta };

/** Server decks (when Convex is configured) plus the built-in Sample Deck. */
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

  return [...serverDecks, sampleDeckMeta(locale)];
}

/**
 * Prompt pool for a deck: Convex when reachable, IndexedDB cache when
 * offline, the bundled Sample Deck for its own slug. `null` = loading or
 * unavailable — callers keep the dice disabled.
 *
 * Tier is a consent boundary (PRD §2.2): a missing/deactivated deck falls
 * back to the same-deck IndexedDB cache or blocks — NEVER to a different
 * deck's prompts. The sweet Sample Deck is only ever a fallback when no
 * backend is configured, where falling DOWN in intensity is the safe
 * direction.
 */
export function usePromptPool(slug: string | undefined): Prompt[] | null {
  const { locale } = useI18n();
  const isSample = slug === SAMPLE_DECK_SLUG;
  const skip = isSample || !slug || !hasConvex;
  const server = useQuery(
    api.decks.getPrompts,
    skip ? "skip" : { slug, locale }
  );
  const [cached, setCached] = useState<Prompt[] | null>(null);

  useEffect(() => {
    // Reset first: after a mid-session deck switch (Advance, §4.7) the
    // previous deck's cache must never masquerade as the new slug's pool.
    setCached(null);
    if (isSample || !slug) return;
    let alive = true;
    getCachedDeck(slug).then((p) => {
      if (alive && p) setCached(p);
    });
    return () => {
      alive = false;
    };
  }, [slug, isSample]);

  useEffect(() => {
    if (!skip && slug && server && server.length > 0) {
      void cacheDeck(slug, server);
    }
  }, [server, slug, skip]);

  if (!slug) return null;
  if (isSample) return sampleDeckPrompts(locale);
  // Session from an old backend-connected install, running without Convex:
  // same-deck cache first; the sweet sample only as a last resort.
  if (!hasConvex) return cached ?? sampleDeckPrompts(locale);
  // Deck deactivated/unknown server-side: same-deck cache, or block (null).
  if (server === null) return cached;
  return server ?? cached; // undefined while loading/offline → cache → null
}

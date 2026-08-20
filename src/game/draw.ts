import type { GameState, Prompt, PromptKind, Zone } from "./types";
import { defaultRng, type Rng } from "./rng";

/**
 * Zone-aware draw without replacement. Falls back gracefully:
 * preferred kind → any kind in zone → reshuffle zone (never the last card
 * back-to-back) → adjacent zones. Returns null only for an empty pool.
 */
export function drawPrompt(
  pool: Prompt[],
  zone: Zone,
  usedIds: string[],
  rng: Rng = defaultRng,
  preferKind?: PromptKind,
): Prompt | null {
  const used = new Set(usedIds);
  const inZone = pool.filter((p) => p.zone === zone);
  const lastDrawn = usedIds[usedIds.length - 1];

  const candidates =
    firstNonEmpty(
      preferKind ? inZone.filter((p) => !used.has(p.id) && p.kind === preferKind) : [],
      inZone.filter((p) => !used.has(p.id)),
      inZone.filter((p) => p.id !== lastDrawn), // zone exhausted — reshuffle, no back-to-back repeat
      inZone, // single-card zone: a repeat is unavoidable
      pool.filter((p) => !used.has(p.id)),
      pool,
    ) ?? [];

  if (candidates.length === 0) return null;
  return candidates[Math.floor(rng() * candidates.length)];
}

/**
 * Resolve `state.pendingDraw` into a concrete prompt. Game Templates can pin
 * a prompt to the landed tile; pinned prompts trump the deck for plain tile
 * draws (never for ladder/charm cards). Returns null when there is nothing
 * pending or the pool is empty.
 */
export function resolveDraw(state: GameState, pool: Prompt[], rng: Rng = defaultRng): Prompt | null {
  const pending = state.pendingDraw;
  if (!pending) return null;
  if (pending.reason === "tile") {
    const tile = state.players[state.current].position;
    const pinned = state.config.tilePrompts?.[tile];
    if (pinned) return pinned;
  }
  return drawPrompt(pool, pending.zone, state.usedPromptIds[pending.zone], rng, pending.preferKind);
}

function firstNonEmpty<T>(...lists: T[][]): T[] | null {
  for (const list of lists) if (list.length > 0) return list;
  return null;
}

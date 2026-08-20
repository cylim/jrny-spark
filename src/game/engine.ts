import type {
  ActiveCard,
  BoardPreset,
  GameEvent,
  GameState,
  Prompt,
  SessionConfig,
  Tier,
  Zone,
} from "./types";

export function zoneOf(tile: number): Zone {
  if (tile <= 33) return 1;
  if (tile <= 66) return 2;
  return 3;
}

/** Per-player skip budget when a config doesn't set one (§4.6). */
export const DEFAULT_SKIP_BUDGET = 3;

/** The tier an Advance escalates into; null when already at the top. */
export function nextTier(tier: Tier): Tier | null {
  if (tier === "sweet") return "flirty";
  if (tier === "flirty") return "spicy";
  return null;
}

export function createSession(config: SessionConfig, now: number): GameState {
  const skips =
    config.skipsPerPlayer === undefined
      ? DEFAULT_SKIP_BUDGET
      : config.skipsPerPlayer;
  return {
    config,
    phase: "awaitRoll",
    players: [
      { name: config.playerNames[0], position: 0, skipsRemaining: skips },
      { name: config.playerNames[1], position: 0, skipsRemaining: skips },
    ],
    current: 0,
    lastRoll: null,
    activeCard: null,
    pendingDraw: null,
    pendingSnake: null,
    pendingExhaustion: null,
    usedPromptIds: { 1: [], 2: [], 3: [] },
    stats: {
      rolls: 0,
      cardsDrawn: 0,
      laddersClimbed: 0,
      snakesSlid: 0,
      snakesCharmed: 0,
      skipsUsed: 0,
      startedAt: now,
    },
    winner: null,
  };
}

/**
 * Fill fields that predate this build in a session restored from IndexedDB,
 * so mid-game saves survive app updates. Legacy players get the default
 * budget (their config never limited skips, and 3 is the friendly default).
 */
export function normalizeSession(state: GameState): GameState {
  const configured =
    state.config.skipsPerPlayer === undefined
      ? DEFAULT_SKIP_BUDGET
      : state.config.skipsPerPlayer;
  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      skipsRemaining:
        p.skipsRemaining === undefined ? configured : p.skipsRemaining,
    })) as GameState["players"],
    pendingExhaustion: state.pendingExhaustion ?? null,
    stats: { ...state.stats, skipsUsed: state.stats.skipsUsed ?? 0 },
  };
}

/**
 * Pure transition. All randomness (die value, drawn prompt) arrives inside
 * the event. When a card is needed the engine sets `state.pendingDraw`;
 * the caller resolves it against the prompt pool (draw.ts) and dispatches
 * CARD_DRAWN. Events that don't fit the current phase are ignored.
 */
export function applyEvent(
  preset: BoardPreset,
  state: GameState,
  event: GameEvent
): GameState {
  switch (event.type) {
    case "ROLLED":
      return state.phase === "awaitRoll"
        ? handleRoll(preset, state, event.value)
        : state;

    case "CARD_DRAWN": {
      if (
        state.phase !== "prompt" ||
        state.activeCard !== null ||
        !state.pendingDraw
      )
        return state;
      const card: ActiveCard = {
        prompt: event.prompt,
        reason: event.reason,
        from: state.pendingDraw,
      };
      return {
        ...state,
        activeCard: card,
        pendingDraw: null,
        pendingSnake: event.reason === "charm" ? null : state.pendingSnake,
        usedPromptIds: isPinnedPromptDraw(state, event.prompt, event.reason)
          ? state.usedPromptIds
          : trackUsed(state.usedPromptIds, event.prompt),
        stats: {
          ...state.stats,
          cardsDrawn: state.stats.cardsDrawn + 1,
          // Count the charm itself, not each redraw of its dare (a skip
          // redraws with reason "charm" but the snake is already settled).
          snakesCharmed:
            state.stats.snakesCharmed +
            (event.reason === "charm" && state.pendingSnake ? 1 : 0),
        },
      };
    }

    case "CARD_DONE": {
      if (state.phase !== "prompt" || state.activeCard === null) return state;
      return passTurn(state);
    }

    case "CARD_SKIP": {
      if (state.phase !== "prompt" || state.activeCard === null) return state;
      // A Pinned Prompt is its own tile — a redraw would hand back the same
      // pin. Pass (CARD_DONE) is the way to put it away; skip is a no-op here.
      if (
        isPinnedPromptDraw(
          state,
          state.activeCard.prompt,
          state.activeCard.reason
        )
      )
        return state;
      const remaining = state.players[state.current].skipsRemaining;
      if (remaining !== null && remaining <= 0) return state;
      const { prompt, reason, from } = state.activeCard;
      return {
        ...state,
        activeCard: null,
        // Redraw with the exact request the skipped card answered — same
        // zone, same reason, same preferred kind (a charm skip stays a dare).
        pendingDraw: from ?? {
          zone: prompt.zone,
          reason,
          preferKind: reason === "charm" ? "action" : undefined,
        },
        players: updatePlayer(state.players, state.current, (p) => ({
          ...p,
          skipsRemaining:
            p.skipsRemaining === null ? null : p.skipsRemaining - 1,
        })),
        stats: { ...state.stats, skipsUsed: state.stats.skipsUsed + 1 },
      };
    }

    case "SNAKE_ACCEPT": {
      if (state.phase !== "snakeChoice" || !state.pendingSnake) return state;
      return passTurn({
        ...state,
        players: movePlayer(
          state.players,
          state.current,
          state.pendingSnake.to
        ),
        pendingSnake: null,
        stats: { ...state.stats, snakesSlid: state.stats.snakesSlid + 1 },
      });
    }

    case "SNAKE_CHARM": {
      if (state.phase !== "snakeChoice" || !state.pendingSnake) return state;
      // Player stays on the snake head and takes a dare one zone up instead.
      const zone = Math.min(zoneOf(state.pendingSnake.from) + 1, 3) as Zone;
      return {
        ...state,
        phase: "prompt",
        pendingDraw: { zone, reason: "charm", preferKind: "action" },
      };
    }

    case "ZONE_EXHAUSTED": {
      // The caller resolves draws against the pool, so it also detects a dry
      // zone (draw.ts `needsExhaustionChoice`) and reports it with this event.
      if (
        state.phase !== "prompt" ||
        state.activeCard !== null ||
        !state.pendingDraw
      )
        return state;
      return {
        ...state,
        phase: "exhaustionChoice",
        pendingExhaustion: { zone: state.pendingDraw.zone },
      };
    }

    case "EXHAUSTION_STAY": {
      if (state.phase !== "exhaustionChoice" || !state.pendingExhaustion)
        return state;
      const { zone } = state.pendingExhaustion;
      const used = state.usedPromptIds[zone];
      const last = used[used.length - 1];
      return {
        ...state,
        phase: "prompt",
        pendingExhaustion: null,
        // True reshuffle: fresh no-repeat cycle, seeded with the most recent
        // card so the reshuffle can never show the same card back-to-back.
        usedPromptIds: {
          ...state.usedPromptIds,
          [zone]: last === undefined ? [] : [last],
        },
      };
    }

    case "EXHAUSTION_ADVANCE": {
      if (state.phase !== "exhaustionChoice" || !state.pendingExhaustion)
        return state;
      // Consent guard: exactly one tier up, never from spicy, never a jump.
      if (event.tier !== nextTier(state.config.tier)) return state;
      return {
        ...state,
        phase: "prompt",
        pendingExhaustion: null,
        config: { ...state.config, tier: event.tier, deckSlug: event.deckSlug },
        // A brand-new deck: every zone starts a fresh cycle.
        usedPromptIds: { 1: [], 2: [], 3: [] },
      };
    }
  }
}

function handleRoll(
  preset: BoardPreset,
  state: GameState,
  value: number
): GameState {
  const stats = { ...state.stats, rolls: state.stats.rolls + 1 };
  const from = state.players[state.current].position;
  // Overshoot lands on the final tile (no exact-roll rule — MVP simplification).
  const dest = Math.min(from + value, preset.size);
  const base = { ...state, lastRoll: value, stats };

  if (dest === preset.size) {
    return {
      ...base,
      players: movePlayer(state.players, state.current, dest),
      phase: "finished",
      winner: state.current,
    };
  }

  if (preset.snakes[dest] !== undefined) {
    return {
      ...base,
      players: movePlayer(state.players, state.current, dest),
      phase: "snakeChoice",
      pendingSnake: { from: dest, to: preset.snakes[dest] },
    };
  }

  if (preset.ladders[dest] !== undefined) {
    const top = preset.ladders[dest];
    const climbed = {
      ...base,
      players: movePlayer(state.players, state.current, top),
      stats: { ...stats, laddersClimbed: stats.laddersClimbed + 1 },
    };
    if (top === preset.size) {
      return { ...climbed, phase: "finished" as const, winner: state.current };
    }
    // Reward: a "closer" card from the zone you climbed into.
    return {
      ...climbed,
      phase: "prompt",
      pendingDraw: { zone: zoneOf(top), reason: "ladder" },
    };
  }

  const moved = {
    ...base,
    players: movePlayer(state.players, state.current, dest),
  };

  // A pin converts a Neutral Tile into a prompt tile — checked first so a
  // pinned card is never silently dropped by the breather rule.
  const pinned = state.config.tilePrompts?.[dest] !== undefined;
  if (!pinned && preset.neutralTiles.includes(dest)) {
    return passTurn(moved);
  }

  return {
    ...moved,
    phase: "prompt",
    pendingDraw: { zone: zoneOf(dest), reason: "tile" },
  };
}

/**
 * Was this card the tile's Pinned Prompt rather than a deck draw? Pinned
 * Prompts live outside the deck cycle: they may legitimately fire again on a
 * revisit and must never be mistaken for a reshuffle. Mirrors the pin check
 * in draw.ts (`resolveDraw`).
 */
function isPinnedPromptDraw(
  state: GameState,
  prompt: Prompt,
  reason: ActiveCard["reason"]
): boolean {
  if (reason !== "tile") return false;
  const tile = state.players[state.current].position;
  return state.config.tilePrompts?.[tile]?.id === prompt.id;
}

/**
 * A drawn card already on its zone's used list means the pool was exhausted
 * and draw.ts reshuffled — reset to a fresh no-repeat cycle seeded with this
 * card, so nothing repeats until the new pass is itself exhausted.
 */
function trackUsed(
  usedPromptIds: GameState["usedPromptIds"],
  prompt: Prompt
): GameState["usedPromptIds"] {
  const used = usedPromptIds[prompt.zone];
  return {
    ...usedPromptIds,
    [prompt.zone]: used.includes(prompt.id)
      ? [prompt.id]
      : [...used, prompt.id],
  };
}

function updatePlayer(
  players: GameState["players"],
  index: 0 | 1,
  update: (p: GameState["players"][0]) => GameState["players"][0]
): GameState["players"] {
  const next: GameState["players"] = [...players];
  next[index] = update(next[index]);
  return next;
}

function movePlayer(
  players: GameState["players"],
  index: 0 | 1,
  position: number
): GameState["players"] {
  return updatePlayer(players, index, (p) => ({ ...p, position }));
}

function passTurn(state: GameState): GameState {
  return {
    ...state,
    phase: "awaitRoll",
    current: state.current === 0 ? 1 : 0,
    activeCard: null,
    pendingDraw: null,
  };
}

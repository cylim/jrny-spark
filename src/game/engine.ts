import type {
  ActiveCard,
  BoardPreset,
  GameEvent,
  GameState,
  SessionConfig,
  Zone,
} from "./types";

export function zoneOf(tile: number): Zone {
  if (tile <= 33) return 1;
  if (tile <= 66) return 2;
  return 3;
}

export function createSession(config: SessionConfig, now: number): GameState {
  return {
    config,
    phase: "awaitRoll",
    players: [
      { name: config.playerNames[0], position: 0 },
      { name: config.playerNames[1], position: 0 },
    ],
    current: 0,
    lastRoll: null,
    activeCard: null,
    pendingDraw: null,
    pendingSnake: null,
    usedPromptIds: { 1: [], 2: [], 3: [] },
    stats: {
      rolls: 0,
      cardsDrawn: 0,
      laddersClimbed: 0,
      snakesSlid: 0,
      snakesCharmed: 0,
      startedAt: now,
    },
    winner: null,
  };
}

/**
 * Pure transition. All randomness (die value, drawn prompt) arrives inside
 * the event. When a card is needed the engine sets `state.pendingDraw`;
 * the caller resolves it against the prompt pool (draw.ts) and dispatches
 * CARD_DRAWN. Events that don't fit the current phase are ignored.
 */
export function applyEvent(preset: BoardPreset, state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case "ROLLED":
      return state.phase === "awaitRoll" ? handleRoll(preset, state, event.value) : state;

    case "CARD_DRAWN": {
      if (state.phase !== "prompt" || state.activeCard !== null || !state.pendingDraw) return state;
      const card: ActiveCard = { prompt: event.prompt, reason: event.reason };
      return {
        ...state,
        activeCard: card,
        pendingDraw: null,
        pendingSnake: event.reason === "charm" ? null : state.pendingSnake,
        usedPromptIds: {
          ...state.usedPromptIds,
          [event.prompt.zone]: [...state.usedPromptIds[event.prompt.zone], event.prompt.id],
        },
        stats: {
          ...state.stats,
          cardsDrawn: state.stats.cardsDrawn + 1,
          snakesCharmed: state.stats.snakesCharmed + (event.reason === "charm" ? 1 : 0),
        },
      };
    }

    case "CARD_DONE": {
      if (state.phase !== "prompt" || state.activeCard === null) return state;
      return passTurn(state);
    }

    case "SNAKE_ACCEPT": {
      if (state.phase !== "snakeChoice" || !state.pendingSnake) return state;
      return passTurn({
        ...state,
        players: movePlayer(state.players, state.current, state.pendingSnake.to),
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
  }
}

function handleRoll(preset: BoardPreset, state: GameState, value: number): GameState {
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

  const moved = { ...base, players: movePlayer(state.players, state.current, dest) };

  if (preset.neutralTiles.includes(dest)) {
    return passTurn(moved);
  }

  return { ...moved, phase: "prompt", pendingDraw: { zone: zoneOf(dest), reason: "tile" } };
}

function movePlayer(
  players: GameState["players"],
  index: 0 | 1,
  position: number,
): GameState["players"] {
  const next: GameState["players"] = [...players];
  next[index] = { ...next[index], position };
  return next;
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

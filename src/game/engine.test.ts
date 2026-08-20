import { describe, expect, it } from "vitest";
import { applyEvent, createSession } from "./engine";
import { resolveDraw } from "./draw";
import { seededRng } from "./rng";
import { CLASSIC } from "./board-presets";
import type {
  BoardPreset,
  GameEvent,
  GameState,
  Prompt,
  PromptKind,
  SessionConfig,
  Zone,
} from "./types";

const config = (over?: Partial<SessionConfig>): SessionConfig => ({
  tier: "sweet",
  deckSlug: "demo",
  playerNames: ["Ava", "Bo"],
  boardPresetId: "classic",
  ...over,
});

const session = (over?: Partial<SessionConfig>): GameState => createSession(config(over), 0);

/** Same session but with players teleported — for starting a scenario mid-board. */
const at = (state: GameState, p0: number, p1 = 0): GameState => ({
  ...state,
  players: [
    { ...state.players[0], position: p0 },
    { ...state.players[1], position: p1 },
  ],
});

const run = (preset: BoardPreset, state: GameState, events: GameEvent[]): GameState =>
  events.reduce((s, e) => applyEvent(preset, s, e), state);

const prompt = (id: string, zone: Zone, kind: PromptKind = "question"): Prompt => ({
  id,
  zone,
  kind,
  text: id,
});

describe("settled rules (regression locks)", () => {
  it("overshoot lands on the final tile and wins", () => {
    const state = run(CLASSIC, at(session(), 97), [{ type: "ROLLED", value: 6 }]);
    expect(state.players[0].position).toBe(100);
    expect(state.phase).toBe("finished");
    expect(state.winner).toBe(0);
  });

  it("charm from a zone-1 snake head draws one zone up", () => {
    // CLASSIC snake 17 → 7; tile 17 is zone 1.
    const state = run(CLASSIC, at(session(), 12), [
      { type: "ROLLED", value: 5 },
      { type: "SNAKE_CHARM" },
    ]);
    expect(state.phase).toBe("prompt");
    expect(state.pendingDraw).toEqual({ zone: 2, reason: "charm", preferKind: "action" });
  });

  it("charm from a zone-3 snake head clamps at Close (zone 3)", () => {
    // CLASSIC snake 95 → 73; tile 95 is zone 3 — no zone 4 to escalate into.
    const state = run(CLASSIC, at(session(), 90), [
      { type: "ROLLED", value: 5 },
      { type: "SNAKE_CHARM" },
    ]);
    expect(state.pendingDraw?.zone).toBe(3);
  });

  it("completing (or passing) the charm card keeps the stay-put", () => {
    const state = run(CLASSIC, at(session(), 12), [
      { type: "ROLLED", value: 5 }, // land on snake head 17
      { type: "SNAKE_CHARM" },
      { type: "CARD_DRAWN", prompt: prompt("dare-1", 2, "action"), reason: "charm" },
      { type: "CARD_DONE" }, // pass uses this same event — deliberately indistinguishable
    ]);
    expect(state.players[0].position).toBe(17); // still on the head, never slid
    expect(state.pendingSnake).toBeNull();
    expect(state.phase).toBe("awaitRoll");
    expect(state.current).toBe(1);
    expect(state.stats.snakesSlid).toBe(0);
    expect(state.stats.snakesCharmed).toBe(1);
  });

  it("a snake tail on a ladder foot is inert — the slide doesn't chain into a climb", () => {
    const board: BoardPreset = {
      id: "chained",
      size: 100,
      snakes: { 30: 8 },
      ladders: { 8: 20 },
      neutralTiles: [],
    };
    const state = run(board, at(session(), 27), [
      { type: "ROLLED", value: 3 }, // land on snake head 30
      { type: "SNAKE_ACCEPT" },
    ]);
    expect(state.players[0].position).toBe(8); // slid to the tail, not climbed to 20
    expect(state.phase).toBe("awaitRoll");
    expect(state.current).toBe(1);
  });

  it("a neutral tile without a pin stays a breather — no draw, turn passes", () => {
    // CLASSIC tile 5 is neutral.
    const state = run(CLASSIC, at(session(), 2), [{ type: "ROLLED", value: 3 }]);
    expect(state.players[0].position).toBe(5);
    expect(state.phase).toBe("awaitRoll");
    expect(state.pendingDraw).toBeNull();
    expect(state.current).toBe(1);
  });

  it("a ladder top on a snake head is inert — the climb doesn't chain into a slide", () => {
    const board: BoardPreset = {
      id: "chained",
      size: 100,
      snakes: { 40: 10 },
      ladders: { 5: 40 },
      neutralTiles: [],
    };
    const state = run(board, at(session(), 2), [{ type: "ROLLED", value: 3 }]);
    expect(state.players[0].position).toBe(40); // climbed to the top, not slid to 10
    expect(state.pendingSnake).toBeNull();
    expect(state.phase).toBe("prompt");
    expect(state.pendingDraw).toEqual({ zone: 2, reason: "ladder" });
  });
});

/** Featureless board: every landing is a plain tile draw — one draw per roll. */
const CORRIDOR: BoardPreset = {
  id: "corridor",
  size: 999,
  snakes: {},
  ladders: {},
  neutralTiles: [],
};

/** Roll → resolve the requested card → done, `draws` times; returns drawn ids. */
function playDraws(
  start: GameState,
  pool: Prompt[],
  draws: number,
  rng: () => number,
): { ids: string[]; final: GameState } {
  let state = start;
  const ids: string[] = [];
  for (let i = 0; i < draws; i++) {
    state = applyEvent(CORRIDOR, state, { type: "ROLLED", value: 1 });
    const drawn = resolveDraw(state, pool, rng);
    if (!drawn) throw new Error(`pool came up empty on draw ${i + 1}`);
    ids.push(drawn.id);
    state = applyEvent(CORRIDOR, state, { type: "CARD_DRAWN", prompt: drawn, reason: "tile" });
    state = applyEvent(CORRIDOR, state, { type: "CARD_DONE" });
  }
  return { ids, final: state };
}

describe("pinned prompts", () => {
  it("a pin converts a neutral tile — the pinned card is shown on landing", () => {
    // CLASSIC tile 5 is neutral; a pin there must fire instead of the breather.
    const pin = prompt("pin-5", 1, "together");
    const start = at(session({ tilePrompts: { 5: pin } }), 2);

    const landed = run(CLASSIC, start, [{ type: "ROLLED", value: 3 }]);
    expect(landed.players[0].position).toBe(5);
    expect(landed.phase).toBe("prompt");
    expect(landed.pendingDraw).toEqual({ zone: 1, reason: "tile" });

    const drawn = resolveDraw(landed, [prompt("deck-1", 1)], seededRng(1));
    expect(drawn).toEqual(pin);

    const shown = run(CLASSIC, landed, [{ type: "CARD_DRAWN", prompt: pin, reason: "tile" }]);
    expect(shown.activeCard?.prompt).toEqual(pin);
  });

  it("pins stay outside the deck cycle — untracked, refiring, never resetting it", () => {
    const pin = prompt("pin-3", 1, "action");
    const pool = [prompt("a", 1), prompt("b", 1), prompt("c", 1)];
    const rng = seededRng(5);
    let state = session({ tilePrompts: { 3: pin } });

    // Player 0 lands on the pin.
    state = run(CORRIDOR, state, [{ type: "ROLLED", value: 3 }]);
    expect(resolveDraw(state, pool, rng)).toEqual(pin);
    state = run(CORRIDOR, state, [
      { type: "CARD_DRAWN", prompt: pin, reason: "tile" },
      { type: "CARD_DONE" },
    ]);
    expect(state.usedPromptIds[1]).toEqual([]); // pin not on the cycle

    // Two ordinary deck draws (player 1 to tile 1, player 0 to tile 4).
    for (const value of [1, 1]) {
      state = run(CORRIDOR, state, [{ type: "ROLLED", value }]);
      const drawn = resolveDraw(state, pool, rng);
      if (!drawn) throw new Error("pool came up empty");
      state = run(CORRIDOR, state, [
        { type: "CARD_DRAWN", prompt: drawn, reason: "tile" },
        { type: "CARD_DONE" },
      ]);
    }
    const cycleSoFar = state.usedPromptIds[1];
    expect(cycleSoFar).toHaveLength(2);

    // Player 1 revisits the pinned tile: the pin fires again and the
    // in-progress no-repeat cycle survives untouched.
    state = run(CORRIDOR, state, [{ type: "ROLLED", value: 2 }]);
    expect(state.players[1].position).toBe(3);
    expect(resolveDraw(state, pool, rng)).toEqual(pin);
    state = run(CORRIDOR, state, [{ type: "CARD_DRAWN", prompt: pin, reason: "tile" }]);
    expect(state.usedPromptIds[1]).toEqual(cycleSoFar);
  });
});

describe("true reshuffle", () => {
  const pool = [prompt("a", 1), prompt("b", 1), prompt("c", 1)];

  it("an exhausted zone starts a fresh no-repeat cycle instead of allowing repeats", () => {
    for (const seed of [1, 7, 42, 1234]) {
      const { ids, final } = playDraws(session(), pool, 9, seededRng(seed));

      // Each pass through the 3-card zone is itself repeat-free…
      for (const cycle of [ids.slice(0, 3), ids.slice(3, 6), ids.slice(6, 9)]) {
        expect(new Set(cycle).size).toBe(3);
      }
      // …and no card ever shows twice in a row, even across the reshuffle.
      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).not.toBe(ids[i - 1]);
      }
      // The used-card list was reset at each exhaustion, not grown forever.
      expect(final.usedPromptIds[1]).toHaveLength(3);
    }
  });
});

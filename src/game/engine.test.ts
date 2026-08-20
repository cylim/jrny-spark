import { describe, expect, it } from "vitest";
import { applyEvent, createSession, normalizeSession } from "./engine";
import { needsExhaustionChoice, resolveDraw } from "./draw";
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

const session = (over?: Partial<SessionConfig>): GameState =>
  createSession(config(over), 0);

/** Same session but with players teleported — for starting a scenario mid-board. */
const at = (state: GameState, p0: number, p1 = 0): GameState => ({
  ...state,
  players: [
    { ...state.players[0], position: p0 },
    { ...state.players[1], position: p1 },
  ],
});

const run = (
  preset: BoardPreset,
  state: GameState,
  events: GameEvent[]
): GameState => events.reduce((s, e) => applyEvent(preset, s, e), state);

const prompt = (
  id: string,
  zone: Zone,
  kind: PromptKind = "question"
): Prompt => ({
  id,
  zone,
  kind,
  text: id,
});

describe("settled rules (regression locks)", () => {
  it("overshoot lands on the final tile and wins", () => {
    const state = run(CLASSIC, at(session(), 97), [
      { type: "ROLLED", value: 6 },
    ]);
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
    expect(state.pendingDraw).toEqual({
      zone: 2,
      reason: "charm",
      preferKind: "action",
    });
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
      {
        type: "CARD_DRAWN",
        prompt: prompt("dare-1", 2, "action"),
        reason: "charm",
      },
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
    const state = run(CLASSIC, at(session(), 2), [
      { type: "ROLLED", value: 3 },
    ]);
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
  rng: () => number
): { ids: string[]; final: GameState } {
  let state = start;
  const ids: string[] = [];
  for (let i = 0; i < draws; i++) {
    state = applyEvent(CORRIDOR, state, { type: "ROLLED", value: 1 });
    const drawn = resolveDraw(state, pool, rng);
    if (!drawn) throw new Error(`pool came up empty on draw ${i + 1}`);
    ids.push(drawn.id);
    state = applyEvent(CORRIDOR, state, {
      type: "CARD_DRAWN",
      prompt: drawn,
      reason: "tile",
    });
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

    const shown = run(CLASSIC, landed, [
      { type: "CARD_DRAWN", prompt: pin, reason: "tile" },
    ]);
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
    state = run(CORRIDOR, state, [
      { type: "CARD_DRAWN", prompt: pin, reason: "tile" },
    ]);
    expect(state.usedPromptIds[1]).toEqual(cycleSoFar);
  });
});

describe("skip & pass", () => {
  it("defaults both players to a budget of 3 when the config doesn't set one", () => {
    const state = session();
    expect(state.players[0].skipsRemaining).toBe(3);
    expect(state.players[1].skipsRemaining).toBe(3);
  });

  it("skip discards the card, redraws from the same zone, and decrements only the acting player", () => {
    let state = run(CORRIDOR, session(), [
      { type: "ROLLED", value: 1 },
      { type: "CARD_DRAWN", prompt: prompt("p1", 1), reason: "tile" },
      { type: "CARD_SKIP" },
    ]);
    expect(state.phase).toBe("prompt");
    expect(state.activeCard).toBeNull();
    expect(state.pendingDraw).toEqual({
      zone: 1,
      reason: "tile",
      preferKind: undefined,
    });
    expect(state.players[0].skipsRemaining).toBe(2);
    expect(state.players[1].skipsRemaining).toBe(3);
    expect(state.stats.skipsUsed).toBe(1);

    // The skipped card stays on the used list — it can't bounce right back.
    state = applyEvent(CORRIDOR, state, {
      type: "CARD_DRAWN",
      prompt: prompt("p2", 1),
      reason: "tile",
    });
    expect(state.usedPromptIds[1]).toEqual(["p1", "p2"]);
  });

  it("a skipped charm card redraws dare-flavored from the raised zone; the stay-put holds", () => {
    let state = run(CLASSIC, at(session(), 12), [
      { type: "ROLLED", value: 5 }, // snake head 17 (zone 1)
      { type: "SNAKE_CHARM" },
      {
        type: "CARD_DRAWN",
        prompt: prompt("dare-1", 2, "action"),
        reason: "charm",
      },
      { type: "CARD_SKIP" },
    ]);
    expect(state.pendingDraw).toEqual({
      zone: 2,
      reason: "charm",
      preferKind: "action",
    });
    expect(state.players[0].position).toBe(17); // never slid
    expect(state.pendingSnake).toBeNull();

    state = run(CLASSIC, state, [
      {
        type: "CARD_DRAWN",
        prompt: prompt("dare-2", 2, "action"),
        reason: "charm",
      },
      { type: "CARD_DONE" },
    ]);
    expect(state.players[0].position).toBe(17);
    expect(state.stats.snakesCharmed).toBe(1); // one charm, however many redraws
    expect(state.stats.snakesSlid).toBe(0);
  });

  it("at zero budget the skip is ignored but pass (CARD_DONE) still works", () => {
    const drawn = run(CORRIDOR, session({ skipsPerPlayer: 0 }), [
      { type: "ROLLED", value: 1 },
      { type: "CARD_DRAWN", prompt: prompt("p1", 1), reason: "tile" },
    ]);
    expect(drawn.players[0].skipsRemaining).toBe(0);

    const skipped = applyEvent(CORRIDOR, drawn, { type: "CARD_SKIP" });
    expect(skipped).toBe(drawn); // untouched — no discard, no decrement

    const passed = applyEvent(CORRIDOR, drawn, { type: "CARD_DONE" });
    expect(passed.phase).toBe("awaitRoll");
    expect(passed.current).toBe(1);
  });

  it("an unlimited budget (null) skips freely and never decrements", () => {
    const state = run(CORRIDOR, session({ skipsPerPlayer: null }), [
      { type: "ROLLED", value: 1 },
      { type: "CARD_DRAWN", prompt: prompt("p1", 1), reason: "tile" },
      { type: "CARD_SKIP" },
    ]);
    expect(state.players[0].skipsRemaining).toBeNull();
    expect(state.stats.skipsUsed).toBe(1);
    expect(state.pendingDraw).toEqual({
      zone: 1,
      reason: "tile",
      preferKind: undefined,
    });
  });

  it("a pinned card can't be skipped (the redraw would return the same pin) — pass covers it", () => {
    const pin = prompt("pin-3", 1, "together");
    const drawn = run(CORRIDOR, session({ tilePrompts: { 3: pin } }), [
      { type: "ROLLED", value: 3 },
      { type: "CARD_DRAWN", prompt: pin, reason: "tile" },
    ]);
    expect(applyEvent(CORRIDOR, drawn, { type: "CARD_SKIP" })).toBe(drawn);
  });

  it("remaining skips survive serialization, and legacy sessions normalize to the default", () => {
    const state = run(CORRIDOR, session(), [
      { type: "ROLLED", value: 1 },
      { type: "CARD_DRAWN", prompt: prompt("p1", 1), reason: "tile" },
      { type: "CARD_SKIP" },
    ]);
    expect(normalizeSession(JSON.parse(JSON.stringify(state)))).toEqual(state);

    // A session persisted before skips existed: strip the new fields.
    const legacy = JSON.parse(JSON.stringify(session())) as Record<
      string,
      unknown
    >;
    delete legacy.pendingExhaustion;
    delete (legacy.stats as Record<string, unknown>).skipsUsed;
    for (const p of legacy.players as Array<Record<string, unknown>>)
      delete p.skipsRemaining;
    const restored = normalizeSession(legacy as unknown as GameState);
    expect(restored.players[0].skipsRemaining).toBe(3);
    expect(restored.stats.skipsUsed).toBe(0);
    expect(restored.pendingExhaustion).toBeNull();
  });
});

describe("zone exhaustion: stay / advance", () => {
  const pool = [prompt("a", 1), prompt("b", 1), prompt("c", 1)];

  /** Drain zone 1 of `pool`, ending on a roll that wants one more card. */
  const drained = () => {
    const { final } = playDraws(session(), pool, 3, seededRng(9));
    return applyEvent(CORRIDOR, final, { type: "ROLLED", value: 1 });
  };

  it("an exhausted zone surfaces the choice instead of resolving the draw", () => {
    const state = drained();
    expect(needsExhaustionChoice(state, pool)).toBe(true);

    const choice = applyEvent(CORRIDOR, state, { type: "ZONE_EXHAUSTED" });
    expect(choice.phase).toBe("exhaustionChoice");
    expect(choice.pendingExhaustion).toEqual({ zone: 1 });
    expect(choice.pendingDraw).toEqual({
      zone: 1,
      reason: "tile",
      preferKind: undefined,
    });
  });

  it("a zone with unused cards is not exhausted, and a pinned tile draw never is", () => {
    const fresh = applyEvent(CORRIDOR, session(), { type: "ROLLED", value: 1 });
    expect(needsExhaustionChoice(fresh, pool)).toBe(false);

    // Engine-side guards: no pending draw, or a card already on screen.
    expect(applyEvent(CORRIDOR, session(), { type: "ZONE_EXHAUSTED" })).toEqual(
      session()
    );
    const showing = applyEvent(CORRIDOR, fresh, {
      type: "CARD_DRAWN",
      prompt: prompt("a", 1),
      reason: "tile",
    });
    expect(applyEvent(CORRIDOR, showing, { type: "ZONE_EXHAUSTED" })).toBe(
      showing
    );

    // Pin on the landed tile: the pin resolves the draw, dry pool or not.
    const pin = prompt("pin-20", 1);
    const { final } = playDraws(
      session({ tilePrompts: { 20: pin } }),
      pool,
      3,
      seededRng(9)
    );
    const beforePin = at(final, final.players[0].position, 19);
    const pinned = applyEvent(CORRIDOR, beforePin, {
      type: "ROLLED",
      value: 1,
    });
    expect(pinned.players[1].position).toBe(20);
    expect(pinned.pendingDraw).toEqual({
      zone: 1,
      reason: "tile",
      preferKind: undefined,
    });
    expect(needsExhaustionChoice(pinned, pool)).toBe(false);
  });

  it("stay reshuffles the zone: fresh cycle, never the last card back-to-back", () => {
    const choice = applyEvent(CORRIDOR, drained(), { type: "ZONE_EXHAUSTED" });
    const last = choice.usedPromptIds[1][choice.usedPromptIds[1].length - 1];

    const stayed = applyEvent(CORRIDOR, choice, { type: "EXHAUSTION_STAY" });
    expect(stayed.phase).toBe("prompt");
    expect(stayed.pendingExhaustion).toBeNull();
    expect(stayed.pendingDraw).toEqual({
      zone: 1,
      reason: "tile",
      preferKind: undefined,
    });
    expect(stayed.usedPromptIds[1]).toEqual([last]); // fresh cycle, back-to-back blocked
    expect(needsExhaustionChoice(stayed, pool)).toBe(false);
    for (const seed of [1, 7, 42]) {
      expect(resolveDraw(stayed, pool, seededRng(seed))?.id).not.toBe(last);
    }
  });

  it("advance swaps to the exact next tier's deck at the same position", () => {
    const choice = applyEvent(CORRIDOR, drained(), { type: "ZONE_EXHAUSTED" });
    const position = choice.players[choice.current].position;

    const advanced = applyEvent(CORRIDOR, choice, {
      type: "EXHAUSTION_ADVANCE",
      tier: "flirty",
      deckSlug: "starter-flirty",
    });
    expect(advanced.config.tier).toBe("flirty");
    expect(advanced.config.deckSlug).toBe("starter-flirty");
    expect(advanced.players[advanced.current].position).toBe(position);
    expect(advanced.phase).toBe("prompt");
    expect(advanced.pendingExhaustion).toBeNull();
    expect(advanced.pendingDraw).toEqual({
      zone: 1,
      reason: "tile",
      preferKind: undefined,
    });
    expect(advanced.usedPromptIds).toEqual({ 1: [], 2: [], 3: [] }); // new deck, new cycles
  });

  it("advance never skips a tier and is refused entirely at spicy", () => {
    const choice = applyEvent(CORRIDOR, drained(), { type: "ZONE_EXHAUSTED" });
    expect(
      applyEvent(CORRIDOR, choice, {
        type: "EXHAUSTION_ADVANCE",
        tier: "spicy",
        deckSlug: "starter-spicy",
      })
    ).toBe(choice);

    const spicy = applyEvent(
      CORRIDOR,
      applyEvent(
        CORRIDOR,
        { ...drained(), config: config({ tier: "spicy" }) } as GameState,
        {
          type: "ZONE_EXHAUSTED",
        }
      ),
      { type: "EXHAUSTION_ADVANCE", tier: "spicy", deckSlug: "starter-spicy" }
    );
    expect(spicy.config.tier).toBe("spicy");
    expect(spicy.phase).toBe("exhaustionChoice"); // still waiting — advance refused
  });

  it("a pending choice survives reload", () => {
    const choice = applyEvent(CORRIDOR, drained(), { type: "ZONE_EXHAUSTED" });
    const restored = normalizeSession(JSON.parse(JSON.stringify(choice)));
    expect(restored).toEqual(choice);
    expect(restored.pendingExhaustion).toEqual({ zone: 1 });
    expect(restored.phase).toBe("exhaustionChoice");
  });

  it("skipping the zone's last unused card runs the redraw into the choice", () => {
    const twoCards = [prompt("a", 1), prompt("b", 1)];
    let state = playDraws(session(), twoCards, 1, seededRng(3)).final;
    const remaining = twoCards.find(
      (p) => !state.usedPromptIds[1].includes(p.id)
    )!;
    state = run(CORRIDOR, state, [
      { type: "ROLLED", value: 1 },
      { type: "CARD_DRAWN", prompt: remaining, reason: "tile" },
      { type: "CARD_SKIP" },
    ]);
    expect(state.pendingDraw).toEqual({
      zone: 1,
      reason: "tile",
      preferKind: undefined,
    });
    expect(needsExhaustionChoice(state, twoCards)).toBe(true);
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

// Board-tuning simulator (PRD §10.2): plays full games through the real
// engine with seeded RNG and reports session-length stats.
// Run: bun scripts/simulate.ts [games]
import { applyEvent, createSession } from "../src/game/engine";
import { resolveDraw } from "../src/game/draw";
import { CLASSIC } from "../src/game/board-presets";
import { rollDie, seededRng } from "../src/game/rng";
import { DEMO_PROMPTS } from "../src/game/demo-deck";
import type { GameState } from "../src/game/types";

const GAMES = Number(process.argv[2] ?? 2000);
const SECONDS_PER_CARD = 50; // rough authoring target: prompts resolvable in <2 min, most ~45-60s
const SECONDS_PER_TURN = 8; // roll + move + phone pass

const results: Array<{ rolls: number; cards: number; charms: number }> = [];

for (let g = 0; g < GAMES; g++) {
  const rng = seededRng(1000 + g);
  let state: GameState = createSession(
    { tier: "sweet", deckSlug: "demo", playerNames: ["A", "B"], boardPresetId: "classic" },
    0,
  );
  let guard = 0;
  while (state.phase !== "finished" && guard++ < 2000) {
    if (state.phase === "awaitRoll") {
      state = applyEvent(CLASSIC, state, { type: "ROLLED", value: rollDie(rng) });
    } else if (state.phase === "snakeChoice") {
      // players charm ~half the time
      state = applyEvent(CLASSIC, state, { type: rng() < 0.5 ? "SNAKE_CHARM" : "SNAKE_ACCEPT" });
    } else if (state.phase === "prompt") {
      if (state.pendingDraw) {
        const prompt = resolveDraw(state, DEMO_PROMPTS, rng);
        if (!prompt) throw new Error(`game ${g}: draw failed with pendingDraw set`);
        state = applyEvent(CLASSIC, state, { type: "CARD_DRAWN", prompt, reason: state.pendingDraw.reason });
      } else {
        state = applyEvent(CLASSIC, state, { type: "CARD_DONE" });
      }
    }
  }
  if (state.phase !== "finished") throw new Error(`game ${g}: did not terminate (dead end?)`);
  results.push({
    rolls: state.stats.rolls,
    cards: state.stats.cardsDrawn,
    charms: state.stats.snakesCharmed,
  });
}

const sorted = (key: "rolls" | "cards") => results.map((r) => r[key]).sort((a, b) => a - b);
const pct = (arr: number[], p: number) => arr[Math.floor((arr.length - 1) * p)];
const cards = sorted("cards");
const rolls = sorted("rolls");
const minutes = (i: number) =>
  Math.round((cards[i] * SECONDS_PER_CARD + rolls[i] * SECONDS_PER_TURN) / 60);

console.log(`${GAMES} games — all terminated ✓`);
console.log(`rolls   p10/p50/p90: ${pct(rolls, 0.1)} / ${pct(rolls, 0.5)} / ${pct(rolls, 0.9)}`);
console.log(`cards   p10/p50/p90: ${pct(cards, 0.1)} / ${pct(cards, 0.5)} / ${pct(cards, 0.9)}`);
console.log(
  `est. session minutes p10/p50/p90: ${minutes(Math.floor(cards.length * 0.1))} / ${minutes(Math.floor(cards.length * 0.5))} / ${minutes(Math.floor(cards.length * 0.9))}`,
);
console.log(`(target: median 15–30 min, PRD §2.3 — tune board/neutral density if outside)`);

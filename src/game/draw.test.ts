import { describe, expect, it } from "vitest";
import { drawPrompt } from "./draw";
import type { Prompt, PromptKind, Zone } from "./types";

const prompt = (id: string, zone: Zone, kind: PromptKind = "question"): Prompt => ({
  id,
  zone,
  kind,
  text: id,
});

const ZONE1 = [prompt("a", 1), prompt("b", 1), prompt("c", 1)];

/** Sweep of constant RNGs — covers every candidate index deterministically. */
const SWEEP = [0, 0.2, 0.4, 0.6, 0.8, 0.99].map((r) => () => r);

describe("drawPrompt", () => {
  it("never repeats a card while the zone still has unused ones", () => {
    for (const rng of SWEEP) {
      const drawn = drawPrompt(ZONE1, 1, ["a"], rng);
      expect(drawn?.id).not.toBe("a");
    }
  });

  it("reshuffles an exhausted zone without repeating the last card back-to-back", () => {
    // All of zone 1 used, "c" drawn most recently — the fresh pass may reuse
    // "a" and "b" but must never show "c" twice in a row.
    for (const rng of SWEEP) {
      const drawn = drawPrompt(ZONE1, 1, ["a", "b", "c"], rng);
      expect(drawn).not.toBeNull();
      expect(drawn?.id).not.toBe("c");
    }
  });

  it("repeats the card only when the zone holds a single prompt", () => {
    const solo = [prompt("only", 2)];
    for (const rng of SWEEP) {
      expect(drawPrompt(solo, 2, ["only"], rng)?.id).toBe("only");
    }
  });
});

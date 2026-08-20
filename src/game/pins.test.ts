import { describe, expect, it } from "vitest";
import { canPinTile, pinRejection } from "./pins";
import { CLASSIC } from "./board-presets";

describe("builder pin validation", () => {
  it("rejects snake heads — the slide would consume the landing", () => {
    expect(pinRejection(CLASSIC, 17)).toBe("snake-head");
    expect(pinRejection(CLASSIC, 98)).toBe("snake-head");
    expect(canPinTile(CLASSIC, 17)).toBe(false);
  });

  it("rejects ladder feet — the climb would consume the landing", () => {
    expect(pinRejection(CLASSIC, 3)).toBe("ladder-foot");
    expect(pinRejection(CLASSIC, 80)).toBe("ladder-foot");
    expect(canPinTile(CLASSIC, 3)).toBe(false);
  });

  it("rejects the finish tile — landing there ends the game", () => {
    expect(pinRejection(CLASSIC, 100)).toBe("finish");
    expect(canPinTile(CLASSIC, 100)).toBe(false);
  });

  it("rejects tiles outside the board", () => {
    expect(pinRejection(CLASSIC, 0)).toBe("out-of-range");
    expect(pinRejection(CLASSIC, -4)).toBe("out-of-range");
    expect(pinRejection(CLASSIC, 101)).toBe("out-of-range");
    expect(pinRejection(CLASSIC, 7.5)).toBe("out-of-range");
  });

  it("allows every other tile 1–99, including snake tails, ladder tops, and neutrals", () => {
    for (const tile of [1, 2, 5, 7, 22, 99]) {
      expect(pinRejection(CLASSIC, tile)).toBeNull();
      expect(canPinTile(CLASSIC, tile)).toBe(true);
    }
  });

  it("allows exactly the tiles that are neither heads, feet, nor finish across the whole board", () => {
    for (let tile = 1; tile < CLASSIC.size; tile++) {
      const special = CLASSIC.snakes[tile] !== undefined || CLASSIC.ladders[tile] !== undefined;
      expect(canPinTile(CLASSIC, tile)).toBe(!special);
    }
  });
});

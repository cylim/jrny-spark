import type { BoardPreset } from "./types";

/**
 * Classic 10×10 board, tuned for a 15–30 min two-player session:
 * 8 ladders, 8 snakes, 20% neutral breather tiles
 * (scripts/simulate.ts: median ≈ 27 min, p10 ≈ 18, p90 ≈ 39).
 *
 * Invariants (keep when editing — scripts/simulate.ts will throw on dead ends):
 * - snake heads, snake tails, ladder feet and ladder tops never chain
 *   (a slide/climb always resolves in a single hop)
 * - neutral tiles never sit on a snake head or ladder foot
 */
export const CLASSIC: BoardPreset = {
  id: "classic",
  size: 100,
  ladders: {
    3: 22,
    8: 30,
    28: 46,
    36: 57,
    43: 62,
    58: 77,
    71: 92,
    80: 99,
  },
  snakes: {
    17: 7,
    34: 12,
    50: 31,
    63: 41,
    74: 52,
    88: 67,
    95: 73,
    98: 79,
  },
  neutralTiles: [5, 11, 15, 19, 23, 25, 33, 38, 40, 45, 48, 55, 61, 66, 69, 76, 83, 85, 90, 96],
};

export const BOARD_PRESETS: Record<string, BoardPreset> = {
  classic: CLASSIC,
};

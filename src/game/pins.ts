import type { BoardPreset } from "./types";

/** Why a tile can't hold a pin — null means the pin is allowed. */
export type PinRejection = "out-of-range" | "snake-head" | "ladder-foot" | "finish";

/**
 * Pins fire only on plain tile landings, so tiles whose landing is consumed
 * by an effect can never show one: snake heads slide, ladder feet climb, and
 * the finish tile ends the game. Everything else on 1..size-1 is pinnable —
 * snake tails and ladder tops included, since transports never re-trigger.
 */
export function pinRejection(preset: BoardPreset, tile: number): PinRejection | null {
  if (!Number.isInteger(tile) || tile < 1 || tile > preset.size) return "out-of-range";
  if (tile === preset.size) return "finish";
  if (preset.snakes[tile] !== undefined) return "snake-head";
  if (preset.ladders[tile] !== undefined) return "ladder-foot";
  return null;
}

export function canPinTile(preset: BoardPreset, tile: number): boolean {
  return pinRejection(preset, tile) === null;
}

/** Returns a float in [0, 1). Injectable so the engine stays testable/replayable. */
export type Rng = () => number;

export const defaultRng: Rng = () => Math.random();

/** Deterministic mulberry32 — used in tests and (later) seeded replays. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rollDie(rng: Rng = defaultRng): number {
  return 1 + Math.floor(rng() * 6);
}

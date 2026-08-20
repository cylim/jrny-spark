export type Tier = "sweet" | "flirty" | "spicy";
export type Zone = 1 | 2 | 3;
export type PromptKind = "question" | "action" | "together";

export interface Prompt {
  id: string;
  zone: Zone;
  kind: PromptKind;
  text: string;
  props?: boolean;
}

/** Snakes map head → tail; ladders map foot → top. Keys never overlap. */
export interface BoardPreset {
  id: string;
  size: number;
  snakes: Record<number, number>;
  ladders: Record<number, number>;
  /** Tiles with no card draw — breathers. */
  neutralTiles: number[];
}

export interface PlayerState {
  name: string;
  position: number; // 0 = off-board start
  /** Budgeted redraws left; null = unlimited (§4.6). */
  skipsRemaining: number | null;
}

export interface SessionConfig {
  tier: Tier;
  deckSlug: string;
  playerNames: [string, string];
  boardPresetId: string;
  /** Fixed prompts on specific tiles from a Game Template; trump deck draws. */
  tilePrompts?: Record<number, Prompt>;
  /** Per-player skip budget; null = unlimited, absent = the default (3). */
  skipsPerPlayer?: number | null;
}

export interface SessionStats {
  rolls: number;
  cardsDrawn: number;
  laddersClimbed: number;
  snakesSlid: number;
  snakesCharmed: number;
  skipsUsed: number;
  startedAt: number;
}

export type Phase =
  | "awaitRoll" // current player may roll
  | "prompt" // a card is on screen, waiting for CARD_DONE
  | "snakeChoice" // landed on a snake head: accept slide or charm
  | "exhaustionChoice" // the active zone ran dry: stay (reshuffle) or advance
  | "finished";

/**
 * The card currently on screen and why it was drawn.
 * reason "ladder"  → the "closer" reward card after climbing.
 * reason "charm"   → the dare taken to refuse a snake slide.
 */
export interface ActiveCard {
  prompt: Prompt;
  reason: "tile" | "ladder" | "charm";
  /**
   * The draw request this card answered — kept so a Skip can redraw with the
   * exact same zone/reason/kind. Absent on sessions saved before Skip existed.
   */
  from?: PendingDraw;
}

/**
 * A card the engine has requested but that hasn't been resolved against the
 * prompt pool yet. Lives in (persisted) state so a reload or a deck that
 * loads late can always complete the draw.
 */
export interface PendingDraw {
  zone: Zone;
  reason: ActiveCard["reason"];
  preferKind?: PromptKind;
}

export interface GameState {
  config: SessionConfig;
  phase: Phase;
  players: [PlayerState, PlayerState];
  current: 0 | 1;
  lastRoll: number | null;
  activeCard: ActiveCard | null;
  /** Set while phase is "prompt" but no card has been resolved yet. */
  pendingDraw: PendingDraw | null;
  /** Pending snake slide while the player decides (head/tail tiles). */
  pendingSnake: { from: number; to: number } | null;
  /**
   * Set while phase is "exhaustionChoice": the zone that ran dry. The
   * unresolved pendingDraw is kept alongside so Stay/Advance can complete it.
   */
  pendingExhaustion: { zone: Zone } | null;
  /** Prompt ids already drawn this session, per zone (no repeats until a zone is exhausted). */
  usedPromptIds: Record<Zone, string[]>;
  stats: SessionStats;
  winner: 0 | 1 | null;
}

/**
 * Events carry all randomness (die value, drawn prompt) so the reducer stays
 * pure and the whole session is replayable/persistable. The UI layer rolls
 * dice via rng.ts and resolves `state.pendingDraw` via draw.ts, then
 * dispatches CARD_DRAWN.
 */
export type GameEvent =
  | { type: "ROLLED"; value: number }
  | { type: "CARD_DRAWN"; prompt: Prompt; reason: ActiveCard["reason"] }
  | { type: "CARD_DONE" } // complete OR pass — deliberately the same event (§4.6)
  | { type: "CARD_SKIP" } // budgeted redraw of the active card
  | { type: "SNAKE_ACCEPT" }
  | { type: "SNAKE_CHARM" } // sets pendingDraw (reason "charm")
  | { type: "ZONE_EXHAUSTED" } // the pending draw's zone ran dry (caller-detected)
  | { type: "EXHAUSTION_STAY" } // true reshuffle of the dry zone
  | { type: "EXHAUSTION_ADVANCE"; tier: Tier; deckSlug: string }; // next tier's deck

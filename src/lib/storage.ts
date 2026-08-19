import { openDB, type IDBPDatabase } from "idb";
import type { GameState, Prompt, SessionStats, Tier } from "~/game/types";

// Local-first storage (PRD §6.7). Everything here stays on the device;
// none of it is ever sent to Convex.

const DB_NAME = "spark";
const DB_VERSION = 1;

export interface Prefs {
  ageConfirmed?: boolean;
  lastTier?: Tier;
  playerNames?: [string, string];
}

export interface HistoryEntry {
  finishedAt: number;
  winnerName: string;
  tier: Tier;
  stats: SessionStats;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function db(): Promise<IDBPDatabase> | null {
  if (typeof indexedDB === "undefined") return null; // SSR — callers no-op
  dbPromise ??= openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      database.createObjectStore("session");
      database.createObjectStore("prefs");
      database.createObjectStore("deckCache");
      database.createObjectStore("drafts");
      database.createObjectStore("history", { autoIncrement: true });
    },
  });
  return dbPromise;
}

// — session (auto-resume) —
export async function loadSession(): Promise<GameState | null> {
  const d = await db();
  return d ? ((await d.get("session", "current")) ?? null) : null;
}
export async function saveSession(state: GameState): Promise<void> {
  await (await db())?.put("session", state, "current");
}
export async function clearSession(): Promise<void> {
  await (await db())?.delete("session", "current");
}

// — prefs —
export async function loadPrefs(): Promise<Prefs> {
  const d = await db();
  return d ? ((await d.get("prefs", "prefs")) ?? {}) : {};
}
export async function savePrefs(patch: Partial<Prefs>): Promise<void> {
  const d = await db();
  if (!d) return;
  const current: Prefs = (await d.get("prefs", "prefs")) ?? {};
  await d.put("prefs", { ...current, ...patch }, "prefs");
}

// — deck cache (offline play) —
export async function getCachedDeck(slug: string): Promise<Prompt[] | null> {
  const d = await db();
  if (!d) return null;
  const entry = await d.get("deckCache", slug);
  return entry?.prompts ?? null;
}
export async function cacheDeck(slug: string, prompts: Prompt[]): Promise<void> {
  await (await db())?.put("deckCache", { prompts, fetchedAt: Date.now() }, slug);
}

// — history (local-only recaps) —
export async function appendHistory(entry: HistoryEntry): Promise<void> {
  await (await db())?.add("history", entry);
}
export async function lastHistory(): Promise<HistoryEntry | null> {
  const d = await db();
  if (!d) return null;
  const tx = d.transaction("history");
  const cursor = await tx.store.openCursor(null, "prev");
  return cursor?.value ?? null;
}

// — the big red button (Settings → clear local data) —
export async function clearAllLocalData(): Promise<void> {
  const d = await db();
  if (!d) return;
  const tx = d.transaction(["session", "prefs", "deckCache", "drafts", "history"], "readwrite");
  await Promise.all([
    tx.objectStore("session").clear(),
    tx.objectStore("prefs").clear(),
    tx.objectStore("deckCache").clear(),
    tx.objectStore("drafts").clear(),
    tx.objectStore("history").clear(),
  ]);
  await tx.done;
}

/** Ask the browser not to evict our IndexedDB under storage pressure (iOS). */
export function requestPersistence(): void {
  if (typeof navigator !== "undefined" && navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {});
  }
}

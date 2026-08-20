import { useCallback, useEffect, useRef, useState } from "react";
import { applyEvent, createSession } from "~/game/engine";
import { needsExhaustionChoice, resolveDraw } from "~/game/draw";
import { BOARD_PRESETS, CLASSIC } from "~/game/board-presets";
import type { GameEvent, GameState, Prompt, SessionConfig } from "~/game/types";
import { clearSession, loadSession, saveSession } from "./storage";

/**
 * Owns the live session: loads/persists it in IndexedDB (auto-resume) and
 * runs the pure engine. When the engine asks for a card (`pending`), the
 * draw is resolved synchronously from `pool` and fed back — so one
 * `dispatch` can chain ROLLED → CARD_DRAWN in a single update.
 *
 * `poolSlug` is the deck the pool was loaded FOR. An Advance (§4.7) changes
 * the session's deck before the new pool has loaded, and a draw resolved
 * against the outgoing pool would put a lower-tier card in an advanced
 * session — so draws only resolve while the slugs agree.
 *
 * `state` is `undefined` while loading, `null` when no session exists.
 */
export function useGameSession(pool: Prompt[] | null, poolSlug?: string) {
  const [state, setState] = useState<GameState | null | undefined>(undefined);
  // Refs so dispatch always sees the freshest pool — never a stale closure
  // (a stale null here would leave a roll stuck waiting for its card).
  const poolRef = useRef(pool);
  poolRef.current = pool;
  const poolSlugRef = useRef(poolSlug);
  poolSlugRef.current = poolSlug;

  useEffect(() => {
    let alive = true;
    loadSession().then((s) => {
      if (alive) setState(s ?? null);
    });
    return () => {
      alive = false;
    };
  }, []);

  const dispatch = useCallback((event: GameEvent) => {
    setState((prev) => {
      if (!prev) return prev;
      const preset = BOARD_PRESETS[prev.config.boardPresetId] ?? CLASSIC;
      let next = applyEvent(preset, prev, event);
      // Resolve any requested card immediately when the pool is ready.
      while (next.pendingDraw && next.phase === "prompt") {
        const pool = poolRef.current;
        if (!pool) break; // pool not ready — the effect below retries when it is
        // Pool belongs to a different deck (mid-advance) — wait for the new one.
        if (
          poolSlugRef.current !== undefined &&
          poolSlugRef.current !== next.config.deckSlug
        )
          break;
        // A dry zone pauses the draw for the Stay/Advance sheet (§4.7)
        // instead of silently recycling.
        if (needsExhaustionChoice(next, pool)) {
          next = applyEvent(preset, next, { type: "ZONE_EXHAUSTED" });
          break;
        }
        const prompt = resolveDraw(next, pool);
        if (!prompt) break;
        next = applyEvent(preset, next, {
          type: "CARD_DRAWN",
          prompt,
          reason: next.pendingDraw.reason,
        });
      }
      void saveSession(next);
      return next;
    });
  }, []);

  // Recovery path: a draw that couldn't resolve (deck still loading, or a
  // mid-draw reload) completes — or pauses on a dry zone — as soon as the
  // pool arrives. Routed through dispatch so both paths share the loop above.
  useEffect(() => {
    if (poolSlug !== undefined && poolSlug !== state?.config.deckSlug) return;
    if (
      pool &&
      state?.phase === "prompt" &&
      state.pendingDraw &&
      !state.activeCard
    ) {
      if (needsExhaustionChoice(state, pool)) {
        dispatch({ type: "ZONE_EXHAUSTED" });
      } else {
        const prompt = resolveDraw(state, pool);
        if (prompt) {
          dispatch({
            type: "CARD_DRAWN",
            prompt,
            reason: state.pendingDraw.reason,
          });
        }
      }
    }
  }, [pool, poolSlug, state, dispatch]);

  const start = useCallback((config: SessionConfig) => {
    const fresh = createSession(config, Date.now());
    void saveSession(fresh);
    setState(fresh);
    return fresh;
  }, []);

  const abandon = useCallback(() => {
    void clearSession();
    setState(null);
  }, []);

  return { state, dispatch, start, abandon };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { applyEvent, createSession } from "~/game/engine";
import { resolveDraw } from "~/game/draw";
import { BOARD_PRESETS, CLASSIC } from "~/game/board-presets";
import type { GameEvent, GameState, Prompt, SessionConfig } from "~/game/types";
import { clearSession, loadSession, saveSession } from "./storage";

/**
 * Owns the live session: loads/persists it in IndexedDB (auto-resume) and
 * runs the pure engine. When the engine asks for a card (`pending`), the
 * draw is resolved synchronously from `pool` and fed back — so one
 * `dispatch` can chain ROLLED → CARD_DRAWN in a single update.
 *
 * `state` is `undefined` while loading, `null` when no session exists.
 */
export function useGameSession(pool: Prompt[] | null) {
  const [state, setState] = useState<GameState | null | undefined>(undefined);
  // Ref so dispatch always sees the freshest pool — never a stale closure
  // (a stale null here would leave a roll stuck waiting for its card).
  const poolRef = useRef(pool);
  poolRef.current = pool;

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
      while (next.pendingDraw) {
        const pool = poolRef.current;
        const prompt = pool ? resolveDraw(next, pool) : null;
        if (!prompt) break; // pool not ready — the effect below retries when it is
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
  // mid-draw reload) completes as soon as the pool arrives.
  useEffect(() => {
    if (pool && state?.pendingDraw && !state.activeCard) {
      const prompt = resolveDraw(state, pool);
      if (prompt) {
        dispatch({ type: "CARD_DRAWN", prompt, reason: state.pendingDraw.reason });
      }
    }
  }, [pool, state, dispatch]);

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

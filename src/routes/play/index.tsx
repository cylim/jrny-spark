import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BOARD_PRESETS, CLASSIC } from "~/game/board-presets";
import { Board } from "~/components/board/Board";
import { Dice } from "~/components/play/Dice";
import { PromptCard } from "~/components/play/PromptCard";
import { SnakeCharmChoice } from "~/components/play/SnakeCharmChoice";
import { useGameSession } from "~/lib/use-game-session";
import { usePromptPool } from "~/lib/use-decks";
import { appendHistory, clearSession, loadSession } from "~/lib/storage";

export const Route = createFileRoute("/play/")({
  component: Play,
});

function Play() {
  const navigate = useNavigate();
  // Two-step bootstrap: peek the saved session's deck slug so the prompt
  // pool (server → cache → demo) can load alongside the session itself.
  const [slug, setSlug] = useState<string | undefined>(undefined);
  useEffect(() => {
    loadSession().then((s) => setSlug(s?.config.deckSlug));
  }, []);
  const pool = usePromptPool(slug);
  const { state, dispatch, abandon } = useGameSession(pool);

  const recorded = useRef(false);

  // No session → back to setup
  useEffect(() => {
    if (state === null) navigate({ to: "/play/setup" });
  }, [state, navigate]);

  // Finished → record a local-only recap, clear the session, then navigate.
  // Both writes are awaited BEFORE navigating: recap must read the fresh
  // entry, and browser-back must find no session (else it would re-append).
  useEffect(() => {
    if (state?.phase === "finished" && state.winner !== null && !recorded.current) {
      recorded.current = true;
      const finished = state;
      void (async () => {
        await appendHistory({
          finishedAt: Date.now(),
          winnerName: finished.players[finished.winner!].name,
          tier: finished.config.tier,
          stats: finished.stats,
        });
        await clearSession();
        navigate({ to: "/play/recap" });
      })();
    }
  }, [state, navigate]);

  if (!state) {
    return <main className="p-10 text-center text-mist">Loading your game…</main>;
  }

  const preset = BOARD_PRESETS[state.config.boardPresetId] ?? CLASSIC;
  const current = state.players[state.current];

  return (
    <main className="mx-auto max-w-md px-4 pb-10">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-display text-xl text-blush">{current.name}'s turn</p>
          <p className="text-xs text-mist">
            <span className="capitalize">{state.config.tier}</span> · tile {current.position || "start"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm("End this game? Nothing is saved from a session.")) {
              abandon();
              navigate({ to: "/" });
            }
          }}
          className="rounded-full bg-plum px-4 py-2 text-xs text-mist transition hover:text-blush"
        >
          End game
        </button>
      </div>

      <Board preset={preset} state={state} />

      <div className="mt-5 flex items-center justify-center gap-6">
        <PlayerChip name={state.players[0].name} color="bg-ember" active={state.current === 0} />
        <Dice
          disabled={state.phase !== "awaitRoll" || pool === null}
          lastRoll={state.lastRoll}
          onRoll={(value) => dispatch({ type: "ROLLED", value })}
        />
        <PlayerChip name={state.players[1].name} color="bg-gold" active={state.current === 1} />
      </div>
      {pool === null && <DeckLoadingNote />}

      {state.phase === "prompt" && state.activeCard && (
        <PromptCard
          card={state.activeCard}
          playerName={current.name}
          onDone={() => dispatch({ type: "CARD_DONE" })}
        />
      )}

      {state.phase === "snakeChoice" && state.pendingSnake && (
        <SnakeCharmChoice
          playerName={current.name}
          from={state.pendingSnake.from}
          to={state.pendingSnake.to}
          onAccept={() => dispatch({ type: "SNAKE_ACCEPT" })}
          onCharm={() => dispatch({ type: "SNAKE_CHARM" })}
        />
      )}
    </main>
  );
}

function DeckLoadingNote() {
  // pool === null is either a load in flight or a deck that's gone
  // (deactivated server-side with no local cache) — after a few seconds,
  // stop pretending it's loading.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(t);
  }, []);
  return (
    <p className="mt-3 text-center text-xs text-mist/60">
      {slow
        ? "This deck isn't available right now — check your connection, or end the game and pick another deck."
        : "Loading your deck…"}
    </p>
  );
}

function PlayerChip({ name, color, active }: { name: string; color: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${active ? "bg-plum-light" : "opacity-50"}`}>
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="max-w-24 truncate text-sm text-blush">{name}</span>
    </div>
  );
}

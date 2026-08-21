import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DEFAULT_SKIP_BUDGET } from "~/game/engine";
import { BOARD_PRESETS, CLASSIC } from "~/game/board-presets";
import { Board } from "~/components/board/Board";
import { Dice } from "~/components/play/Dice";
import { PromptCard } from "~/components/play/PromptCard";
import { SnakeCharmChoice } from "~/components/play/SnakeCharmChoice";
import { ExhaustionChoiceSheet } from "~/components/play/ExhaustionChoiceSheet";
import { useGameSession } from "~/lib/use-game-session";
import { usePromptPool } from "~/lib/use-decks";
import { useAdvanceOption } from "~/lib/use-advance-option";
import { useAgeGate } from "~/lib/use-age-gate";
import { useI18n } from "~/lib/i18n";
import { appendHistory, clearSession, loadSession } from "~/lib/storage";
import { cardsDrawnBucket, durationBucket, track } from "~/lib/analytics";

export const Route = createFileRoute("/play/")({
  component: Play,
});

function Play() {
  const navigate = useNavigate();
  const { t } = useI18n();
  // Two-step bootstrap: peek the saved session's deck slug so the prompt
  // pool (server → cache → demo) can load alongside the session itself.
  const [peekedSlug, setPeekedSlug] = useState<string | undefined>(undefined);
  useEffect(() => {
    loadSession().then((s) => setPeekedSlug(s?.config.deckSlug));
  }, []);
  const { state, pool, dispatch, abandon } = useGameSessionWithPool(peekedSlug);
  const advance = useAdvanceOption(state);
  const { withAgeCheck, ageGate } = useAgeGate();

  const recorded = useRef(false);

  // No session → back to setup
  useEffect(() => {
    if (state === null) navigate({ to: "/play/setup" });
  }, [state, navigate]);

  // card_shown fires once per draw (a Skip's replacement included) and never
  // for a card resumed from storage: count draws from the first state seen.
  const countedDraws = useRef<number | null>(null);
  useEffect(() => {
    if (!state) return;
    const drawn = state.stats.cardsDrawn;
    if (countedDraws.current === null) {
      countedDraws.current = drawn;
      return;
    }
    if (state.activeCard && drawn > countedDraws.current) {
      countedDraws.current = drawn;
      track({
        name: "card_shown",
        zone: state.activeCard.prompt.zone,
        kind: state.activeCard.prompt.kind,
        reason: state.activeCard.reason,
      });
    }
  }, [state]);

  // Finished → record a local-only recap, clear the session, then navigate.
  // Both writes are awaited BEFORE navigating: recap must read the fresh
  // entry, and browser-back must find no session (else it would re-append).
  useEffect(() => {
    if (
      state?.phase === "finished" &&
      state.winner !== null &&
      !recorded.current
    ) {
      recorded.current = true;
      const finished = state;
      const finishedAt = Date.now();
      track({
        name: "session_completed",
        duration_bucket: durationBucket(finishedAt - finished.stats.startedAt),
        cards_drawn_bucket: cardsDrawnBucket(finished.stats.cardsDrawn),
      });
      void (async () => {
        try {
          await appendHistory({
            finishedAt,
            winnerName: finished.players[finished.winner!].name,
            tier: finished.config.tier,
            stats: finished.stats,
            // null (unlimited) must survive — `??` would rewrite it to the
            // default and make the recap show a skips line it shouldn't.
            skipsPerPlayer:
              finished.config.skipsPerPlayer === undefined
                ? DEFAULT_SKIP_BUDGET
                : finished.config.skipsPerPlayer,
          });
        } finally {
          // Always clear: a finished session left behind would re-run this
          // effect on the next mount — re-appending the recap and counting
          // session_completed twice.
          await clearSession();
          navigate({ to: "/play/recap" });
        }
      })();
    }
  }, [state, navigate]);

  if (!state) {
    return (
      <main className="p-10 text-center text-mist">{t("play.loading")}</main>
    );
  }

  const preset = BOARD_PRESETS[state.config.boardPresetId] ?? CLASSIC;
  const current = state.players[state.current];
  // A pinned card redraws into itself — the engine ignores CARD_SKIP for
  // pins, so don't show the affordance either. Pass covers comfort.
  const isPinned =
    state.activeCard?.reason === "tile" &&
    state.config.tilePrompts?.[current.position]?.id ===
      state.activeCard.prompt.id;
  const canSkip =
    !isPinned &&
    (current.skipsRemaining === null || current.skipsRemaining > 0);

  return (
    <main className="mx-auto max-w-md px-4 pb-10">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-display text-xl text-blush">
            {t("play.turn", { name: current.name })}
          </p>
          <p className="text-xs text-mist">
            {t(`tier.${state.config.tier}`)} ·{" "}
            {current.position
              ? t("play.tile", { tile: current.position })
              : t("play.tile.start")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm(t("play.end.confirm"))) {
              abandon();
              navigate({ to: "/" });
            }
          }}
          className="rounded-full bg-plum px-4 py-2 text-xs text-mist transition hover:text-blush"
        >
          {t("play.end")}
        </button>
      </div>

      <Board preset={preset} state={state} />

      <div className="mt-5 flex items-center justify-center gap-6">
        <PlayerChip
          name={state.players[0].name}
          color="bg-ember"
          active={state.current === 0}
        />
        <Dice
          disabled={state.phase !== "awaitRoll" || pool === null}
          lastRoll={state.lastRoll}
          onRoll={(value) => dispatch({ type: "ROLLED", value })}
        />
        <PlayerChip
          name={state.players[1].name}
          color="bg-gold"
          active={state.current === 1}
        />
      </div>
      {pool === null && <DeckLoadingNote />}

      {state.phase === "prompt" && state.activeCard && (
        <PromptCard
          card={state.activeCard}
          playerName={current.name}
          skipsRemaining={current.skipsRemaining}
          canSkip={canSkip}
          onDone={() => dispatch({ type: "CARD_DONE" })}
          onPass={() => {
            track({ name: "pass" });
            dispatch({ type: "CARD_DONE" });
          }}
          onSkip={() => {
            track({ name: "skip" });
            dispatch({ type: "CARD_SKIP" });
          }}
        />
      )}

      {state.phase === "snakeChoice" && state.pendingSnake && (
        <SnakeCharmChoice
          playerName={current.name}
          from={state.pendingSnake.from}
          to={state.pendingSnake.to}
          onAccept={() => {
            track({ name: "charm_choice", choice: "slide" });
            dispatch({ type: "SNAKE_ACCEPT" });
          }}
          onCharm={() => {
            track({ name: "charm_choice", choice: "charm" });
            dispatch({ type: "SNAKE_CHARM" });
          }}
        />
      )}

      {state.phase === "exhaustionChoice" && (
        <ExhaustionChoiceSheet
          tier={state.config.tier}
          playerNames={[state.players[0].name, state.players[1].name]}
          advance={advance}
          onStay={() => {
            track({ name: "exhaustion_choice", choice: "stay" });
            dispatch({ type: "EXHAUSTION_STAY" });
          }}
          onAdvance={(option) =>
            // Advancing into spicy hits the 18+ gate if this device hasn't
            // confirmed it; declining leaves the sheet up, nothing advances.
            withAgeCheck(option.tier, () => {
              track({ name: "exhaustion_choice", choice: "advance" });
              dispatch({ type: "EXHAUSTION_ADVANCE", ...option });
            })
          }
        />
      )}
      {ageGate}
    </main>
  );
}

/**
 * The pool must follow the SESSION's deck slug, which changes mid-game on
 * Advance (§4.7) — so bind usePromptPool to the live state, falling back to
 * the pre-load peek while the session is still loading.
 */
function useGameSessionWithPool(peekedSlug: string | undefined) {
  const [liveSlug, setLiveSlug] = useState<string | undefined>(undefined);
  const slug = liveSlug ?? peekedSlug;
  const pool = usePromptPool(slug);
  const session = useGameSession(pool, slug);
  const sessionSlug = session.state?.config.deckSlug;
  useEffect(() => {
    if (sessionSlug) setLiveSlug(sessionSlug);
  }, [sessionSlug]);
  return { ...session, pool };
}

function DeckLoadingNote() {
  const { t } = useI18n();
  // pool === null is either a load in flight or a deck that's gone
  // (deactivated server-side with no local cache) — after a few seconds,
  // stop pretending it's loading.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSlow(true);
      track({ name: "error", kind: "deck_unavailable" });
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <p className="mt-3 text-center text-xs text-mist/60">
      {slow ? t("play.deck.unavailable") : t("play.deck.loading")}
    </p>
  );
}

function PlayerChip({
  name,
  color,
  active,
}: {
  name: string;
  color: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${active ? "bg-plum-light" : "opacity-50"}`}
    >
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="max-w-24 truncate text-sm text-blush">{name}</span>
    </div>
  );
}

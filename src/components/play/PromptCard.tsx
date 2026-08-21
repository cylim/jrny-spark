import type { ActiveCard } from "~/game/types";
import { useI18n } from "~/lib/i18n";

/**
 * The full-screen card. Three ways out (§4.6):
 * - Done — performed the card.
 * - Pass — put it away, nothing in its place. Always available, uncounted,
 *   and it dispatches the SAME engine event as Done: deliberately
 *   indistinguishable in play. `onPass` exists only so the allow-listed,
 *   content-free `pass` analytics event can be recorded (Appendix A).
 * - Skip — budgeted redraw; hidden at zero budget and for pinned cards
 *   (their redraw would return the same pin).
 */
export function PromptCard({
  card,
  playerName,
  skipsRemaining,
  canSkip,
  onDone,
  onPass,
  onSkip,
}: {
  card: ActiveCard;
  playerName: string;
  /** null = unlimited budget. */
  skipsRemaining: number | null;
  canSkip: boolean;
  onDone: () => void;
  onPass: () => void;
  onSkip: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-midnight/85 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-plum p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-widest text-ember-soft">
          {t(`card.reason.${card.reason}`)} · {playerName}
        </p>
        <p className="mt-1 text-xs text-mist">
          {t(`card.kind.${card.prompt.kind}`)}
        </p>
        <p className="font-display mt-5 text-2xl leading-snug text-blush">
          {card.prompt.text}
        </p>
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onDone}
            className="flex-1 rounded-full bg-ember py-3 font-semibold text-midnight transition active:scale-95"
          >
            {t("card.done")}
          </button>
          {canSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="rounded-full bg-plum-light px-4 py-3 text-sm text-mist transition hover:text-blush"
            >
              {skipsRemaining === null
                ? t("card.skip.unlimited")
                : t("card.skip", { count: skipsRemaining })}
            </button>
          )}
          <button
            type="button"
            onClick={onPass}
            className="rounded-full px-4 py-3 text-sm text-mist transition hover:text-blush"
          >
            {t("card.pass")}
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-mist/50">
          {t("card.consent")}
        </p>
      </div>
    </div>
  );
}

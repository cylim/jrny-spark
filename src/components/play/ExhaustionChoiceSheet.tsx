import { useState } from "react";
import type { Tier } from "~/game/types";
import type { AdvanceOption } from "~/lib/use-advance-option";
import { useI18n } from "~/lib/i18n";

/**
 * The zone-dry choice (§4.7): Stay (true reshuffle) or Advance to the next
 * tier's deck. Advance takes one confirmation tap from EACH player — consent
 * is expanded by the couple, not by whoever holds the phone — so it hides
 * behind a second step with a named button per player. Taps are deliberately
 * component-local, not session state: a reload mid-confirmation re-asks both
 * players, which is the consent-safe direction. `advance` is null when there
 * is nothing to advance into (already spicy, or the next deck isn't
 * obtainable right now) — then the sheet is a one-tap reshuffle.
 */
export function ExhaustionChoiceSheet({
  tier,
  playerNames,
  advance,
  onStay,
  onAdvance,
}: {
  tier: Tier;
  playerNames: [string, string];
  advance: AdvanceOption | null;
  onStay: () => void;
  onAdvance: (option: AdvanceOption) => void;
}) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);
  const [agreed, setAgreed] = useState<[boolean, boolean]>([false, false]);

  const tierName = t(`tier.${tier}`);

  const agree = (index: 0 | 1) => {
    if (!advance) return;
    const next: [boolean, boolean] = [...agreed];
    next[index] = true;
    setAgreed(next);
    if (next[0] && next[1]) onAdvance(advance);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-midnight/85 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-plum p-6 text-center shadow-2xl">
        <p className="text-4xl">🔀</p>
        <h2 className="font-display mt-2 text-2xl text-blush">
          {t("exhaust.title")}
        </h2>

        {!confirming || !advance ? (
          <>
            <p className="mt-2 text-sm text-mist">
              {t("exhaust.body", { tier: tierName })}
            </p>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={onStay}
                className="rounded-full bg-ember py-3 font-semibold text-midnight transition active:scale-95"
              >
                {t("exhaust.stay", { tier: tierName })}
              </button>
              {advance && (
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className="rounded-full bg-plum-light py-3 text-sm text-mist transition hover:text-blush"
                >
                  {t("exhaust.advance", { tier: t(`tier.${advance.tier}`) })} ✨
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-mist">
              {t("exhaust.advance.note")}
            </p>
            <div className="mt-6 grid gap-3">
              {([0, 1] as const).map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => agree(i)}
                  disabled={agreed[i]}
                  className={`rounded-full py-3 font-semibold transition active:scale-95 ${
                    agreed[i]
                      ? "bg-plum-light text-mist"
                      : "bg-ember text-midnight"
                  }`}
                >
                  {agreed[i]
                    ? t("exhaust.confirmed", { name: playerNames[i] })
                    : t("exhaust.confirm", { name: playerNames[i] })}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setAgreed([false, false]);
                }}
                className="rounded-full bg-plum-light py-2 text-xs text-mist transition hover:text-blush"
              >
                {t("exhaust.back")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

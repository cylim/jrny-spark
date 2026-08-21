import { useState } from "react";
import { rollDie } from "~/game/rng";
import { useI18n } from "~/lib/i18n";

const FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

export function Dice({
  disabled,
  lastRoll,
  onRoll,
}: {
  disabled: boolean;
  lastRoll: number | null;
  onRoll: (value: number) => void;
}) {
  const { t } = useI18n();
  const [rolling, setRolling] = useState(false);

  const roll = () => {
    if (disabled || rolling) return;
    setRolling(true);
    if (typeof navigator !== "undefined") navigator.vibrate?.(30);
    // brief visual shuffle before the real value lands
    const value = rollDie();
    setTimeout(() => {
      setRolling(false);
      onRoll(value);
    }, 450);
  };

  return (
    <button
      type="button"
      onClick={roll}
      disabled={disabled || rolling}
      className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ember text-4xl text-midnight shadow-lg shadow-ember/30 transition active:scale-95 disabled:opacity-40"
      aria-label={t("dice.roll")}
    >
      <span className={rolling ? "animate-spin" : ""}>
        {rolling ? "⚄" : lastRoll ? FACES[lastRoll] : "🎲"}
      </span>
    </button>
  );
}

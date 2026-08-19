import type { ActiveCard } from "~/game/types";

const REASON_LABEL: Record<ActiveCard["reason"], string> = {
  tile: "Your card",
  ladder: "Closer card 🪜",
  charm: "You charmed the snake 🐍",
};

const KIND_LABEL = { question: "Ask each other", action: "Do it", together: "Together" };

export function PromptCard({
  card,
  playerName,
  onDone,
}: {
  card: ActiveCard;
  playerName: string;
  onDone: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-midnight/85 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-plum p-6 shadow-2xl">
        <p className="text-xs uppercase tracking-widest text-ember-soft">
          {REASON_LABEL[card.reason]} · {playerName}
        </p>
        <p className="mt-1 text-xs text-mist">{KIND_LABEL[card.prompt.kind]}</p>
        <p className="font-display mt-5 text-2xl leading-snug text-blush">{card.prompt.text}</p>
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onDone}
            className="flex-1 rounded-full bg-ember py-3 font-semibold text-midnight transition active:scale-95"
          >
            Done ✨
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded-full px-5 py-3 text-sm text-mist transition hover:text-blush"
          >
            Skip
          </button>
        </div>
        <p className="mt-3 text-center text-[10px] text-mist/50">
          Skipping is always fine. Nothing is recorded either way.
        </p>
      </div>
    </div>
  );
}

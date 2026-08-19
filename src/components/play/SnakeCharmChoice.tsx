export function SnakeCharmChoice({
  playerName,
  from,
  to,
  onAccept,
  onCharm,
}: {
  playerName: string;
  from: number;
  to: number;
  onAccept: () => void;
  onCharm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-midnight/85 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-plum p-6 text-center shadow-2xl">
        <p className="text-4xl">🐍</p>
        <h2 className="font-display mt-2 text-2xl text-blush">A snake, {playerName}!</h2>
        <p className="mt-2 text-sm text-mist">
          Slide from {from} down to {to}… or charm it with a dare and stay put.
        </p>
        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={onCharm}
            className="rounded-full bg-ember py-3 font-semibold text-midnight transition active:scale-95"
          >
            Charm the snake — take a dare
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-full bg-plum-light py-3 text-sm text-mist transition hover:text-blush"
          >
            Accept the slide to {to}
          </button>
        </div>
      </div>
    </div>
  );
}

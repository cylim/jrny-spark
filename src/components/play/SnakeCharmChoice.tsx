import { useI18n } from "~/lib/i18n";

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
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-midnight/85 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-plum p-6 text-center shadow-2xl">
        <p className="text-4xl">🐍</p>
        <h2 className="font-display mt-2 text-2xl text-blush">
          {t("snake.title", { name: playerName })}
        </h2>
        <p className="mt-2 text-sm text-mist">
          {t("snake.body", { from, to })}
        </p>
        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={onCharm}
            className="rounded-full bg-ember py-3 font-semibold text-midnight transition active:scale-95"
          >
            {t("snake.charm")}
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-full bg-plum-light py-3 text-sm text-mist transition hover:text-blush"
          >
            {t("snake.accept", { to })}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useI18n } from "~/lib/i18n";

// Quick picks; null = unlimited (§4.6).
const SKIP_CHOICES: Array<number | null> = [0, 1, 3, 5, null];

/** Per-player skip budget control, shared by session setup and the builder. */
export function SkipBudgetPicker({
  value,
  onChange,
  title,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  title: string;
}) {
  const { t } = useI18n();
  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-mist">
        {title}
      </h2>
      <p className="mt-1 text-xs text-mist/60">{t("skips.note")}</p>
      <div className="mt-3 flex gap-2">
        {SKIP_CHOICES.map((choice) => (
          <button
            key={choice ?? "unlimited"}
            type="button"
            onClick={() => onChange(choice)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              value === choice
                ? "bg-ember text-midnight"
                : "bg-plum text-mist hover:bg-plum-light"
            }`}
          >
            {choice ?? t("skips.unlimited")}
          </button>
        ))}
      </div>
    </section>
  );
}

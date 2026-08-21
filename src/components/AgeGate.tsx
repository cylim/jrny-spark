import { useI18n } from "~/lib/i18n";

export function AgeGate({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/90 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-plum p-6 text-center shadow-2xl">
        <p className="text-3xl">🔞</p>
        <h2 className="font-display mt-2 text-2xl text-blush">
          {t("ageGate.title")}
        </h2>
        <p className="mt-3 text-sm text-mist">{t("ageGate.body")}</p>
        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-ember py-3 font-semibold text-midnight transition active:scale-95"
          >
            {t("ageGate.confirm")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-plum-light py-3 text-sm text-mist transition hover:text-blush"
          >
            {t("ageGate.cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}

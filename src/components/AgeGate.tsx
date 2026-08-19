export function AgeGate({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/90 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-plum p-6 text-center shadow-2xl">
        <p className="text-3xl">🔞</p>
        <h2 className="font-display mt-2 text-2xl text-blush">Adults only</h2>
        <p className="mt-3 text-sm text-mist">
          The Spicy tier contains intimate content intended for adults. Please
          confirm that both players are 18 or older.
        </p>
        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-ember py-3 font-semibold text-midnight transition active:scale-95"
          >
            We're both 18+
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-plum-light py-3 text-sm text-mist transition hover:text-blush"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}

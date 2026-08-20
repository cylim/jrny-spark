import { useState, type ReactNode } from "react";
import { AgeGate } from "~/components/AgeGate";
import type { Tier } from "~/game/types";
import { loadPrefs, savePrefs } from "~/lib/storage";

/**
 * The 18+ gate, checked against the DECK's tier at every session start —
 * fresh setup, saved Template, and draft alike (spec #1). `withAgeCheck`
 * runs `action` unless the tier is spicy and this device hasn't confirmed
 * 18+ yet; then the gate renders and `action` runs on confirm. Prefs are
 * read at decision time, not mount, so a confirmed device never sees a
 * spurious gate — and an unresolved read still fails closed.
 * Render `ageGate` somewhere in the calling page.
 */
export function useAgeGate(): {
  withAgeCheck: (tier: Tier, action: () => void) => void;
  ageGate: ReactNode;
} {
  const [pending, setPending] = useState<(() => void) | null>(null);

  const withAgeCheck = (tier: Tier, action: () => void) => {
    if (tier !== "spicy") {
      action();
      return;
    }
    void loadPrefs()
      .then((p) => {
        if (p.ageConfirmed) action();
        else setPending(() => action);
      })
      // A failed prefs read is treated as unconfirmed: show the gate
      // rather than leaving the click dead — fail closed, stay responsive.
      .catch(() => setPending(() => action));
  };

  const ageGate = pending ? (
    <AgeGate
      onConfirm={() => {
        void savePrefs({ ageConfirmed: true });
        setPending(null);
        pending();
      }}
      onCancel={() => setPending(null)}
    />
  ) : null;

  return { withAgeCheck, ageGate };
}

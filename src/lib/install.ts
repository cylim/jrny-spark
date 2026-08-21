// Add-to-homescreen handling (PRD §6.8). Chrome/Android fire
// `beforeinstallprompt`; iOS Safari never does — we show instructions there.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn());
  });
}

export function canPromptInstall(): boolean {
  return deferredPrompt !== null;
}

export function onInstallAvailable(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export type InstallOutcome = "accepted" | "dismissed";

/**
 * Show the native install prompt; null when none is available. The event is
 * single-use whichever way it goes — if still eligible, the browser fires a
 * fresh `beforeinstallprompt` later (see onInstallAvailable).
 */
export async function promptInstall(): Promise<InstallOutcome | null> {
  const event = deferredPrompt;
  if (!event) return null;
  deferredPrompt = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome;
}

export function isIos(): boolean {
  return (
    typeof navigator !== "undefined" &&
    /iphone|ipad|ipod/i.test(navigator.userAgent)
  );
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's non-standard flag
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

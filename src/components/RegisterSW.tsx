import { useCallback, useEffect, useState } from "react";
import { track } from "~/lib/analytics";

/**
 * Registers the post-build Workbox service worker (scripts/build-pwa.ts)
 * and owns the update lifecycle: the generated worker WAITS when a new
 * version is installed (skipWaiting: false), this component shows a toast,
 * and accepting posts SKIP_WAITING + reloads once the new worker takes over.
 */
export function RegisterSW() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

    let reg: ServiceWorkerRegistration | undefined;
    let cancelled = false;

    const trackInstalling = (sw: ServiceWorker) => {
      // The first transition after "installing" is "installed" (update
      // waiting) or "redundant" (install failed) — once:true covers both.
      sw.addEventListener(
        "statechange",
        () => {
          // "installed" while an old worker still controls the page = an
          // update is waiting. On first-ever install there is no controller
          // and no prompt — nothing to update from.
          if (
            !cancelled &&
            sw.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setWaiting(sw);
          }
        },
        { once: true }
      );
    };
    const onUpdateFound = () => {
      if (reg?.installing) trackInstalling(reg.installing);
    };

    navigator.serviceWorker
      .register("/sw.js")
      .then((r) => {
        if (cancelled) return;
        reg = r;
        // A worker may already be waiting (update found on a previous visit).
        if (r.waiting && navigator.serviceWorker.controller)
          setWaiting(r.waiting);
        if (r.installing) trackInstalling(r.installing);
        r.addEventListener("updatefound", onUpdateFound);
      })
      .catch((err) => {
        console.error("Service worker registration failed:", err);
        track({ name: "error", kind: "sw_register" });
      });

    // Browsers only re-check sw.js on navigation, and a home-screen PWA can
    // live for days without one — so also check hourly and whenever the app
    // is foregrounded (the only signal iOS standalone reliably fires).
    // Re-inspecting reg.waiting also resurfaces the toast after "Later" —
    // a parked update must not stay invisible for the rest of the session.
    const check = () => {
      reg?.update().catch(() => {});
      if (!cancelled && reg?.waiting && navigator.serviceWorker.controller) {
        setWaiting(reg.waiting);
      }
    };
    const interval = setInterval(check, 60 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      reg?.removeEventListener("updatefound", onUpdateFound);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waiting) return;
    setWaiting(null);
    // Another tab may have already promoted this worker (clientsClaim swaps
    // our controller silently) — SKIP_WAITING would be a no-op then and
    // controllerchange won't re-fire, so just reload.
    if (waiting.state !== "installed") {
      window.location.reload();
      return;
    }
    // Listen BEFORE posting so the controllerchange can't be missed;
    // once + reloaded flag guard against a reload loop.
    let reloaded = false;
    const reload = () => {
      if (!reloaded) {
        reloaded = true;
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", reload, {
      once: true,
    });
    waiting.postMessage({ type: "SKIP_WAITING" });
    // Belt and braces: if the worker activated between the state check and
    // the postMessage, controllerchange already fired — reload anyway.
    setTimeout(reload, 1500);
  }, [waiting]);

  if (!waiting) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-plum-light/95 px-4 py-3 text-sm text-mist shadow-xl shadow-midnight/70 backdrop-blur-sm"
    >
      <span className="text-ember" aria-hidden>
        ✦
      </span>
      <span className="whitespace-nowrap">
        A new version of Spark is ready.
      </span>
      <button
        type="button"
        onClick={applyUpdate}
        className="rounded-lg bg-ember px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:bg-ember-soft active:scale-95"
      >
        Update
      </button>
      <button
        type="button"
        onClick={() => setWaiting(null)}
        className="text-xs text-mist/70 hover:text-blush"
        aria-label="Dismiss — the update applies next time you open Spark"
      >
        Later
      </button>
    </div>
  );
}

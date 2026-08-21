import { useEffect } from "react";
import { track } from "~/lib/analytics";

/** Registers the post-build Workbox service worker (scripts/build-pwa.ts). */
export function RegisterSW() {
  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
        track({ name: "error", kind: "sw_register" });
      });
    }
  }, []);
  return null;
}

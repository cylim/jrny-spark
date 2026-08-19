import { useEffect } from "react";

/** Registers the post-build Workbox service worker (scripts/build-pwa.ts). */
export function RegisterSW() {
  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    }
  }, []);
  return null;
}

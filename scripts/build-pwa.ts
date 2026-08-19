// Post-build service-worker generation.
//
// WHY: vite-plugin-pwa's SW generation is silently skipped when the
// tanstackStart() plugin is present (TanStack/router#4988), so we generate
// the worker ourselves with workbox-build after `vite build`.
// Wired into package.json: "build": "vite build && bun scripts/build-pwa.ts".
//
// Offline model (PRD §6.8): precache static assets; runtime-cache visited
// pages NetworkFirst so a previously-opened app works fully offline;
// /offline.html is the last-resort navigation fallback.
import { generateSW } from "workbox-build";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
// TanStack Start (Nitro) writes client assets to .output/public by default;
// older/other presets use dist/client.
const candidates = [".output/public", "dist/client", "dist"];
const publicDir = candidates.map((c) => join(root, c)).find((d) => existsSync(d));

if (!publicDir) {
  console.error(`build-pwa: no build output found (looked in ${candidates.join(", ")}). Run vite build first.`);
  process.exit(1);
}

const result = await generateSW({
  swDest: join(publicDir, "sw.js"),
  globDirectory: publicDir,
  // Static assets only — SSR HTML must never be precached (stale shell).
  globPatterns: ["**/*.{js,css,png,svg,ico,woff,woff2,webp,avif,webmanifest}", "offline.html"],
  globIgnores: ["sw.js", "workbox-*.js", "**/*.map"],
  navigateFallback: "/offline.html",
  navigateFallbackDenylist: [/^\/api\//],
  clientsClaim: true,
  skipWaiting: true,
  cleanupOutdatedCaches: true,
  runtimeCaching: [
    {
      // Visited pages: fresh when online, cached when offline.
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages",
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
  ],
});

console.log(
  `✓ sw.js generated in ${publicDir} — precached ${result.count} files (${Math.round(result.size / 1024)} KB)`,
);
for (const warning of result.warnings) console.warn("  warning:", warning);

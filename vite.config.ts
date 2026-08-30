import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";

// PWA note: vite-plugin-pwa's service-worker generation is skipped when
// tanstackStart() is present (TanStack/router#4988), so the service worker
// is generated post-build by scripts/build-pwa.ts (workbox-build) and the
// web manifest is a static file at public/manifest.webmanifest.
export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    // Vite 8 built-in — applies to the cloudflare plugin's worker
    // environment too, which the vite-tsconfig-paths plugin did not.
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    // Builds the SSR handler for workerd and serves dev through Miniflare
    // (wrangler.jsonc is the config). Must come before tanstackStart().
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart(),
    // React plugin must come AFTER tanstackStart()
    viteReact(),
  ],
});

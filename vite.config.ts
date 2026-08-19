import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";

// PWA note: vite-plugin-pwa's service-worker generation is skipped when
// tanstackStart() is present (TanStack/router#4988), so the service worker
// is generated post-build by scripts/build-pwa.ts (workbox-build) and the
// web manifest is a static file at public/manifest.webmanifest.
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths(),
    tanstackStart(),
    // React plugin must come AFTER tanstackStart()
    viteReact(),
  ],
});

import { defineConfig } from "vitest/config";

// Deliberately not vite.config.ts: tests don't want tanstackStart() or the
// PWA pipeline, just path aliases and the right environment per suite —
// node for the pure engine tests, edge-runtime for convex-test.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "engine",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "convex",
          environment: "edge-runtime",
          include: ["convex/**/*.test.ts"],
          server: { deps: { inline: ["convex-test"] } },
        },
      },
    ],
  },
});

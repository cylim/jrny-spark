import { defineConfig } from "vitest/config";

// Deliberately not vite.config.ts: tests don't want tanstackStart() or the
// PWA pipeline, just path aliases and a node environment.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "convex/**/*.test.ts"],
  },
});

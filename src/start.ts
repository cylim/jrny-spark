import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createStart } from "@tanstack/react-start";

export const startInstance = createStart(() => {
  // Clerk is all-or-nothing: the client gates its UI on the publishable key
  // (src/env.ts) and the server gates middleware on the secret key. A
  // half-configured pair would split-brain auth (client sends sessions the
  // server never verifies), so fail fast on the server instead.
  const hasPublishable = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  const hasSecret = typeof process !== "undefined" && Boolean(process.env.CLERK_SECRET_KEY);
  if (typeof window === "undefined" && hasPublishable !== hasSecret) {
    throw new Error(
      "Clerk is half-configured: set BOTH VITE_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY, or neither (demo mode). See .env.example.",
    );
  }
  return {
    requestMiddleware: hasSecret ? [clerkMiddleware()] : [],
  };
});

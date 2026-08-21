/**
 * Optional-integration flags. The app is designed to boot with NO env vars
 * (demo mode: bundled demo deck, no sign-in, no cloud saves) so `bun dev`
 * works on a fresh clone — see README.
 */
export const env = {
  convexUrl: import.meta.env.VITE_CONVEX_URL as string | undefined,
  clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
    string | undefined,
  posthogKey: import.meta.env.VITE_POSTHOG_KEY as string | undefined,
};

export const hasConvex = Boolean(env.convexUrl);
export const hasClerk = Boolean(env.clerkPublishableKey);
export const hasPostHog = Boolean(env.posthogKey);

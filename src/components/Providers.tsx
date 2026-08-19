import type { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/tanstack-react-start";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { env, hasClerk, hasConvex } from "~/env";

// One client for the app lifetime. In demo mode (no VITE_CONVEX_URL) a
// placeholder URL is used — every hook passes "skip" then, so no connection
// is ever attempted.
export const convexClient = new ConvexReactClient(
  env.convexUrl ?? "https://demo-000.convex.cloud",
  { unsavedChangesWarning: false },
);

export function Providers({ children }: { children: ReactNode }) {
  if (hasClerk && hasConvex) {
    return (
      <ClerkProvider>
        <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
          {children}
        </ConvexProviderWithClerk>
      </ClerkProvider>
    );
  }
  if (hasClerk) {
    return (
      <ClerkProvider>
        <ConvexProvider client={convexClient}>{children}</ConvexProvider>
      </ClerkProvider>
    );
  }
  return <ConvexProvider client={convexClient}>{children}</ConvexProvider>;
}

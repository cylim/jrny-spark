import { hasClerk, hasConvex } from "~/env";

/** Dev-only hint while Convex/Clerk aren't configured (demo mode). */
export function SetupBanner() {
  if (!import.meta.env.DEV || (hasClerk && hasConvex)) return null;
  const missing = [
    !hasConvex && "Convex (VITE_CONVEX_URL)",
    !hasClerk && "Clerk (VITE_CLERK_PUBLISHABLE_KEY)",
  ]
    .filter(Boolean)
    .join(" + ");
  return (
    <div className="fixed bottom-2 left-2 z-50 max-w-xs rounded-lg bg-plum-light/90 px-3 py-2 text-xs text-mist shadow-lg">
      Demo mode — {missing} not configured. See README for setup.
    </div>
  );
}

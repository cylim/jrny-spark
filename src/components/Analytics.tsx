import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { initAnalytics, track } from "~/lib/analytics";

/**
 * Boots analytics (the opt-out preference is read before PostHog starts) and
 * records the allow-listed `page_view` by matched route id — a closed set,
 * never the raw URL.
 */
export function Analytics() {
  const route = useRouterState({
    select: (s) => s.matches[s.matches.length - 1]?.routeId,
  });

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (route) track({ name: "page_view", route });
  }, [route]);

  return null;
}

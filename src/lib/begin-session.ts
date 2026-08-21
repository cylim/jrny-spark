import { createSession } from "~/game/engine";
import type { SessionConfig } from "~/game/types";
import { track } from "~/lib/analytics";
import { saveSession } from "~/lib/storage";

/**
 * Every Session start — fresh setup, saved Template, or builder draft — goes
 * through here: persist the new session (awaited, because /play reads it on
 * mount) and record the content-free `session_started` event. The Game Type
 * is fixed until Phase 2 adds a second one.
 */
export async function beginSession(config: SessionConfig): Promise<void> {
  await saveSession(createSession(config, Date.now()));
  track({
    name: "session_started",
    tier: config.tier,
    game_type: "journey_board",
  });
}

# Spark

The ubiquitous language for Spark, the couples intimacy game PWA (`jrny-spark`). This glossary is the vocabulary source of truth: when UI copy, docs, or new code disagree with it, the glossary wins. The privacy boundary these terms live inside is [ADR 0001](./docs/adr/0001-play-data-never-leaves-the-device.md).

## Language

### Playing

**Session**:
One live play-through on one device, from setup to recap. A Session — positions, turns, draws, remaining Skips, pending choices, player names — exists only on the device (ADR 0001).
_Avoid_: game (for the live play-through), match, room

**Game Type**:
A rule set that delivers Cards, such as Journey Board (Snakes & Ladders). Each Game Type maps its own progression onto Zones.
_Avoid_: game mode

**Game Template**:
A saved, reusable game configuration owned by a signed-in user: Game Type, Deck, board preset, Pinned Prompts, and the per-player Skip budget. Presented in UI as "My Templates". A Template is configuration only — never a Session.
_Avoid_: saved game, custom game, config

**Active Player**:
The player whose turn it is. Cards speak in the Active Player's voice.
_Avoid_: current player

**Winner**:
The first player to reach the final tile — a playful "first to the finish" nod on the recap, local-only. No other win/lose framing exists.

### Content

**Deck**:
A curated pool of Prompts at a single Tier. Tier is an attribute of the Deck, derived server-side — never declared by a client.
_Avoid_: card pack, deck of a tier

**Prompt**:
One canonical card's content: per-locale text (English required) plus Zone, Kind, and props tags.
_Avoid_: question (as the general term)

**Card**:
A Prompt as drawn and shown during a Session.

**Kind**:
A Prompt's flavor — `question`, `action` (dare), or `together`.

**Tier**:
A Deck's intensity level: Sweet, Flirty, or Spicy. Spicy sits behind the 18+ Age Gate. A Session's Tier is the Tier of its active Deck.
_Avoid_: level, intensity setting

**Zone**:
A Deck escalation band — Warm-up, Deeper, Close — that each Game Type maps its own progression onto. Journey Board maps board thirds (tiles 1–33 / 34–66 / 67–100) onto Zones 1–3.
_Avoid_: stage, phase

**Sample Deck**:
The small Sweet-tier Deck bundled in the client as a fallback so a first-ever visit works offline and an unconfigured checkout stays playable. A fallback, not a mode.
_Avoid_: demo deck, demo mode

**Pinned Prompt**:
A Prompt a Template creator attaches to a specific board tile. Landing on that tile shows the pin — it converts a Neutral Tile into a prompt tile.
_Avoid_: custom prompt, fixed-tile prompt, prompt override

**Neutral Tile**:
A breather tile that draws no Card — unless a Pinned Prompt converts it.

### Consent moves

**Skip**:
A budgeted redraw: discard the current Card and draw a replacement from the same Zone. The per-player budget is set on the Game Template — default 3, configurable 0–unlimited.
_Avoid_: reroll, redraw (as the user-facing term)

**Pass**:
Putting a Card away with nothing in its place. Always available, never counted, never penalized, indistinguishable from completing the Card — the consent guarantee that no Card ever has to be performed.
_Avoid_: free skip, decline

**Stay**:
The Zone-exhaustion choice that keeps the current Deck and truly reshuffles the dry Zone: a fresh no-repeat cycle, never an immediate repeat.

**Advance**:
The Zone-exhaustion choice that swaps the Session's active Deck for the next Tier's Deck (sweet→flirty→spicy) at the same board position. Confirmed explicitly by both players, gated by the Age Gate when the target is Spicy, and never offered at Spicy. Escalation never happens automatically.
_Avoid_: level up, auto-escalate

**Charm** (charm the snake):
Declining a snake slide by taking a dare-flavored Card one Zone up to stay put. Skipping or Passing a charm Card keeps the stay-put — a comfort boundary is never punished with a setback.

### Boundaries

**Age Gate**:
The 18+ self-confirmation, remembered locally, checked against the active Deck's Tier at every Session start — fresh setup, saved Template, or draft — and on any Advance into Spicy.

**Privacy Line**:
The boundary defined by ADR 0001: play data never leaves the device. The server holds identity, Decks, Game Templates, and purchases; it never receives Session or gameplay payloads, and analytics carry behavioral metadata only — never content.

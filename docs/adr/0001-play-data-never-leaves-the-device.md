# Play data never leaves the device

Status: accepted (2026-08-20)

Spark's product is intimate play between two people; trust is its survival condition. We decided that everything that happens during a Session — positions, turns, drawn Cards, Skips and Passes, pending choices, player names, recaps — lives only on the device (memory + IndexedDB) and is never sent to a server. Convex holds identity, Decks/Prompts, Game Templates (configuration only), and purchases; no server function accepts Session or gameplay payloads, and this is a standing code-review rule. Analytics may carry allow-listed behavioral metadata only — never prompt ids, prompt text, or player names.

## Consequences

- **Two-device play and room codes are cut, not deferred.** Convex reactivity would make a shared-board table near-trivial, and we rejected it: any play state on the server breaks the promise that makes the product viable. Do not "fix" an awkward pass-the-phone flow by adding a sessions table.
- Group mode, if built, is pass-the-phone on a single device.
- The recap (including the Winner nod) is computed and displayed locally and never uploaded.
- Anonymous play is always possible; an account exists only to save Game Templates (and later, purchases).
- Every proposed analytics event is reviewed against this boundary before it may fire.

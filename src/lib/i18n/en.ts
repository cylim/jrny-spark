// English catalog — the required fallback locale (PRD §6.10) and the single
// source of truth for message keys. Add every new UI string here first;
// ko.ts / zh-hant.ts mirror these keys and may lag behind (missing entries
// render English, never a blank).
export const en = {
  // — navigation —
  "nav.play": "Play",
  "nav.templates": "My Templates",
  "nav.settings": "Settings",

  // — landing —
  "home.headline.before": "Play your way ",
  "home.headline.accent": "closer",
  "home.headline.after": ".",
  "home.subtitle":
    "A board game journey for two. Roll, climb, and draw cards that turn an ordinary night into a closer one.",
  "home.cta": "Play now",
  "home.noAccount": "No account needed. One phone, two players.",
  "home.feature1.title": "Roll & journey",
  "home.feature1.body":
    "A classic board with a twist — ladders bring you closer, snakes dare you.",
  "home.feature2.title": "Draw a card",
  "home.feature2.body":
    "Sweet, flirty, or spicy — you choose the tier, the game raises the warmth as you climb.",
  "home.feature3.title": "Stays between you",
  "home.feature3.body":
    "What happens in a session never leaves your phone. Ever.",
  "home.footer.byline": "A JRNY thing",
  "home.footer.privacy": "how we handle privacy",

  // — tiers —
  "tier.sweet": "Sweet",
  "tier.flirty": "Flirty",
  "tier.spicy": "Spicy",
  "tier.sweet.blurb": "Warm and curious",
  "tier.flirty.blurb": "Playful and teasing",
  "tier.spicy.blurb": "Intimate · 18+",

  // — session setup —
  "setup.title": "Set the mood",
  "setup.resume": "Resume your game ▶",
  "setup.resume.turn": "turn {turn}",
  "setup.players": "Players",
  "setup.players.note": "Names stay on this phone — never uploaded.",
  "setup.players.placeholder": "Player {n}",
  "setup.tier": "Tier",
  "setup.deck": "Deck",
  "setup.deck.cards": "{count} cards",
  "setup.deck.noneConvex":
    "No {tier} deck yet — run `bun run seed` to load the starter decks.",
  "setup.deck.noneSample":
    "No {tier} deck yet — the built-in Sample Deck will be used.",
  "setup.skips": "Skips per player",
  "setup.skips.note":
    "A Skip trades a card for a fresh one. Putting a card away without drawing a replacement (Pass) is always free.",
  "setup.skips.unlimited": "Unlimited",
  "setup.start": "Start the journey",

  // — shared skip-budget picker (context-neutral; used in setup and builder) —
  "skips.note":
    "A Skip trades a card for a fresh one. Putting a card away without drawing a replacement (Pass) is always free.",
  "skips.unlimited": "Unlimited",

  // — play —
  "play.loading": "Loading your game…",
  "play.turn": "{name}'s turn",
  "play.tile": "tile {tile}",
  "play.tile.start": "start",
  "play.end": "End game",
  "play.end.confirm": "End this game? Nothing is saved from a session.",
  "play.deck.loading": "Loading your deck…",
  "play.deck.unavailable":
    "This deck isn't available right now — check your connection, or end the game and pick another deck.",

  // — prompt card —
  "card.reason.tile": "Your card",
  "card.reason.ladder": "Closer card 🪜",
  "card.reason.charm": "You charmed the snake 🐍",
  "card.kind.question": "Ask each other",
  "card.kind.action": "Do it",
  "card.kind.together": "Together",
  "card.done": "Done ✨",
  "card.pass": "Pass",
  "card.skip": "Skip · {count} left",
  "card.skip.unlimited": "Skip",
  "card.consent": "Passing is always fine. Nothing is recorded either way.",

  // — snake choice —
  "snake.title": "A snake, {name}!",
  "snake.body":
    "Slide from {from} down to {to}… or charm it with a dare and stay put.",
  "snake.charm": "Charm the snake — take a dare",
  "snake.accept": "Accept the slide to {to}",

  // — zone exhaustion choice —
  "exhaust.title": "You've drawn every card here",
  "exhaust.body":
    "This stretch of the {tier} deck is out of fresh cards. Shuffle it for another round, or move up a tier together.",
  "exhaust.stay": "Reshuffle & stay {tier}",
  "exhaust.advance": "Move up to {tier}",
  "exhaust.advance.note":
    "Moving up needs a tap from each of you — it never happens on its own.",
  "exhaust.confirm": "{name}: I'm in",
  "exhaust.confirmed": "{name} is in ✓",
  "exhaust.back": "Back",

  // — recap —
  "recap.empty": "No finished games yet.",
  "recap.empty.cta": "Start one",
  "recap.headline": "First to the finish: {name}!",
  "recap.subtitle": "A {tier} journey, finished together.",
  "recap.stat.minutes": "Minutes together",
  "recap.stat.cards": "Cards drawn",
  "recap.stat.ladders": "Ladders climbed",
  "recap.stat.charmed": "Snakes charmed",
  "recap.stat.slides": "Slides taken",
  "recap.stat.rolls": "Rolls",
  "recap.stat.skips": "Skips used",
  "recap.again": "Play again",
  "recap.home": "Home",
  "recap.privacy":
    "This recap lives only on this phone. What you said and did isn't stored anywhere.",

  // — age gate —
  "ageGate.title": "Adults only",
  "ageGate.body":
    "The Spicy tier contains intimate content intended for adults. Please confirm that both players are 18 or older.",
  "ageGate.confirm": "We're both 18+",
  "ageGate.cancel": "Go back",

  // — settings —
  "settings.title": "Settings",
  "settings.account": "Account",
  "settings.account.signedIn": "Signed in — your Templates sync.",
  "settings.account.why": "Only needed to save your Templates.",
  "settings.account.signIn": "Sign in",
  "settings.account.unconfigured": "Sign-in not configured — see README.",
  "settings.language": "Language",
  "settings.content": "Content",
  "settings.age": "18+ confirmation:",
  "settings.age.confirmed": "confirmed",
  "settings.age.notConfirmed": "not confirmed",
  "settings.age.reset": "Reset",
  "settings.app": "App",
  "settings.app.installed": "Installed on this device ✓",
  "settings.app.install": "Install Spark on this device",
  "settings.app.iosHint.before": "To install on iPhone: tap ",
  "settings.app.iosHint.share": "Share",
  "settings.app.iosHint.mid": " → ",
  "settings.app.iosHint.add": "Add to Home Screen",
  "settings.app.iosHint.after": ".",
  "settings.app.eligible":
    "Your browser will offer installation once eligible.",
  "settings.data": "Your data",
  "settings.data.body":
    "Games in progress, recaps, preferences and cached decks live only on this device.",
  "settings.data.privacyLink": "Read how privacy works",
  "settings.data.clear": "Clear all local data",
  "settings.data.cleared": "Cleared ✓",
  "settings.data.confirm":
    "Erase all local Spark data on this device? This can't be undone.",

  // — templates list —
  "templates.title": "My Templates",
  "templates.new": "+ New",
  "templates.blurb":
    "Templates hold setups only — boards, decks and your pinned prompts. Never what happened while playing.",
  "templates.unconfigured.before":
    "Cloud saves need Clerk + Convex configured. You can still build and play Templates from ",
  "templates.unconfigured.link": "New Template",
  "templates.unconfigured.after": ".",
  "templates.signIn.note": "Sign in to keep your Templates on every device.",
  "templates.signIn": "Sign in",
  "templates.loading": "Loading…",
  "templates.empty.before": "Nothing saved yet — build one with ",
  "templates.empty.new": "+ New",
  "templates.empty.after": ".",
  "templates.meta.pins": "{count} pinned prompts",
  "templates.meta.skips": "{count} skips",
  "templates.meta.skips.unlimited": "unlimited skips",
  "templates.play": "Play",
  "templates.delete": "Delete",
  "templates.delete.confirm": 'Delete "{name}"?',

  // — template builder —
  "builder.title": "Build a Template",
  "builder.blurb":
    "Pin your own prompts to specific tiles — inside jokes, real plans, your own dares. They override deck draws on those tiles.",
  "builder.name": "Name",
  "builder.name.placeholder": "Anniversary special",
  "builder.tier": "Tier",
  "builder.deck": "Deck",
  "builder.deck.sample": "Sample Deck",
  "builder.skips": "Skips per player",
  "builder.pins": "Pinned Prompts",
  "builder.pins.add": "+ Add Pinned Prompt",
  "builder.pins.tile": "Tile",
  "builder.pins.kind.question": "Question",
  "builder.pins.kind.action": "Action",
  "builder.pins.kind.together": "Together",
  "builder.pins.remove": "Remove",
  "builder.pins.placeholder": "Your prompt text…",
  "builder.pin.outOfRange": "Pick a tile between 1 and 99.",
  "builder.pin.snakeHead":
    "That's a snake head — the slide would swallow this card.",
  "builder.pin.ladderFoot":
    "That's a ladder foot — the climb would skip this card.",
  "builder.pin.finish":
    "The finish tile ends the game — no card can fire there.",
  "builder.play": "Play now",
  "builder.blocked": "Move the flagged cards to open tiles first.",
  "builder.save": "Save to My Templates",
  "builder.saving": "Saving…",
  "builder.save.error":
    "Couldn't save — check your connection and sign-in, then try again.",
  "builder.save.signIn": "Sign in to save this Template",
  "builder.save.unconfigured":
    "Saving needs Clerk + Convex configured — playing works right now.",

  // — privacy —
  "privacy.title": "Privacy, plainly",
  "privacy.intro.before":
    "Spark is a game about intimacy, so we hold one line without exception: ",
  "privacy.intro.strong": "what happens during a session stays on your phone.",
  "privacy.know.title": "Our servers know",
  "privacy.know.1": "Who you are — only if you create an account",
  "privacy.know.2":
    "Game setups you chose to save (board, tier, your Pinned Prompt text)",
  "privacy.know.3": "What you bought, once premium decks exist",
  "privacy.never.title": "Our servers never know",
  "privacy.never.1": "Anything that happened during a game",
  "privacy.never.2": "Which cards you drew, answered, or skipped",
  "privacy.never.3": "Player names — they never leave the device",
  "privacy.never.4":
    "Any answer, note, or photo — we have no way to receive them",
  "privacy.outro.before":
    "Live games, recaps, and preferences are stored only in this browser's local storage. You can wipe everything in ",
  "privacy.outro.link": "Settings → Clear local data",
  "privacy.outro.after":
    ". No accounts are required to play, and there are no ads and no third-party trackers.",

  // — misc —
  "dice.roll": "Roll the die",
} as const;

// Starter deck content — seeded into Convex by convex/seed.ts.
// SERVER-ONLY: this file must never be imported from src/ (deck content
// stays out of the client bundle — PRD §6.2). The tiny client-side demo
// deck lives separately at src/game/demo-deck.ts, on purpose.
//
// Authoring bar (PRD §2.4): actionable in <2 min, no props unless tagged,
// works for any pairing, comfortable to read aloud. Zones escalate WITHIN
// the tier: 1 = warm-up, 2 = deeper, 3 = the tier's full intensity.

type Zone = 1 | 2 | 3;
type Kind = "question" | "action" | "together";

export interface StarterPrompt {
  zone: Zone;
  kind: Kind;
  text: string;
  props?: boolean;
}

export interface StarterDeck {
  slug: string;
  title: string;
  description: string;
  tier: "sweet" | "flirty" | "spicy";
  prompts: StarterPrompt[];
}

export const STARTER_DECKS: StarterDeck[] = [
  {
    slug: "starter-sweet",
    title: "First Steps",
    description: "Warm, curious questions to remember why you like each other.",
    tier: "sweet",
    prompts: [
      // — Zone 1: warm-up
      { zone: 1, kind: "question", text: "What was your very first impression of me — and how wrong was it?" },
      { zone: 1, kind: "question", text: "What's a small thing I do that you secretly love?" },
      { zone: 1, kind: "action", text: "Give your partner your best compliment using exactly five words." },
      { zone: 1, kind: "question", text: "If we had a free Saturday tomorrow with zero obligations, what would we do?" },
      { zone: 1, kind: "action", text: "What song reminds you of us? Sing one line of it — no talking your way out." },
      { zone: 1, kind: "question", text: "What's the best meal we've ever shared, and what made it special?" },
      { zone: 1, kind: "action", text: "Hold eye contact for ten full seconds. Laughing means you draw again." },
      { zone: 1, kind: "question", text: "Which of my friends or family members won you over first?" },
      { zone: 1, kind: "together", text: "Invent a brand-new nickname for each other. You must use them for the rest of the game." },
      { zone: 1, kind: "question", text: "What tiny habit of mine would you miss if it disappeared?" },
      // — Zone 2: deeper
      { zone: 2, kind: "question", text: "When did you realize you were falling for me? The exact moment, if you can." },
      { zone: 2, kind: "question", text: "What were you nervous to tell me early on that seems silly now?" },
      { zone: 2, kind: "action", text: "Describe your partner to an imaginary stranger in thirty seconds. Sell them hard." },
      { zone: 2, kind: "question", text: "What's one thing I've taught you — on purpose or by accident?" },
      { zone: 2, kind: "question", text: "Which memory of us do you replay the most?" },
      { zone: 2, kind: "together", text: "Plan the first stop of your dream trip together, right now, in two minutes." },
      { zone: 2, kind: "question", text: "What do I do when I think no one is watching that makes you smile?" },
      { zone: 2, kind: "action", text: "Thank your partner for something you never actually said thank you for." },
      { zone: 2, kind: "question", text: "What part of our story would make the best movie scene?" },
      { zone: 2, kind: "question", text: "If you could relive one completely ordinary day with me, which would it be?" },
      // — Zone 3: closest
      { zone: 3, kind: "question", text: "What do you hope we're doing ten years from today?" },
      { zone: 3, kind: "question", text: "What's one fear that gets quieter when I'm around?" },
      { zone: 3, kind: "action", text: "Tell your partner the thing you love most about them. Take your time — full sentences." },
      { zone: 3, kind: "question", text: "When have you felt proudest of us as a team?" },
      { zone: 3, kind: "together", text: "Whisper one promise to each other — one each." },
      { zone: 3, kind: "question", text: "What's something about me you hope never changes?" },
      { zone: 3, kind: "question", text: "What has loving me taught you about yourself?" },
      { zone: 3, kind: "action", text: "Hold hands. For twenty seconds, take turns naming things you're grateful for about each other." },
      { zone: 3, kind: "question", text: "If we wrote a book about us, what would the current chapter be called?" },
      { zone: 3, kind: "question", text: "Which dream of mine do you secretly root for the hardest?" },
    ],
  },
  {
    slug: "starter-flirty",
    title: "Slow Burn",
    description: "Teasing, romantic, a little bold — for date nights that spark.",
    tier: "flirty",
    prompts: [
      // — Zone 1: warm-up
      { zone: 1, kind: "action", text: "Wink at your partner like it's the '90s. Rate each other's wink out of ten." },
      { zone: 1, kind: "question", text: "What was I wearing the first time you thought, 'okay… wow'?" },
      { zone: 1, kind: "question", text: "What's my most attractive non-physical trait?" },
      { zone: 1, kind: "action", text: "Give your partner a ten-second compliment — eye contact required." },
      { zone: 1, kind: "action", text: "Flirt with your partner in exactly one sentence. Make it count." },
      { zone: 1, kind: "question", text: "Which emoji do you think of when you think of me? Defend your choice." },
      { zone: 1, kind: "action", text: "Recreate the way your partner looked at you on your first date." },
      { zone: 1, kind: "question", text: "What's the smoothest thing I've ever said or done — accidentally or not?" },
      { zone: 1, kind: "together", text: "Fifteen-second staring contest. Loser owes a kiss on the cheek." },
      { zone: 1, kind: "question", text: "If we matched on a dating app today, what would your opening line be?" },
      // — Zone 2: deeper
      { zone: 2, kind: "question", text: "What's your favorite way I touch you — hand on the back, hair, anything?" },
      { zone: 2, kind: "action", text: "Kiss your partner somewhere unexpected but PG. Five seconds to choose." },
      { zone: 2, kind: "action", text: "Describe your best kiss together like a sports commentator." },
      { zone: 2, kind: "question", text: "Which outfit of mine should I absolutely wear more often?" },
      { zone: 2, kind: "together", text: "Slow dance for thirty seconds. No music allowed — someone has to hum." },
      { zone: 2, kind: "question", text: "What's a date we haven't done yet that you'd say yes to instantly?" },
      { zone: 2, kind: "action", text: "Trace a word on your partner's palm with one finger. They must guess it." },
      { zone: 2, kind: "question", text: "When do you find me most attractive — a specific, ordinary moment?" },
      { zone: 2, kind: "together", text: "One minute on the clock: take turns paying each other compliments. No repeats." },
      { zone: 2, kind: "action", text: "Whisper something in your partner's ear that will make them blush." },
      // — Zone 3: closest
      { zone: 3, kind: "question", text: "What's one thing I do that drives you a little crazy — in the best way?" },
      { zone: 3, kind: "action", text: "Give your partner a thirty-second shoulder massage. Make it a good one." },
      { zone: 3, kind: "question", text: "If tonight ended perfectly, how would it end?" },
      { zone: 3, kind: "action", text: "Kiss for exactly ten seconds. Someone has to count. Good luck." },
      { zone: 3, kind: "question", text: "Which memory of us still makes your heart race?" },
      { zone: 3, kind: "action", text: "Look your partner in the eyes and tell them exactly what you find irresistible about them." },
      { zone: 3, kind: "together", text: "Plan a real date night for this week, right now. It goes in the calendar before the next roll." },
      { zone: 3, kind: "question", text: "Where's your favorite place to be kissed?" },
      { zone: 3, kind: "action", text: "Hold your partner's face in your hands and improvise the most romantic thing you can." },
      { zone: 3, kind: "question", text: "What first drew you to me — and what keeps drawing you now?" },
    ],
  },
  {
    slug: "starter-spicy",
    title: "After Dark",
    description: "Intimate and suggestive — for two adults with the door closed. 18+.",
    tier: "spicy",
    prompts: [
      // — Zone 1: warm-up
      { zone: 1, kind: "question", text: "What am I wearing in your favorite mental image of me?" },
      { zone: 1, kind: "action", text: "Kiss your partner's neck — once, slowly." },
      { zone: 1, kind: "question", text: "What's a compliment about me you've thought but never said out loud?" },
      { zone: 1, kind: "question", text: "In one sentence: the moment this week you wanted me most." },
      { zone: 1, kind: "action", text: "Whisper what you actually thought the first time you saw me — the unfiltered version." },
      { zone: 1, kind: "question", text: "What's my most underrated feature?" },
      { zone: 1, kind: "action", text: "Give your partner one slow kiss anywhere above the shoulders. Take your time." },
      { zone: 1, kind: "question", text: "Candlelight, playlist, or silence — set the scene for a perfect night in." },
      { zone: 1, kind: "together", text: "Invent a code word for 'I want you' that you could safely say anywhere." },
      { zone: 1, kind: "question", text: "What did I do recently that you found unexpectedly hot?" },
      // — Zone 2: deeper
      { zone: 2, kind: "question", text: "When have you found me irresistible at completely the wrong time?" },
      { zone: 2, kind: "action", text: "Trace one finger slowly from your partner's wrist to their shoulder. Keep eye contact." },
      { zone: 2, kind: "question", text: "If you could bottle one of our nights together, which one?" },
      { zone: 2, kind: "action", text: "Whisper what you'd rather be doing right now." },
      { zone: 2, kind: "question", text: "What small thing — a look, a phrase — instantly gets your attention?" },
      { zone: 2, kind: "action", text: "Kiss your partner like the game just ended and you won." },
      { zone: 2, kind: "question", text: "What would you love me to do more often when we're alone?" },
      { zone: 2, kind: "together", text: "Describe your ideal night together, alternating one sentence at a time — five each." },
      { zone: 2, kind: "action", text: "Give your partner a slow kiss on the palm, then the inside of the wrist." },
      { zone: 2, kind: "question", text: "Which of my habits are you most attracted to that I probably don't notice?" },
      // — Zone 3: closest
      { zone: 3, kind: "question", text: "What's one thing you've always wanted to try together but never said out loud?" },
      { zone: 3, kind: "action", text: "Whisper your favorite memory of us alone together — with detail." },
      { zone: 3, kind: "question", text: "What do I do that you never want me to stop doing?" },
      { zone: 3, kind: "action", text: "Kiss your partner for as long as you both like. The game will wait." },
      { zone: 3, kind: "question", text: "If we skipped the rest of this game right now, what would you want to happen next?" },
      { zone: 3, kind: "together", text: "Take turns finishing this sentence, three times each: 'I love it when you…'" },
      { zone: 3, kind: "action", text: "Tell your partner exactly what you find sexiest about them — no deflecting, no jokes." },
      { zone: 3, kind: "question", text: "Which fantasy that we've talked about deserves an actual date on the calendar?" },
      { zone: 3, kind: "action", text: "Turn off the lights for one minute. Make it count." },
      { zone: 3, kind: "question", text: "What's the most memorable night we've ever had — and what made it unforgettable?" },
    ],
  },
];

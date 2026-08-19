import type { BoardPreset, GameState } from "~/game/types";

const TOKEN_COLORS = ["bg-ember", "bg-gold"] as const;

/**
 * 10×10 boustrophedon board, tile 1 at the bottom-left, 100 top-left.
 * Pure display — all rules live in the engine.
 */
export function Board({ preset, state }: { preset: BoardPreset; state: GameState }) {
  const cells = [];
  for (let visualRow = 0; visualRow < 10; visualRow++) {
    const row = 9 - visualRow; // board row 0 is the bottom row
    for (let visualCol = 0; visualCol < 10; visualCol++) {
      const col = row % 2 === 0 ? visualCol : 9 - visualCol;
      cells.push(row * 10 + col + 1);
    }
  }

  return (
    <div className="grid aspect-square w-full grid-cols-10 gap-[3px] rounded-xl bg-plum p-[3px]">
      {cells.map((tile) => (
        <Tile key={tile} tile={tile} preset={preset} state={state} />
      ))}
    </div>
  );
}

function Tile({ tile, preset, state }: { tile: number; preset: BoardPreset; state: GameState }) {
  const ladderTop = preset.ladders[tile];
  const snakeTail = preset.snakes[tile];
  const isNeutral = preset.neutralTiles.includes(tile);

  const tone = ladderTop
    ? "bg-emerald-900/70 text-emerald-300"
    : snakeTail
      ? "bg-rose-950/80 text-rose-300"
      : isNeutral
        ? "bg-plum-light/40 text-mist/40"
        : "bg-plum-light/70 text-mist/70";

  const tokens = state.players
    .map((p, i) => ({ ...p, i: i as 0 | 1 }))
    .filter((p) => p.position === tile);

  return (
    <div className={`relative flex flex-col items-center justify-center rounded-[3px] text-[8px] leading-none ${tone}`}>
      <span>{tile}</span>
      {ladderTop && <span className="mt-px">▲{ladderTop}</span>}
      {snakeTail && <span className="mt-px">▼{snakeTail}</span>}
      {tokens.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center gap-[2px]">
          {tokens.map((p) => (
            <span
              key={p.i}
              className={`h-2.5 w-2.5 rounded-full ring-1 ring-midnight ${TOKEN_COLORS[p.i]} ${
                state.current === p.i && state.phase !== "finished" ? "animate-pulse" : ""
              }`}
              title={p.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}

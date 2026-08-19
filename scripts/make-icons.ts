// Generates the PWA icon set (placeholder brand mark: ember spark on plum)
// with zero image dependencies — raw PNG encoding via node:zlib.
// Replace with real brand assets before launch; re-run with `bun run icons`.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PLUM = [0x24, 0x1a, 0x33, 255] as const;
const EMBER = [0xff, 0x4f, 0x66, 255] as const;

function crc32(buf: Uint8Array): number {
  let crc = ~0;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set([...type].map((c) => c.charCodeAt(0)), 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/** Four-point "spark" star: |dx|^0.6 + |dy|^0.6 <= r^0.6 (concave diamond). */
function makeIcon(size: number, sparkRadiusRatio: number): Uint8Array {
  const c = (size - 1) / 2;
  const r = size * sparkRadiusRatio;
  const exp = 0.6;
  const raw = new Uint8Array(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const inSpark =
        Math.pow(Math.abs(x - c) / r, exp) + Math.pow(Math.abs(y - c) / r, exp) <= 1;
      const [rr, gg, bb, aa] = inSpark ? EMBER : PLUM;
      const px = rowStart + 1 + x * 4;
      raw[px] = rr;
      raw[px + 1] = gg;
      raw[px + 2] = bb;
      raw[px + 3] = aa;
    }
  }

  const ihdr = new Uint8Array(13);
  const iv = new DataView(ihdr.buffer);
  iv.setUint32(0, size);
  iv.setUint32(4, size);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", new Uint8Array(deflateSync(raw))),
    chunk("IEND", new Uint8Array(0)),
  ];
  const total = parts.reduce((n, p) => n + p.length, 0);
  const png = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    png.set(p, offset);
    offset += p.length;
  }
  return png;
}

const outDir = join(import.meta.dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const targets: Array<[string, number, number]> = [
  ["pwa-192.png", 192, 0.42],
  ["pwa-512.png", 512, 0.42],
  // maskable: artwork inside the inner 80% safe zone
  ["pwa-512-maskable.png", 512, 0.3],
  ["apple-touch-icon.png", 180, 0.42],
];

for (const [name, size, ratio] of targets) {
  writeFileSync(join(outDir, name), makeIcon(size, ratio));
  console.log(`✓ public/icons/${name}`);
}

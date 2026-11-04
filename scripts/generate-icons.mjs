// Generates simple emerald rounded icons with a house glyph (no dependencies).
// Run: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};

function png(size, { maskable = false, rounded = true } = {}) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const r = rounded ? size * 0.22 : 0;
  const scale = maskable ? 0.62 : 0.78; // glyph scale (maskable keeps safe zone)
  const cx = size / 2;
  const u = (size * scale) / 100;
  const ox = cx - 50 * u;
  const oy = size / 2 - 50 * u;

  const inRound = (x, y) => {
    if (!rounded) return true;
    const dx = Math.max(r - x, 0, x - (size - 1 - r));
    const dy = Math.max(r - y, 0, y - (size - 1 - r));
    return dx * dx + dy * dy <= r * r;
  };
  const sign = (px, py, ax, ay, bx, by) => (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const inTri = (px, py, a, b, c) => {
    const d1 = sign(px, py, a[0], a[1], b[0], b[1]);
    const d2 = sign(px, py, b[0], b[1], c[0], c[1]);
    const d3 = sign(px, py, c[0], c[1], a[0], a[1]);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  // house glyph in a 100x100 box
  const isHouse = (gx, gy) => {
    const roof = inTri(gx, gy, [50, 12], [8, 50], [92, 50]);
    const body = gx >= 20 && gx <= 80 && gy >= 48 && gy <= 88;
    const door = gx >= 43 && gx <= 57 && gy >= 62 && gy <= 88;
    return (roof || body) && !door;
  };

  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const i = row + 1 + x * 4;
      const t = (x + y) / (2 * size);
      let px = [6, 78, 59]; // #064e3b
      let a = 255;
      if (maskable || inRound(x, y)) {
        // gentle gradient to emerald-600
        px = [6 + t * 10, 78 + t * 40, 59 + t * 30];
        if (isHouse((x - ox) / u, (y - oy) / u)) px = [255, 255, 255];
      } else a = 0;
      raw[i] = px[0];
      raw[i + 1] = px[1];
      raw[i + 2] = px[2];
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", png(192));
writeFileSync("public/icons/icon-512.png", png(512));
writeFileSync("public/icons/maskable-512.png", png(512, { maskable: true, rounded: false }));
// iOS applies its own rounding; use a full-bleed square
writeFileSync("public/icons/apple-touch-icon.png", png(180, { maskable: true, rounded: false }));
console.log("icons generated");

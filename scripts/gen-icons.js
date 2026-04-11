/**
 * Generate PWA icons (192x192 and 512x512) using Canvas API via node-canvas.
 * Fallback: if canvas is not available, create placeholder PNG files using raw PNG bytes.
 *
 * Usage: node scripts/gen-icons.js
 */

const fs   = require("fs");
const path = require("path");

const ICONS_DIR = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(ICONS_DIR, { recursive: true });

// ─── Minimal PNG generator (pure Node, no deps) ─────────────────────────────
// Generates a solid-color PNG with a white "T" letter drawn pixel by pixel.

const zlib = require("zlib");

/** Write a 4-byte big-endian uint32 */
function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

/** CRC32 table */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const payload   = Buffer.concat([typeBytes, data]);
  const crc       = u32(crc32(payload));
  return Buffer.concat([u32(data.length), typeBytes, data, crc]);
}

/**
 * Create a PNG with:
 *  - solid background color (bg)
 *  - a centred white letter "T" drawn as thick pixels
 * @param {number} size  - image dimension in px
 * @param {number[]} bg  - [R, G, B] background
 * @returns {Buffer}
 */
function makePNG(size, bg) {
  const [R, G, B] = bg;

  // Build raw RGBA rows
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      // Safe zone for maskable icons: ~20% padding
      const pad    = Math.floor(size * 0.20);
      const inner  = size - pad * 2;

      // "T" geometry (relative to inner box)
      const barH  = Math.max(3, Math.floor(inner * 0.14)); // horizontal bar height
      const stemW = Math.max(3, Math.floor(inner * 0.18)); // vertical stem width

      const rx = x - pad;
      const ry = y - pad;

      const inTopBar = ry >= 0 && ry < barH && rx >= 0 && rx < inner;
      const stemX    = Math.floor((inner - stemW) / 2);
      const inStem   = rx >= stemX && rx < stemX + stemW && ry >= 0 && ry < inner;

      const isLetter = inTopBar || inStem;

      if (isLetter) {
        row.push(255, 255, 255, 255); // white
      } else {
        row.push(R, G, B, 255);       // brand colour
      }
    }
    rows.push(Buffer.from(row));
  }

  // Compress with zlib (deflate)
  const rawData = Buffer.concat(rows.map(r => Buffer.concat([Buffer.from([0]), r])));
  const compressed = zlib.deflateSync(rawData, { level: 9 });

  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = chunk("IHDR", Buffer.concat([
    u32(size), u32(size),
    Buffer.from([8, 2, 0, 0, 0]), // bit depth 8, RGB+Alpha (actually 8,6 = RGBA)
  ]));
  // Patch: color type 6 = RGBA
  const ihdrFixed = chunk("IHDR", Buffer.concat([
    u32(size), u32(size),
    Buffer.from([8, 6, 0, 0, 0]),
  ]));

  const idat = chunk("IDAT", compressed);
  const iend = chunk("IEND", Buffer.alloc(0));

  return Buffer.concat([sig, ihdrFixed, idat, iend]);
}

// Brand blue: #0A2463
const BRAND = [10, 36, 99];

const sizes = [192, 512];
for (const s of sizes) {
  const png  = makePNG(s, BRAND);
  const dest = path.join(ICONS_DIR, `icon-${s}.png`);
  fs.writeFileSync(dest, png);
  console.log(`✓ Created ${dest} (${png.length} bytes)`);
}

console.log("PWA icons generated successfully.");

/**
 * Generates PWA / touch icons and the social share image from the brand hero photo.
 *
 *   node scripts/generate-brand-icons.mjs
 *
 * Source: public/brand/auth-bg-v31.jpg (the tyre-ring portrait).
 * Output: public/icons/*.png, src/app/favicon.ico and public/brand/og-image.png (committed; re-run only when the
 * brand art changes). Swap the source crop for a proper logo mark when one exists.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(root, "public/brand/auth-bg-v31.jpg");
const ICONS = resolve(root, "public/icons");
/** Brand copper sampled from the hero background (matches manifest background_color). */
const COPPER = "#af6533";

/** Square crop around the tyre ring (hero photo is 720x1280, ring centred near 360,635). */
const RING = { left: 150, top: 425, width: 420, height: 420 };

await mkdir(ICONS, { recursive: true });

const ring = () => sharp(SRC).extract(RING);

/** Ring crop as a circular badge (transparent corners) so it sits cleanly on a flat copper field. */
async function badge(size) {
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );
  return ring()
    .resize(size, size, { fit: "cover" })
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

/** Full-bleed icon: ring fills the square. */
async function fullBleed(size, file) {
  await ring().resize(size, size, { fit: "cover" }).png({ compressionLevel: 9, palette: true, quality: 82, colours: 96 }).toFile(resolve(ICONS, file));
}

/** Maskable icon: ring sits inside the central 80% safe zone on a solid copper field. */
async function maskable(size, file) {
  const inner = Math.round(size * 0.74);
  const ringBuf = await badge(inner);
  await sharp({
    create: { width: size, height: size, channels: 3, background: COPPER },
  })
    .composite([{ input: ringBuf, gravity: "center" }])
    .png({ compressionLevel: 9, palette: true, quality: 82, colours: 96 })
    .toFile(resolve(ICONS, file));
}

await fullBleed(192, "icon-192.png");
await fullBleed(512, "icon-512.png");
await maskable(512, "icon-maskable-512.png");
await fullBleed(180, "apple-touch-icon.png");
await fullBleed(32, "favicon-32.png");

/** src/app/favicon.ico: a PNG-in-ICO container (valid in every current browser). */
async function writeFaviconIco(size) {
  // Next's ICO decoder only accepts RGBA PNG data, so no palette quantisation here (48px is tiny anyway).
  const png = await ring().resize(size, size, { fit: "cover" }).ensureAlpha().png({ compressionLevel: 9 }).toBuffer();
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8); // image size
  entry.writeUInt32LE(22, 12); // offset (6 + 16)
  await writeFile(resolve(root, "src/app/favicon.ico"), Buffer.concat([header, entry, png]));
}
await writeFaviconIco(48);

/** 1200x630 social card: copper field, ring on the left, wordmark + tagline on the right. */
const W = 1200;
const H = 630;
const ringSize = 460;
const ringBuf = await badge(ringSize);
const text = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <style>
      .t { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; fill: #ffffff; }
    </style>
    <text x="640" y="265" class="t" font-size="150" font-weight="800">Ona</text>
    <text x="644" y="335" class="t" font-size="38" font-weight="600">Roadside help in Nigeria</text>
    <text x="644" y="400" class="t" font-size="29" font-weight="400" opacity="0.94">Mechanics, vulcanizers and</text>
    <text x="644" y="438" class="t" font-size="29" font-weight="400" opacity="0.94">tow trucks near you.</text>
    <text x="644" y="490" class="t" font-size="29" font-weight="400" opacity="0.94">Request, agree a price and</text>
    <text x="644" y="528" class="t" font-size="29" font-weight="400" opacity="0.94">track your repair.</text>
  </svg>`,
);
await sharp({ create: { width: W, height: H, channels: 3, background: COPPER } })
  .composite([
    { input: ringBuf, left: 90, top: Math.round((H - ringSize) / 2) },
    { input: text, left: 0, top: 0 },
  ])
  .png({ compressionLevel: 9, palette: true })
  .toFile(resolve(root, "public/brand/og-image.png"));

console.log("Wrote public/icons/* and public/brand/og-image.png");

// Generates the Tafnit icon family from public/app-icon-source.png.
// Run once: `node scripts/generate-icons.mjs`.
//
// We:
//   1. Trim the flat white margins around the brain logo.
//   2. Center-crop a tight square and resize to PWA + favicon sizes.
//   3. Render a navy-padded "maskable" variant for Android.
//
// Run again any time the source artwork changes.

import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const src = resolve(root, "public/app-icon-source.png");
const publicDir = resolve(root, "public");

const NAVY = { r: 0x0f, g: 0x2a, b: 0x55, alpha: 1 };
const WHITE = { r: 0xff, g: 0xff, b: 0xff, alpha: 1 };

/** Trim white padding, then zoom in slightly so the brain fills the tile. */
const CROP_ZOOM = 0.95;

const sizes = [
  { out: "favicon-16.png", size: 16 },
  { out: "favicon-32.png", size: 32 },
  { out: "favicon-64.png", size: 64 },
  { out: "apple-touch-icon.png", size: 180 },
  { out: "app-icon-192.png", size: 192 },
  { out: "app-icon-512.png", size: 512 },
];

mkdirSync(publicDir, { recursive: true });

async function croppedSquareBuffer() {
  const trimmed = await sharp(src).trim({ threshold: 15 }).toBuffer();
  const { width, height } = await sharp(trimmed).metadata();
  const side = Math.round(Math.min(width, height) * CROP_ZOOM);
  const left = Math.round((width - side) / 2);
  const top = Math.round((height - side) / 2);

  return sharp(trimmed)
    .extract({ left, top, width: side, height: side })
    .png()
    .toBuffer();
}

const cropped = await croppedSquareBuffer();

for (const { out, size } of sizes) {
  await sharp(cropped)
    .resize(size, size, { fit: "fill", background: WHITE })
    .flatten({ background: WHITE })
    .png({ compressionLevel: 9 })
    .toFile(resolve(publicDir, out));
  console.log("wrote", out, size);
}

// Maskable version — navy background + safe padding for Android squircles.
async function maskable(outName, size) {
  const inner = Math.round(size * 0.86);
  const padding = Math.round((size - inner) / 2);
  const inset = await sharp(cropped)
    .resize(inner, inner, { fit: "fill", background: WHITE })
    .flatten({ background: WHITE })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: NAVY,
    },
  })
    .composite([{ input: inset, top: padding, left: padding }])
    .png({ compressionLevel: 9 })
    .toFile(resolve(publicDir, outName));
  console.log("wrote", outName, size);
}

await maskable("app-icon-maskable-192.png", 192);
await maskable("app-icon-maskable-512.png", 512);

// Generic favicon.ico — a single 32px PNG renamed so browsers that look
// for /favicon.ico don't 404.
await sharp(cropped)
  .resize(32, 32, { fit: "fill", background: WHITE })
  .flatten({ background: WHITE })
  .png({ compressionLevel: 9 })
  .toFile(resolve(publicDir, "favicon.ico"));

console.log("done");

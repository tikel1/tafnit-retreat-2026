// Generates the Tafnit icon family from public/app-icon-source.png.
// Run once: `node scripts/generate-icons.mjs`.
//
// We:
//   1. Crop the flat brain logo to a square (it ships as ~1024x1024 already).
//   2. Resize to PWA + favicon sizes.
//   3. Render a navy-padded "maskable" variant for Android.
//
// Run again any time the source artwork changes.

import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const src = resolve(root, "public/app-icon-source.png");
const publicDir = resolve(root, "public");

const NAVY = { r: 0x0f, g: 0x2a, b: 0x55, alpha: 1 };

const sizes = [
  { out: "favicon-16.png", size: 16 },
  { out: "favicon-32.png", size: 32 },
  { out: "favicon-64.png", size: 64 },
  { out: "apple-touch-icon.png", size: 180 },
  { out: "app-icon-192.png", size: 192 },
  { out: "app-icon-512.png", size: 512 },
];

mkdirSync(publicDir, { recursive: true });

for (const { out, size } of sizes) {
  await sharp(src)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(resolve(publicDir, out));
  console.log("wrote", out, size);
}

// Maskable version — navy background + ~20% padding so the brain still
// reads as the dominant shape when Android crops to a circle / squircle.
async function maskable(outName, size) {
  const inner = Math.round(size * 0.78);
  const padding = Math.round((size - inner) / 2);
  const inset = await sharp(src)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
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
await sharp(src)
  .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png({ compressionLevel: 9 })
  .toFile(resolve(publicDir, "favicon.ico"));

console.log("done");

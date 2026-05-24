// Generate the OG / Twitter share image from the hero key art.
// 1200x630 is the canonical OG aspect; we letterbox the square brain
// onto the cream background so the artwork is never cropped.

import sharp from "sharp";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const src = resolve(root, "public/images/hero-key-art.png");
const out = resolve(root, "public/images/og-cover.jpg");

const CREAM = { r: 0xfb, g: 0xf8, b: 0xef, alpha: 1 };

const W = 1200;
const H = 630;
const inset = Math.round(H * 0.9);

const brain = await sharp(src)
  .resize(inset, inset, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

await sharp({
  create: { width: W, height: H, channels: 3, background: CREAM },
})
  .composite([{ input: brain, top: Math.round((H - inset) / 2), left: Math.round((W - inset) / 2) }])
  .jpeg({ quality: 88 })
  .toFile(out);

console.log("wrote", out);

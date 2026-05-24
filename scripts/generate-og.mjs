// Generate the OG / WhatsApp share image (1200×630).
// Square brain key-art centered on cream, with a navy footer band
// carrying the app name + dates so link previews look polished.

import sharp from "sharp";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const src = resolve(root, "public/images/hero-key-art.png");
const out = resolve(root, "public/images/og-cover.jpg");

const CREAM = { r: 0xfb, g: 0xf8, b: 0xef, alpha: 1 };
const W = 1200;
const H = 630;
const FOOTER_H = 140;
const brainSize = 460;

const brain = await sharp(src)
  .resize(brainSize, brainSize, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

const footerSvg = Buffer.from(`
<svg width="${W}" height="${FOOTER_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${FOOTER_H}" fill="#0F2A55"/>
  <rect y="0" width="${W}" height="4" fill="#6BB89A"/>
  <text x="600" y="82" text-anchor="middle" direction="rtl" unicode-bidi="embed"
        fill="#FBF8EF" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700">
    נופש חברה - תפנית 26&apos;
  </text>
</svg>`);

const footer = await sharp(footerSvg).png().toBuffer();

const brainTop = Math.round((H - FOOTER_H - brainSize) / 2) + 8;
const brainLeft = Math.round((W - brainSize) / 2);

await sharp({
  create: { width: W, height: H, channels: 3, background: CREAM },
})
  .composite([
    { input: brain, top: brainTop, left: brainLeft },
    { input: footer, top: H - FOOTER_H, left: 0 },
  ])
  .jpeg({ quality: 90 })
  .toFile(out);

console.log("wrote", out);

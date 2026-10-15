// Genererar appens ikoner (PWA och iOS) från public/icons/icon.svg.
//
// Källbilden har fylld bakgrund och symbolen inom den inre cirkeln med 40 % radie. Samma bild
// fungerar därför som vanlig ikon, som maskable-ikon (plattformen beskär själv) och på iOS,
// som kräver fylld yta. Kör `yarn generate:pwa-icons` efter att källbilden bytts ut.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const SOURCE = 'public/icons/icon.svg';

const OUTPUTS = [
  { path: 'public/icons/icon-192.png', size: 192 },
  { path: 'public/icons/icon-512.png', size: 512 },
  { path: 'public/icons/icon-maskable-512.png', size: 512 },
  { path: 'src/app/apple-icon.png', size: 180 },
];

const resolveFromHere = (path) => fileURLToPath(new URL(path, import.meta.url));

const source = await readFile(resolveFromHere(SOURCE));
const { width: sourceWidth } = await sharp(source).metadata();

for (const output of OUTPUTS) {
  // Ritas i dubbel upplösning och skalas ned för mjukare kanter.
  const density = (72 * output.size * 2) / sourceWidth;
  await sharp(source, { density })
    .resize(output.size, output.size, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toFile(resolveFromHere(output.path));
  console.log(`Skapade ${output.path}`);
}

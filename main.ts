// koi-teacup-breakout — ai-excited-01 entry.
//
// Writes one dramatic image to the output directory: a colossal
// orange-and-white koi fish bursting out of a tiny shattered porcelain
// teacup, water arc and cherry-blossom petals exploding toward the viewer.
// The image is bundled with this entry as entry.png; this program
// validates it and copies it to $MAKEFUN_OUTPUT_DIR/entry.png.
//
// Usage:   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Node 22, standard library only (node:fs, node:path).

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BYTES = 1_048_576; // 1 MiB cap for the entry image
const OUTPUT_NAME = "entry.png";

// Resolve the source image next to this script, wherever it is run from.
const scriptDir = dirname(fileURLToPath(import.meta.url));
const sourcePath = resolve(scriptDir, OUTPUT_NAME);

// Resolve the destination directory, defaulting to /output per the kit.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const destPath = join(resolve(outputDir), OUTPUT_NAME);

function fail(message) {
  console.error(`koi-teacup-breakout: ${message}`);
  process.exit(1);
}

// 1. The source image must exist.
if (!existsSync(sourcePath)) {
  fail(`source image not found: ${sourcePath}`);
}

// 2. It must fit the 1 MiB size limit.
const size = statSync(sourcePath).size;
if (size === 0) {
  fail(`source image is empty: ${sourcePath}`);
}
if (size > MAX_BYTES) {
  fail(`source image is ${size} bytes, over the ${MAX_BYTES} byte limit`);
}

// 3. Its first bytes must be a JPEG (FF D8) or PNG (89 50 4E 47) magic.
const header = readFileSync(sourcePath).subarray(0, 8);
const isJpeg = header[0] === 0xff && header[1] === 0xd8;
const isPng =
  header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
if (!isJpeg && !isPng) {
  const seen = [...header.subarray(0, 4)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
  fail(
    `source image has unknown magic bytes (${seen}), expected JPEG (ff d8) or PNG (89 50 4e 47): ${sourcePath}`,
  );
}

// 4. Copy it to the output directory, creating the directory if needed.
mkdirSync(resolve(outputDir), { recursive: true });
copyFileSync(sourcePath, destPath);

// 5. Confirm the copy landed intact.
const written = statSync(destPath).size;
if (written !== size) {
  fail(`copy mismatch: wrote ${written} bytes, expected ${size}`);
}

const format = isJpeg ? "JPEG" : "PNG";
console.log(`koi-teacup-breakout: wrote ${written} bytes (${format}) to ${destPath}`);

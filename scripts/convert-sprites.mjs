#!/usr/bin/env node
/**
 * Converts creator .ase sources (sprites/ase/<type>/) into engine-ready PNGs
 * (sprites/png/<type>/).
 *
 * characters/: one .ase per facing (<name>_facingleft.ase, <name>_facingright.ase),
 *   4 frames each (idle1, idle2, walk1, walk2) of 32x48 →
 *   one sheet per character, 128x96 (row 0 = left, row 1 = right).
 * other types: frame 0 flattened 1:1 at parsed canvas size.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { Aseprite } from "@pixelation/aseprite";
import { PNG } from "pngjs";

const ROOT = "sprites";
const FRAME_W = 32;
const FRAME_H = 48;
const COLS = 4;

function toBuffer(view) {
  return Buffer.from(view);
}

function compositeCel(target, cel, offsetX, offsetY, canvasW) {
  const { x, y, width, height } = cel;
  const pixels = cel.pixels;
  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const p = pixels[py * width + px];
      const a = p[3];
      if (a === 0) continue;
      const tx = offsetX + x + px;
      const ty = offsetY + y + py;
      if (tx < 0 || ty < 0 || tx >= canvasW || ty >= target.height) continue;
      const i = (ty * canvasW + tx) * 4;
      const srcA = a / 255;
      const dstA = target.data[i + 3] / 255;
      const outA = srcA + dstA * (1 - srcA);
      for (let c = 0; c < 3; c++) {
        target.data[i + c] = Math.round(
          (p[c] * srcA + target.data[i + c] * dstA * (1 - srcA)) / (outA || 1),
        );
      }
      target.data[i + 3] = Math.round(outA * 255);
    }
  }
}

function flattenFrame(ase, frameIndex) {
  const frame = ase.frames[frameIndex];
  const w = ase.header.width;
  const h = ase.header.height;
  const png = new PNG({ width: w, height: h });
  png.data.fill(0);
  for (const layer of frame.layers) {
    if (!layer.visible) continue;
    for (const cel of layer.cels) compositeCel(png, cel, 0, 0, w);
  }
  return png;
}

function pngToBuffer(png) {
  return PNG.sync.write(png);
}

function parseAse(path) {
  const buf = readFileSync(path);
  return new Aseprite(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

function frameToCellPng(ase, frameIndex) {
  const celPng = new PNG({ width: FRAME_W, height: FRAME_H });
  celPng.data.fill(0);
  for (const layer of ase.frames[frameIndex].layers) {
    if (!layer.visible) continue;
    for (const cel of layer.cels) compositeCel(celPng, cel, 0, 0, FRAME_W);
  }
  return celPng;
}

function convertCharacter(srcDir, outDir, baseName) {
  const leftPath = join(srcDir, `${baseName}_facingleft.ase`);
  const rightPath = join(srcDir, `${baseName}_facingright.ase`);
  if (!existsSync(leftPath) || !existsSync(rightPath)) {
    console.warn(`skip ${baseName}: missing facing pair`);
    return;
  }
  const leftAse = parseAse(leftPath);
  const rightAse = parseAse(rightPath);
  for (const [name, ase] of [["left", leftAse], ["right", rightAse]]) {
    if (ase.header.width !== FRAME_W || ase.header.height !== FRAME_H) {
      console.warn(`warn ${baseName} (${name}): canvas ${ase.header.width}x${ase.header.height}, expected ${FRAME_W}x${FRAME_H}`);
    }
    if (ase.frames.length !== COLS) {
      console.warn(`warn ${baseName} (${name}): ${ase.frames.length} frame(s), expected ${COLS} (idle1, idle2, walk1, walk2)`);
    }
  }
  const sheet = new PNG({ width: FRAME_W * COLS, height: FRAME_H * 2 });
  sheet.data.fill(0);
  const rows = [
    [leftAse, 0],
    [rightAse, 1],
  ];
  for (const [ase, row] of rows) {
    for (let f = 0; f < Math.min(ase.frames.length, COLS); f++) {
      const cell = frameToCellPng(ase, f);
      for (let y = 0; y < FRAME_H; y++) {
        const srcStart = y * FRAME_W * 4;
        const dstStart = ((row * FRAME_H + y) * FRAME_W * COLS + f * FRAME_W) * 4;
        sheet.data.set(cell.data.slice(srcStart, srcStart + FRAME_W * 4), dstStart);
      }
    }
  }
  writeFileSync(join(outDir, `${baseName}.png`), pngToBuffer(sheet));
  console.log(`ok characters/${baseName}.png (${sheet.width}x${sheet.height}, left ${leftAse.frames.length}f, right ${rightAse.frames.length}f)`);
}

function convertPassthrough(srcPath, outDir) {
  const ase = parseAse(srcPath);
  if (ase.frames.length > 1) {
    console.warn(`warn ${basename(srcPath)}: ${ase.frames.length} frames, converting frame 0 only`);
  }
  const png = flattenFrame(ase, 0);
  const outName = basename(srcPath).replace(/\.ase(prite)?$/, ".png");
  writeFileSync(join(outDir, outName), pngToBuffer(png));
  console.log(`ok ${outDir.replace(ROOT + "/", "")}/${outName} (${png.width}x${png.height})`);
}

function main() {
  const types = ["characters", "tilesets", "props", "ui"];
  let converted = 0;
  for (const type of types) {
    const srcDir = join(ROOT, "ase", type);
    const outDir = join(ROOT, "png", type);
    if (!existsSync(srcDir)) continue;
    mkdirSync(outDir, { recursive: true });
    const files = readdirSync(srcDir).filter((f) => f.endsWith(".ase") || f.endsWith(".aseprite"));
    if (type === "characters") {
      const bases = new Set(
        files
          .map((f) => f.replace(/\.ase(prite)?$/, ""))
          .filter((n) => n.endsWith("_facingleft") || n.endsWith("_facingright"))
          .map((n) => n.replace(/_facing(left|right)$/, "")),
      );
      for (const base of bases) {
        convertCharacter(srcDir, outDir, base);
        converted++;
      }
    } else {
      for (const f of files) {
        convertPassthrough(join(srcDir, f), outDir);
        converted++;
      }
    }
  }
  console.log(converted === 0 ? "nothing to convert" : `converted ${converted} asset(s)`);
}

main();

#!/usr/bin/env node
/**
 * Build storefront theme assets from modular sources.
 *   src/*.js     → assets/sfc-tools.js
 *   styles/*.css → assets/sfc-tools.css
 */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ext = path.join(root, 'extensions/storefront-tools');
const assets = path.join(ext, 'assets');
const stylesDir = path.join(ext, 'styles');

const cssParts = [
  'base.css',
  'layout.css',
  'hero.css',
  'forms.css',
  'orders.css',
  'tracking.css',
  'shipping-center.css',
];

await esbuild.build({
  entryPoints: [path.join(ext, 'src/index.js')],
  bundle: true,
  outfile: path.join(assets, 'sfc-tools.js'),
  format: 'iife',
  target: ['es2018'],
  minify: false,
  legalComments: 'none',
  logLevel: 'info',
});

const banner = `/*
 * SFC storefront tools — built from extensions/storefront-tools/styles/
 * Do not edit assets/sfc-tools.css directly; run: npm run build:storefront
 */\n\n`;

const cssBody = cssParts
  .map((name) => {
    const file = path.join(stylesDir, name);
    if (!fs.existsSync(file)) {
      throw new Error(`Missing style part: ${name}`);
    }
    return `/* ===== ${name} ===== */\n` + fs.readFileSync(file, 'utf8').trim();
  })
  .join('\n\n');

fs.writeFileSync(path.join(assets, 'sfc-tools.css'), banner + cssBody + '\n');
console.log('Wrote assets/sfc-tools.css from', cssParts.length, 'parts');

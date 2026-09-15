#!/usr/bin/env node
/**
 * CSS syntax guard for the storefront styles.
 *
 * Browsers silently discard invalid rules — for example a selector placed
 * before an at-rule (`.sfc-standalone @media { ... }`) drops the whole block,
 * which is how the responsive / reduced-motion / keyframe rules in
 * tracking.css were once lost. theme-check does not parse CSS, so this uses
 * esbuild's CSS parser (already a dependency) to fail the build on any
 * css-syntax-error before the bundle ships.
 *
 * Run: npm run lint:css
 */
import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stylesDir = path.join(root, 'extensions/storefront-tools/styles');

const files = fs
  .readdirSync(stylesDir)
  .filter((name) => name.endsWith('.css'))
  .sort();

let failed = false;

for (const name of files) {
  const css = fs.readFileSync(path.join(stylesDir, name), 'utf8');
  const result = await esbuild.transform(css, {
    loader: 'css',
    logLevel: 'silent',
  });
  const syntaxErrors = result.warnings.filter(
    (warning) => warning.id === 'css-syntax-error',
  );
  if (syntaxErrors.length > 0) {
    failed = true;
    console.error(`✘ ${name}: ${syntaxErrors.length} CSS syntax error(s)`);
    for (const warning of syntaxErrors) {
      const loc = warning.location
        ? `${warning.location.line}:${warning.location.column}`
        : '-';
      console.error(`  ${loc}  ${warning.text}`);
    }
  }
}

if (failed) {
  console.error(
    '\nCSS syntax errors found. Browsers discard these rules — fix them before shipping.',
  );
  process.exit(1);
}

console.log(`✓ CSS syntax OK (${files.length} file(s) checked)`);

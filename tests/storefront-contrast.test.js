import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {contrastRatio, hexToRgb} from './helpers/contrast.js';

const css = readFileSync(
  new URL('../extensions/storefront-tools/styles/base.css', import.meta.url),
  'utf8',
);
const tokens = Object.fromEntries(
  [...css.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)]
    .map(([, name, color]) => [name, hexToRgb(color)]),
);

const textPairs = [
  ['primary text', '--white', '--signal-cta'],
  ['hover text', '--white', '--signal-dark'],
  ['accent text', '--signal-cta', '--white'],
  ['secondary accent text', '--signal-dark', '--white'],
  ['selected navigation text', '--signal-dark', '--signal-soft'],
  ['ink on brand orange', '--ink', '--signal'],
];

describe('contrast calculation', () => {
  it('uses the WCAG luminance scale without rounding at the threshold', () => {
    expect(contrastRatio(hexToRgb('#ffffff'), hexToRgb('#000000'))).toBe(21);
    expect(contrastRatio(hexToRgb('#c2410c'), hexToRgb('#c2410c'))).toBe(1);
    expect(contrastRatio(hexToRgb('#ffffff'), hexToRgb('#ff6b16'))).toBeCloseTo(2.85, 2);
  });
});

describe('storefront text contrast tokens', () => {
  it.each(textPairs)('%s meets AA for normal-size text', (_name, foreground, background) => {
    expect(tokens[foreground]).toBeDefined();
    expect(tokens[background]).toBeDefined();
    expect(contrastRatio(tokens[foreground], tokens[background])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the bright brand orange separate from the text-safe accent', () => {
    expect(tokens['--signal']).toEqual(hexToRgb('#ff6b16'));
    expect(tokens['--signal-cta']).not.toEqual(tokens['--signal']);
  });
});

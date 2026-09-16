import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {expect, test} from '@playwright/test';
import {contrastRatio, hexToRgb} from '../helpers/contrast.js';

const stylesheet = readFileSync(
  resolve('extensions/storefront-tools/assets/sfc-tools.css'),
  'utf8',
);

// Exercise the production stylesheet without altering the shared flow fixture
// or pretending that stripping Liquid tags renders a real Shopify page.
const sample = `
  <div class="sfc-standalone" data-sfc-tools-root id="storefront-samples">
    <a href="#" class="button button--primary" id="primary-link">Log in</a>
    <button type="button" class="button button--primary" id="primary-button">Check rates</button>
    <!-- Sample spacing accommodates the real capability strip's negative margin. -->
    <div style="padding: 48px 0">
      <section class="capabilities">
        <article id="capability"><div>
          <strong id="capability-title">Live rates</strong>
          <small id="capability-detail">Compare shipping services</small>
        </div></article>
      </section>
    </div>
    <div class="tracking-input"><button type="button" id="tracking-button">Track</button></div>
    <div class="tracking-widget-state--error"><span id="tracking-error">!</span></div>
    <div class="tracking-placeholder__route">
      <span id="tracking-origin">CN</span><b id="tracking-route">To</b>
    </div>
    <section class="closing-cta" id="closing-cta">
      <div class="closing-cta__inner">
        <div>
          <p class="eyebrow" id="closing-label">READY TO SHIP</p>
          <h2 id="closing-title">Ship with SFC</h2>
        </div>
        <a href="#" class="button button--light" id="light-button">Check rates</a>
      </div>
    </section>
    <span class="hero__line--signal" id="hero-accent">Ship from China</span>
    <p class="eyebrow" id="section-label">SHIPPING TOOLS</p>
    <div class="process-grid"><article><span id="process-number">01</span></article></div>
    <div class="tracking-provider"><strong id="tracking-provider">SFC</strong></div>
    <button type="button" class="sfc-back-top is-visible" id="back-top" aria-label="Back to top">
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <path id="back-top-arrow" fill="currentColor" d="M12 5 4 13l2 2 6-6 6 6 2-2z" />
      </svg>
    </button>
    <span class="demo-ribbon__dot" id="brand-decoration"></span>
  </div>
  <div class="sfc-standalone sfc-shipping-center" data-sfc-tools-root>
    <div class="sfc-center-shell">
      <nav class="sfc-center-nav"><ul class="sfc-center-nav__list"><li>
        <a href="#" class="is-active" id="center-nav">
          <span id="center-nav-label">Overview</span>
          <!-- Constructed sample: this badge has CSS but no current Liquid instance. -->
          <span class="sfc-center-nav__badge" id="center-badge">2</span>
        </a>
      </li></ul></nav>
    </div>
  </div>
`;

const cases = [
  ['#primary-link', '#primary-link', '--white', '--signal-cta'],
  ['#primary-button', '#primary-button', '--white', '--signal-cta'],
  ['#capability-title', '#capability', '--white', '--signal-cta'],
  ['#capability-detail', '#capability', '--white', '--signal-cta'],
  ['#tracking-button', '#tracking-button', '--white', '--signal-cta'],
  ['#tracking-error', '#tracking-error', '--white', '--signal-cta'],
  ['#tracking-origin', '#tracking-origin', '--white', '--signal-cta'],
  ['#tracking-route', '#storefront-samples', '--signal-cta', '--white'],
  ['#closing-label', '#closing-cta', '--white', '--signal-cta'],
  ['#closing-title', '#closing-cta', '--white', '--signal-cta'],
  ['#light-button', '#light-button', '--signal-dark', '--white'],
  ['#hero-accent', '#storefront-samples', '--signal-cta', '--white'],
  ['#section-label', '#storefront-samples', '--signal-dark', '--white'],
  ['#process-number', '#storefront-samples', '--signal-cta', '--white'],
  ['#tracking-provider', '#storefront-samples', '--signal-cta', '--white'],
  ['#back-top', '#back-top', '--white', '--signal-cta'],
  ['#center-nav-label', '#center-nav', '--signal-dark', '--signal-soft'],
  ['#center-badge', '#center-badge', '--white', '--signal-cta'],
];

function opaqueRgb(value) {
  const match = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(value);
  expect(match, `Expected an opaque, settled sRGB color, received ${value}`).not.toBeNull();
  return match.slice(1).map(Number);
}

async function expectContrast(page, foreground, background, foregroundToken, backgroundToken) {
  const text = page.locator(foreground);
  const surface = page.locator(background);
  const tokens = await text.evaluate((el, names) => {
    const style = getComputedStyle(el.closest('.sfc-standalone'));
    return names.map((name) => style.getPropertyValue(name).trim());
  }, [foregroundToken, backgroundToken]);
  const [expectedForeground, expectedBackground] = tokens.map(
    (token) => `rgb(${hexToRgb(token).join(', ')})`,
  );

  // Auto-retrying CSS assertions wait for the real 180ms color transitions;
  // an immediate computed-style snapshot can see a transparent initial frame.
  await expect(text).toBeVisible();
  await expect(text).toHaveCSS('opacity', '1');
  await expect(surface).toHaveCSS('opacity', '1');
  await expect(text).toHaveCSS('color', expectedForeground);
  await expect(surface).toHaveCSS('background-color', expectedBackground);
  const color = await text.evaluate((el) => getComputedStyle(el).color);
  const backgroundColor = await surface.evaluate((el) => getComputedStyle(el).backgroundColor);
  const ratio = contrastRatio(opaqueRgb(color), opaqueRgb(backgroundColor));
  expect(ratio, `${foreground} on ${background} must meet normal-text AA`).toBeGreaterThanOrEqual(4.5);
}

for (const width of [1280, 375]) {
  test(`text-bearing accents meet AA at ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height: 900});
    await page.route('**/*', (route) => route.abort());
    await page.setContent(`<!doctype html><html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>${stylesheet}</style></head><body>${sample}</body></html>`);

    for (const entry of cases) {
      await expectContrast(page, ...entry);
    }
    await expect(page.locator('#back-top-arrow')).toHaveCSS('fill', 'rgb(255, 255, 255)');
    await expect(page.locator('#brand-decoration')).toHaveCSS('background-color', 'rgb(255, 107, 22)');

    for (const selector of ['#primary-link', '#primary-button', '#tracking-button', '#back-top']) {
      await page.locator(selector).hover();
      await expectContrast(page, selector, selector, '--white', '--signal-dark');
    }
  });
}

test('focus-visible ring is an opaque ink outline, not the translucent accent', async ({page}) => {
  await page.route('**/*', (route) => route.abort());
  await page.setContent(`<!doctype html><html><head><style>${stylesheet}</style></head>
    <body><div class="sfc-standalone"><input id="focus-probe" type="text" name="x"></div></body></html>`);
  // A text input matches :focus-visible, so the global focus ring applies.
  const input = page.locator('#focus-probe');
  await input.focus();
  await expect(input).toHaveCSS('outline-style', 'solid');
  await expect(input).toHaveCSS('outline-color', 'rgb(22, 41, 47)');
  await expect(input).toHaveCSS('outline-width', '3px');
});

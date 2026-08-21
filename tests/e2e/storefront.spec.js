import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {expect, test} from '@playwright/test';

const fixtureHtml = readFileSync(resolve('tests/fixtures/storefront.html'), 'utf8');
const storefrontBundle = readFileSync(
  resolve('extensions/storefront-tools/assets/sfc-tools.js'),
  'utf8',
);

const rateResponse = {
  ok: true,
  rates: [
    {serviceCode: 'SFC-FAST', serviceName: 'SFC Fast', amount: 120, currency: 'RMB', transitTime: '5–8 days'},
    {serviceCode: 'SFC-SAVER', serviceName: 'SFC Saver', amount: 80, currency: 'RMB', transitTime: '8–12 days'},
  ],
};

async function serveStorefront(page, {compliance = null, onTracking = null} = {}) {
  await page.route('http://sfc.test/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/tests/fixtures/storefront.html') {
      await route.fulfill({status: 200, contentType: 'text/html', body: fixtureHtml});
      return;
    }
    if (path === '/extensions/storefront-tools/assets/sfc-tools.js') {
      await route.fulfill({status: 200, contentType: 'text/javascript', body: storefrontBundle});
      return;
    }

    let body = {ok: false, code: 'NOT_IMPLEMENTED'};
    if (path.endsWith('/rates')) body = rateResponse;
    if (path.endsWith('/account-link')) body = {ok: true};
    if (path.endsWith('/balance')) body = {ok: true, balance: 100, currency: 'RMB'};
    if (path.endsWith('/compliance') && compliance) body = compliance;
    if (path.endsWith('/tracking') && onTracking) onTracking();
    await route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(body)});
  });
}

test('renders live rates sorted by price without browser errors', async ({page}) => {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await serveStorefront(page);
  await page.goto('/tests/fixtures/storefront.html');
  await page.locator('#quote').click();

  await expect(page.getByRole('heading', {name: '2 shipping options found'})).toBeVisible();
  await expect(page.locator('.rate-card__code').first()).toHaveText('SFC-SAVER');
  await expect(page.locator('.rate-card__cta')).toHaveCount(2);
  expect(pageErrors).toEqual([]);
});

test('rejects an invalid tracking number before calling the gateway', async ({page}) => {
  let trackingCalls = 0;
  await serveStorefront(page, {onTracking: () => { trackingCalls += 1; }});
  await page.goto('/tests/fixtures/storefront.html');
  await page.locator('[data-tracking-number]').fill('AB');
  await page.locator('#track').click();

  await expect(page.locator('[data-tracking-widget]')).toContainText(
    'Enter 5–50 letters, numbers or hyphens without spaces.',
  );
  expect(trackingCalls).toBe(0);
});

test('keeps order creation locked while account review is pending', async ({page}) => {
  await serveStorefront(page, {
    compliance: {
      ok: true,
      ready: true,
      accountClass: '1',
      reviewStatus: 'PENDING_REVIEW',
      canPlaceOrders: false,
      files: {},
      profile: {},
      missing: [],
    },
  });
  await page.goto('/tests/fixtures/storefront.html?loggedIn=1');
  await page.locator('#quote').click();
  await page.getByRole('button', {name: 'Order'}).first().click();

  await expect(page.locator('[data-compliance-dialog]')).toHaveAttribute('open', '');
  await expect(page.locator('[data-compliance-review-label]')).toHaveText('Under review');
  await expect(page.locator('[data-order-panel]')).toBeHidden();
});

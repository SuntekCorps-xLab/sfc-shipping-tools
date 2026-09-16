/**
 * Smoke tests for public storefront helpers (no network).
 * Run: npm test
 */
import { describe, expect, it, vi } from 'vitest';
import {readFileSync} from 'node:fs';
import {
  endpoint,
  postJson,
  queryRates,
  queryTracking,
  linkAccount,
  createSfcOrder,
  submitComplianceReview,
  checkCargoCompliance,
} from '../extensions/storefront-tools/src/api.js';
import {
  validateRateInput,
  isValidTrackingNumber,
  escapeHtml,
  estimateFirstMileRmb,
  renderSfcTracking,
  warehouseCopyText,
} from '../extensions/storefront-tools/src/rates.js';
import {
  REVIEW_STATUS,
  cargoDecisionAllowsOrder,
  complianceStatusView,
  isAccountApproved,
  normalizeReviewStatus,
  validateCargoDeclaration,
  validateComplianceFile,
} from '../extensions/storefront-tools/src/compliance.js';
import {formatUsdApprox, rateSortValue, formatAccountBalance} from '../extensions/storefront-tools/src/rate-ui.js';
import {COUNTRIES} from '../extensions/storefront-tools/src/countries.js';
import {isAnalyticsEnabled} from '../extensions/storefront-tools/src/analytics.js';

describe('api.endpoint', () => {
  it('joins base and path', () => {
    expect(endpoint('/apps/sfc-tools', 'rates')).toBe('/apps/sfc-tools/rates');
    expect(endpoint('/apps/sfc-tools/', 'rates')).toBe('/apps/sfc-tools/rates');
  });
});

describe('api.postJson', () => {
  it('POSTs JSON with same-origin credentials for relative URLs', async () => {
    const fetchImpl = vi.fn(async () => ({
      json: async () => ({ ok: true }),
    }));
    const data = await postJson('/apps/sfc-tools/rates', { country: 'US' }, fetchImpl);
    expect(data.ok).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith(
      '/apps/sfc-tools/rates',
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
      }),
    );
  });
});

describe('api clients', () => {
  it('queryRates posts normalized body', async () => {
    const fetchImpl = vi.fn(async () => ({
      json: async () => ({ ok: true, rates: [] }),
    }));
    await queryRates(
      { country: 'us', weight: 1, length: 20, width: 15, height: 10, zipCode: '10001' },
      { fetchImpl },
    );
    const [, init] = fetchImpl.mock.calls[0];
    expect(JSON.parse(init.body)).toMatchObject({
      country: 'US',
      zipCode: '10001',
      weight: 1,
    });
  });

  it('uses the documented storefront proxy paths', async () => {
    const calls = [];
    const fetchImpl = vi.fn(async (url) => {
      calls.push(url);
      return { json: async () => ({ ok: true }) };
    });
    await queryTracking('SF12345', { fetchImpl });
    await linkAccount({ fetchImpl });
    await submitComplianceReview({ fetchImpl });
    await checkCargoCompliance({ declaration: {} }, { fetchImpl });
    await createSfcOrder({ shippingMethod: 'X' }, { fetchImpl });
    expect(calls).toEqual([
      '/apps/sfc-tools/tracking',
      '/apps/sfc-tools/account-link',
      '/apps/sfc-tools/compliance-submit',
      '/apps/sfc-tools/cargo-compliance',
      '/apps/sfc-tools/create-order',
    ]);
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).toEqual({});
  });
});

describe('rate UI formatting', () => {
  it('formats finite values as an approximate USD amount', () => {
    expect(formatUsdApprox(12.5)).toBe('≈ $12.50 USD');
    expect(formatUsdApprox('0')).toBe('≈ $0.00 USD');
  });

  it('omits missing and non-numeric values', () => {
    expect(formatUsdApprox(null)).toBe('');
    expect(formatUsdApprox('')).toBe('');
    expect(formatUsdApprox('not-a-number')).toBe('');
  });
});

describe('rate price sorting', () => {
  it('treats a finite amount as its price and anything else as unpriced', () => {
    expect(rateSortValue({amount: 80})).toBe(80);
    expect(rateSortValue({amount: '90'})).toBe(90);
    expect(rateSortValue({amount: null})).toBe(Infinity);
    expect(rateSortValue({amount: ''})).toBe(Infinity);
    expect(rateSortValue({amount: undefined})).toBe(Infinity);
    expect(rateSortValue({amount: 'abc'})).toBe(Infinity);
    expect(rateSortValue({})).toBe(Infinity);
  });

  it('sorts priced services ascending and unpriced services last', () => {
    const rates = [
      {serviceCode: 'B-NULL', amount: null},
      {serviceCode: 'C-80', amount: 80},
      {serviceCode: 'D-EMPTY', amount: ''},
      {serviceCode: 'A-120', amount: 120},
      {serviceCode: 'E-90', amount: 90},
    ];
    const sorted = [...rates].sort((a, b) => {
      const av = rateSortValue(a);
      const bv = rateSortValue(b);
      return av === bv ? 0 : av - bv;
    });
    expect(sorted.map((rate) => rate.serviceCode)).toEqual([
      'C-80',
      'E-90',
      'A-120',
      'B-NULL',
      'D-EMPTY',
    ]);
  });
});

describe('account balance formatting', () => {
  it('formats a finite balance to two decimals', () => {
    expect(formatAccountBalance(100)).toBe('100.00');
    expect(formatAccountBalance(0)).toBe('0.00');
    expect(formatAccountBalance('1234.5')).toBe('1234.50');
  });

  it('shows an em dash for a missing, empty, or non-numeric balance', () => {
    expect(formatAccountBalance(undefined)).toBe('—');
    expect(formatAccountBalance(null)).toBe('—');
    expect(formatAccountBalance('')).toBe('—');
    expect(formatAccountBalance('¥1,234.50')).toBe('—');
    expect(formatAccountBalance('abc')).toBe('—');
    expect(formatAccountBalance(NaN)).toBe('—');
  });

  it('renders the balance via the guarded formatter, not Number().toFixed', () => {
    const source = readFileSync(
      new URL('../extensions/storefront-tools/src/main.js', import.meta.url),
      'utf8',
    );
    expect(source).toContain('balance: formatAccountBalance(data.balance)');
    expect(source).not.toContain('Number(data.balance).toFixed(2)');
  });
});

describe('account review gate', () => {
  it('fails closed when a complete profile has not been approved', () => {
    expect(isAccountApproved({ready: true})).toBe(false);
    expect(complianceStatusView({ready: true}).label).toBe('Ready to submit');
  });

  it('supports the documented and legacy approved states', () => {
    expect(isAccountApproved({reviewStatus: REVIEW_STATUS.APPROVED_GENERAL})).toBe(true);
    expect(isAccountApproved({reviewStatus: REVIEW_STATUS.APPROVED_DG})).toBe(true);
    expect(normalizeReviewStatus({auditStatus: '1'})).toBe(REVIEW_STATUS.APPROVED_GENERAL);
  });

  it('does not approve unknown, pending, or rejected states', () => {
    expect(isAccountApproved({reviewStatus: 'UNKNOWN_NEW_STATE'})).toBe(false);
    expect(isAccountApproved({reviewStatus: REVIEW_STATUS.PENDING_REVIEW})).toBe(false);
    expect(isAccountApproved({reviewStatus: REVIEW_STATUS.REJECTED})).toBe(false);
    expect(
      isAccountApproved({
        reviewStatus: REVIEW_STATUS.SUSPENDED,
        canPlaceOrders: true,
      }),
    ).toBe(false);
  });
});

describe('shipment cargo gate', () => {
  it('accepts an attested general-cargo declaration', () => {
    const result = validateCargoDeclaration({
      noneOfThese: true,
      declarationAccepted: true,
    });
    expect(result.valid).toBe(true);
    expect(result.decisionHint).toBe('ALLOW');
  });

  it('routes declared special cargo toward review', () => {
    const result = validateCargoDeclaration({
      flags: {battery: true},
      description: 'Two devices containing installed lithium-ion batteries',
      declarationAccepted: true,
    });
    expect(result.valid).toBe(true);
    expect(result.decisionHint).toBe('MANUAL_REVIEW');
  });

  it('rejects contradictory or incomplete declarations', () => {
    expect(
      validateCargoDeclaration({
        noneOfThese: true,
        flags: {liquid: true},
        declarationAccepted: true,
      }).valid,
    ).toBe(false);
    expect(
      validateCargoDeclaration({flags: {liquid: true}, declarationAccepted: true}).valid,
    ).toBe(false);
  });

  it('only accepts an explicit successful ALLOW response', () => {
    expect(
      cargoDecisionAllowsOrder({ok: true, decision: 'ALLOW', reviewId: 'review-1'}),
    ).toBe(true);
    expect(cargoDecisionAllowsOrder({ok: true, decision: 'ALLOW'})).toBe(false);
    expect(cargoDecisionAllowsOrder({ok: true, decision: 'MANUAL_REVIEW'})).toBe(false);
    expect(cargoDecisionAllowsOrder({ok: false, decision: 'ALLOW'})).toBe(false);
    expect(cargoDecisionAllowsOrder({})).toBe(false);
  });
});

describe('compliance document validation', () => {
  it('accepts a non-empty PDF within the size limit', () => {
    expect(validateComplianceFile({type: 'application/pdf', size: 1024}).valid).toBe(true);
  });

  it('rejects unsupported, empty, and oversized files', () => {
    expect(validateComplianceFile({type: 'application/x-msdownload', size: 1024}).valid).toBe(false);
    expect(validateComplianceFile({type: 'image/png', size: 0}).valid).toBe(false);
    expect(validateComplianceFile({type: 'image/png', size: 11 * 1024 * 1024}).valid).toBe(false);
  });
});

describe('order creation regression guard', () => {
  it('keeps the submit handler and both server-side gate calls in the storefront source', () => {
    const source = readFileSync(
      new URL('../extensions/storefront-tools/src/main.js', import.meta.url),
      'utf8',
    );
    expect(source).toContain("orderForm?.addEventListener('submit'");
    expect(source).toContain('await fetchCompliance(');
    expect(source).toContain('await checkCargoCompliance(');
    expect(source).toContain('await createSfcOrder(');
    expect(source.indexOf('await fetchCompliance(')).toBeLessThan(
      source.lastIndexOf('await createSfcOrder('),
    );
    expect(source.indexOf('await checkCargoCompliance(')).toBeLessThan(
      source.lastIndexOf('await createSfcOrder('),
    );
  });

  it('keeps a valid Liquid schema and the required safety-gate controls', () => {
    const liquid = readFileSync(
      new URL(
        '../extensions/storefront-tools/blocks/sfc-shipping-tools.liquid',
        import.meta.url,
      ),
      'utf8',
    );
    const schema = liquid.match(/{% schema %}\s*([\s\S]*?)\s*{% endschema %}/)?.[1];
    expect(() => JSON.parse(schema)).not.toThrow();
    expect(liquid).toContain('data-compliance-submit');
    expect(liquid).toContain('data-cargo-gate');
    expect(liquid).toContain('data-cargo-attestation');
    expect(liquid).toContain('data-order-submit');
  });
});

describe('rates helpers', () => {
  it('validateRateInput requires package fields', () => {
    expect(validateRateInput({}).valid).toBe(false);
    expect(
      validateRateInput({
        country: 'US',
        weight: 1,
        length: 20,
        width: 15,
        height: 10,
        firstMileMode: 'dropoff',
      }).valid,
    ).toBe(true);
  });

  it('isValidTrackingNumber', () => {
    expect(isValidTrackingNumber('SF123')).toBe(true);
    expect(isValidTrackingNumber('ab')).toBe(false);
  });

  it('escapeHtml escapes markup', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('estimateFirstMileRmb for dropoff is 0', () => {
    const r = estimateFirstMileRmb({ firstMileMode: 'dropoff' });
    expect(r.amount).toBe(0);
  });

  it('does not expose a product quota in account-bound tracking results', () => {
    const html = renderSfcTracking({
      trackingNumber: 'SF123',
      status: 'In transit',
      events: [],
    });
    expect(html).not.toContain('checks remaining');
  });
});

describe('warehouse contact privacy guard', () => {
  it('builds clipboard text from server-rendered card fields', () => {
    expect(
      warehouseCopyText({
        address: 'Warehouse street address',
        contact: 'Receiver',
        phone: '13800000000',
      }),
    ).toBe('Warehouse street address\n收件人：Receiver\n电话：13800000000');
  });

  it('omits empty fields instead of emitting blank lines', () => {
    expect(warehouseCopyText({})).toBe('');
    expect(warehouseCopyText({address: 'Warehouse street address'})).toBe(
      'Warehouse street address',
    );
  });

  it('keeps the warehouse contact constant out of the client source', () => {
    const source = readFileSync(
      new URL('../extensions/storefront-tools/src/rates.js', import.meta.url),
      'utf8',
    );
    expect(source).not.toContain('WAREHOUSE_COPY_TEXT');
  });

  it('keeps the order-panel warehouse card behind a customer branch', () => {
    const liquid = readFileSync(
      new URL(
        '../extensions/storefront-tools/blocks/sfc-shipping-tools.liquid',
        import.meta.url,
      ),
      'utf8',
    );
    const orderCard = liquid.match(
      /data-order-warehouse-card[\s\S]*?{% endif %}/,
    )?.[0];
    expect(orderCard).toBeTruthy();
    expect(orderCard).toContain('{% if customer %}');
    expect(orderCard).toContain('{% else %}');
  });
});

describe('analytics privacy gate', () => {
  it('is disabled by default with no document flag or global override', () => {
    expect(isAnalyticsEnabled()).toBe(false);
    expect(isAnalyticsEnabled(false)).toBe(false);
  });

  it('is enabled by an explicit flag or the global override', () => {
    expect(isAnalyticsEnabled(true)).toBe(true);
    globalThis.SFC_ANALYTICS = true;
    try {
      expect(isAnalyticsEnabled()).toBe(true);
    } finally {
      delete globalThis.SFC_ANALYTICS;
    }
  });

  it('gates trackStorefrontEvent behind isAnalyticsEnabled', () => {
    const source = readFileSync(
      new URL(
        '../extensions/storefront-tools/src/analytics.js',
        import.meta.url,
      ),
      'utf8',
    );
    expect(source).toContain('export function isAnalyticsEnabled');
    expect(source).toContain('if (!isAnalyticsEnabled(enabled)) return');
  });

  it('does not persist identifiers for logged-in customers when analytics is off', () => {
    const source = readFileSync(
      new URL('../extensions/storefront-tools/src/main.js', import.meta.url),
      'utf8',
    );
    expect(source).toContain(
      "root.dataset.customerLoggedIn === 'true' && isAnalyticsEnabled()",
    );
  });
});

describe('compliance file picker keyboard access', () => {
  const blockPaths = [
    '../extensions/storefront-tools/blocks/sfc-shipping-tools.liquid',
    '../extensions/storefront-tools/blocks/sfc-shipping-center.liquid',
  ];

  it('renders "Choose file" as a focusable button, not a non-focusable label', () => {
    for (const path of blockPaths) {
      const liquid = readFileSync(new URL(path, import.meta.url), 'utf8');
      expect(liquid).toContain(
        '<button type="button" class="button button--ghost button--compact" data-compliance-file-picker>',
      );
      expect(liquid).not.toMatch(/<label[^>]*>\s*Choose file/);
      expect(liquid).toContain('data-compliance-file-input hidden');
    }
  });

  it('wires the picker button to open the hidden file input', () => {
    const source = readFileSync(
      new URL('../extensions/storefront-tools/src/main.js', import.meta.url),
      'utf8',
    );
    expect(source).toContain(
      "slot.querySelector('[data-compliance-file-picker]')",
    );
    expect(source).toContain(
      "picker?.addEventListener('click', () => input?.click())",
    );
  });
});

describe('block landmark hygiene', () => {
  const blockPaths = [
    '../extensions/storefront-tools/blocks/sfc-shipping-tools.liquid',
    '../extensions/storefront-tools/blocks/sfc-shipping-center.liquid',
  ];

  it('ships no page-level landmarks that clash with the host theme', () => {
    for (const path of blockPaths) {
      const liquid = readFileSync(new URL(path, import.meta.url), 'utf8');
      // The block renders inside the theme's <main>, so it must not add a
      // second main/h1/header/footer (nested + duplicate landmarks).
      expect(liquid).not.toMatch(/<main[\s>]/);
      expect(liquid).not.toMatch(/<h1[\s>]/);
      expect(liquid).not.toMatch(/<header[\s>]/);
      expect(liquid).not.toMatch(/<footer[\s>]/);
    }
  });

  it('keeps the skip-link targets as plain containers with stable ids', () => {
    const main = readFileSync(new URL(blockPaths[0], import.meta.url), 'utf8');
    const center = readFileSync(new URL(blockPaths[1], import.meta.url), 'utf8');
    expect(main).toContain('<div id="SfcMain">');
    expect(main).toContain('href="#SfcMain"');
    expect(center).toContain('id="SfcCenterMain"');
    expect(center).toContain('href="#SfcCenterMain"');
  });
});

describe('focus indicator contrast', () => {
  const styleFiles = [
    'base.css',
    'layout.css',
    'hero.css',
    'forms.css',
    'orders.css',
    'tracking.css',
    'shipping-center.css',
  ];

  it('uses an opaque ink ring for the global focus-visible outline', () => {
    const base = readFileSync(
      new URL('../extensions/storefront-tools/styles/base.css', import.meta.url),
      'utf8',
    );
    expect(base).toContain('outline: 3px solid var(--ink)');
  });

  it('drops the translucent accent focus ring from every stylesheet', () => {
    for (const file of styleFiles) {
      const css = readFileSync(
        new URL(`../extensions/storefront-tools/styles/${file}`, import.meta.url),
        'utf8',
      );
      expect(css, `${file} still has a translucent focus ring`).not.toContain(
        'rgba(255, 107, 22, 0.42)',
      );
    }
  });
});

describe('destination country list', () => {
  it('covers the full ISO 3166-1 alpha-2 set', () => {
    expect(COUNTRIES.length).toBe(249);
  });

  it('has unique, well-formed codes with non-empty names', () => {
    const codes = COUNTRIES.map((entry) => entry.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const {code, name} of COUNTRIES) {
      expect(code).toMatch(/^[A-Z]{2}$/);
      expect(typeof name).toBe('string');
      expect(name.trim().length).toBeGreaterThan(0);
    }
  });

  it('offers destinations beyond the old 8-country hard limit', () => {
    const codes = new Set(COUNTRIES.map((entry) => entry.code));
    for (const code of ['SG', 'NL', 'BR', 'IN', 'ZA', 'US', 'JP']) {
      expect(codes.has(code), `missing ${code}`).toBe(true);
    }
  });

  it('populates the destination select from the list, not hardcoded options', () => {
    const main = readFileSync(
      new URL('../extensions/storefront-tools/src/main.js', import.meta.url),
      'utf8',
    );
    expect(main).toContain(
      "import { populateCountrySelect } from './countries.js'",
    );
    expect(main).toContain("querySelectorAll('select[data-country-options]')");

    const liquid = readFileSync(
      new URL(
        '../extensions/storefront-tools/blocks/sfc-shipping-tools.liquid',
        import.meta.url,
      ),
      'utf8',
    );
    expect(liquid).toContain('data-country-options');
    expect(liquid).not.toContain('<option value="GB">United Kingdom</option>');
  });
});

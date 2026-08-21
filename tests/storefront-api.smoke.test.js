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
import {formatUsdApprox} from '../extensions/storefront-tools/src/rate-ui.js';

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

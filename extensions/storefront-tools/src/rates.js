/**
 * Rate quote validation, first-mile estimate, tracking presentation
 */
'use strict';

export const REQUIRED_RATE_FIELDS = [
  'country',
  'weight',
  'length',
  'width',
  'height',
];

const PACKAGE_LIMITS = {
  weight: {min: 0.01, max: 100},
  length: {min: 1, max: 200},
  width: {min: 1, max: 200},
  height: {min: 1, max: 200},
};

/** SF-like domestic first-mile estimate to Huizhou warehouse (RMB). */
const FIRST_MILE_ZONE_RATES = {
  local: {firstKg: 14, perKg: 2.5, label: 'Guangdong'},
  nearby: {firstKg: 20, perKg: 7, label: 'Nearby provinces'},
  mainland: {firstKg: 22, perKg: 12, label: 'Mainland'},
  far: {firstKg: 26, perKg: 16, label: 'Far / west / northeast'},
};

/** All mainland provincial-level divisions → rate band. */
const FIRST_MILE_PROVINCES = {
  Guangdong: 'local',
  Hunan: 'nearby',
  Jiangxi: 'nearby',
  Fujian: 'nearby',
  Guangxi: 'nearby',
  Hainan: 'nearby',
  Zhejiang: 'mainland',
  Jiangsu: 'mainland',
  Shanghai: 'mainland',
  Anhui: 'mainland',
  Hubei: 'mainland',
  Henan: 'mainland',
  Shandong: 'mainland',
  Beijing: 'mainland',
  Tianjin: 'mainland',
  Hebei: 'mainland',
  Shanxi: 'mainland',
  Chongqing: 'mainland',
  Sichuan: 'mainland',
  Guizhou: 'mainland',
  Yunnan: 'mainland',
  Shaanxi: 'mainland',
  Liaoning: 'far',
  Jilin: 'far',
  Heilongjiang: 'far',
  InnerMongolia: 'far',
  Gansu: 'far',
  Qinghai: 'far',
  Ningxia: 'far',
  Xinjiang: 'far',
  Tibet: 'far',
};

export function firstMileZoneForProvince(province) {
  const band = FIRST_MILE_PROVINCES[province];
  if (!band) return null;
  return FIRST_MILE_ZONE_RATES[band];
}

export const WAREHOUSE_COPY_TEXT =
  '广东省惠州市惠阳区白石村明泰路17号朝鲲产业园,三态速递一楼\n收件人：刘正+Y5169\n电话：18938091512';

export function chargeableWeightKg(weight, length, width, height) {
  const actual = Number(weight) || 0;
  const volumetric =
    (Number(length) || 0) * (Number(width) || 0) * (Number(height) || 0) / 6000;
  return Math.max(actual, volumetric, 0.01);
}

/** Mainland China mobile: 11 digits starting with 1[3-9]. Accepts +86 / 86 / spaces. */
export function normalizeChinaMobile(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('0086')) digits = digits.slice(4);
  else if (digits.startsWith('86') && digits.length > 11) digits = digits.slice(2);
  if (/^1[3-9]\d{9}$/.test(digits)) return digits;
  return '';
}

export function estimateFirstMileRmb(input) {
  const mode = String(input.firstMileMode || 'pickup').toLowerCase();
  if (mode !== 'pickup') {
    return {
      mode: 'dropoff',
      amount: 0,
      currency: 'RMB',
      label: 'Drop-off (you pay local courier)',
      note: '¥0 on this quote',
    };
  }
  const province = String(input.pickupProvince || '').trim();
  const zone = firstMileZoneForProvince(province);
  if (!zone) {
    return {
      mode: 'pickup',
      amount: null,
      currency: 'RMB',
      label: 'Pickup estimate',
      note: 'Select pickup province',
      error: 'Select the China pickup province to estimate first-mile cost.',
    };
  }
  const cw = chargeableWeightKg(
    input.weight,
    input.length,
    input.width,
    input.height,
  );
  const extra = Math.max(0, cw - 1);
  const amount = Math.round((zone.firstKg + extra * zone.perKg) * 100) / 100;
  return {
    mode: 'pickup',
    amount,
    currency: 'RMB',
    label: `Pickup · ${zone.label}`,
    note: 'SF Express–like estimate',
    chargeableWeight: Math.round(cw * 100) / 100,
  };
}

export function approxUsdFromRate(rmbAmount, internationalRmb, internationalUsd) {
  if (rmbAmount == null || !Number.isFinite(Number(rmbAmount))) return null;
  const rmb = Number(internationalRmb);
  const usd = Number(internationalUsd);
  if (Number.isFinite(rmb) && rmb > 0 && Number.isFinite(usd)) {
    return Math.round((Number(rmbAmount) * usd) / rmb * 100) / 100;
  }
  return null;
}

const OPTIONAL_LOCATION_PATTERN = /^[\p{L}\p{N} .,'’()-]{1,100}$/u;
const OPTIONAL_POSTAL_PATTERN = /^[A-Z0-9][A-Z0-9 -]{0,19}$/;

export function validateRateInput(input) {
  const firstMile = estimateFirstMileRmb(input);
  if (firstMile.error) {
    return {valid: false, message: firstMile.error};
  }

  const hasRequiredFields = REQUIRED_RATE_FIELDS.every((field) => {
    const value = input[field];
    return typeof value === 'number'
      ? Number.isFinite(value) && value > 0
      : Boolean(String(value ?? '').trim());
  });

  if (!hasRequiredFields) {
    return {
      valid: false,
      message: 'Please complete the destination country and package details.',
    };
  }

  const country = String(input.country ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) {
    return {
      valid: false,
      message: 'Please select a valid destination country / region.',
    };
  }

  const state = String(input.state ?? '').trim();
  const city = String(input.city ?? '').trim();
  const postalCode = String(
    input.postalCode ?? input.zipCode ?? '',
  ).trim().toUpperCase();

  if (state && !OPTIONAL_LOCATION_PATTERN.test(state)) {
    return {
      valid: false,
      message: 'State / province contains unsupported characters.',
    };
  }
  if (city && !OPTIONAL_LOCATION_PATTERN.test(city)) {
    return {
      valid: false,
      message: 'City contains unsupported characters.',
    };
  }
  if (postalCode && !OPTIONAL_POSTAL_PATTERN.test(postalCode)) {
    return {
      valid: false,
      message: 'Postal code contains unsupported characters.',
    };
  }

  const packageIsInRange = Object.entries(PACKAGE_LIMITS).every(([field, range]) => {
    const value = Number(input[field]);
    return Number.isFinite(value) && value >= range.min && value <= range.max;
  });

  if (!packageIsInRange) {
    return {
      valid: false,
      message: 'Weight must be 0.01–100 kg and each dimension must be 1–200 cm.',
    };
  }

  return {valid: true, message: ''};
}


export function isValidTrackingNumber(value) {
  return /^[A-Za-z0-9-]{5,50}$/.test(String(value ?? '').trim());
}

export const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export function renderSfcTracking(result) {
  const eventList = Array.isArray(result.events) ? result.events : [];
  const events = eventList.map((event, index) => `
    <li class="sfc-tracking-event${index === 0 ? ' is-latest' : ''}">
      <time datetime="${escapeHtml(event.time || '')}">${escapeHtml(event.time || '—')}</time>
      <span aria-hidden="true"></span>
      <div class="sfc-tracking-event__body">
        <strong>${escapeHtml(
          event.description || 'Tracking update',
        )}</strong>
        ${event.location
          ? `<small>${escapeHtml(event.location)}</small>`
          : ''}
      </div>
    </li>
  `).join('');

  const orderCode = result.orderCode && result.orderCode !== result.trackingNumber
    ? result.orderCode
    : '';

  return `
    <div class="sfc-tracking-result">
      <div class="sfc-tracking-summary">
        ${result.isDemo
          ? '<span class="demo-badge">DEMO DATA</span>'
          : ''}
        <div class="sfc-tracking-summary__head">
          <div>
            <p class="eyebrow">CURRENT STATUS</p>
            <h3>${escapeHtml(result.status || 'In transit')}</h3>
          </div>
          <span class="sfc-tracking-status-pill">${escapeHtml(
            result.status || 'In transit',
          )}</span>
        </div>
        <dl class="sfc-tracking-meta">
          <div>
            <dt>Tracking number</dt>
            <dd>${escapeHtml(result.trackingNumber || '—')}</dd>
          </div>
          ${orderCode
            ? `<div>
            <dt>SFC order</dt>
            <dd>${escapeHtml(orderCode)}</dd>
          </div>`
            : ''}
          <div>
            <dt>Shipping channel</dt>
            <dd>${escapeHtml(
              result.shippingChannel || 'Not provided',
            )}</dd>
          </div>
          <div>
            <dt>Destination</dt>
            <dd>${escapeHtml(
              result.destination || 'Not provided',
            )}</dd>
          </div>
          <div>
            <dt>Latest update</dt>
            <dd>${escapeHtml(
              result.latestUpdate || 'Not provided',
            )}</dd>
          </div>
        </dl>
      </div>
      <div class="sfc-tracking-timeline-wrap">
        <p class="sfc-tracking-timeline__label">Shipment milestones</p>
        <ol class="sfc-tracking-timeline">
          ${events
            || `<li class="tracking-empty-event">${escapeHtml(
              result.hasEvents === false || !eventList.length
                ? 'Order found. Tracking milestones will appear here after the first scan.'
                : 'No scan events were provided.',
            )}</li>`}
        </ol>
      </div>
    </div>
  `;
}

const failureHeadings = {
  SFC_NOT_FOUND: 'Tracking number not found',
  SFC_NOT_CONFIGURED: 'SFC tracking is not configured',
  SFC_TIMEOUT: 'SFC tracking timed out',
  SFC_UNAVAILABLE: 'SFC tracking is unavailable',
  LOGIN_REQUIRED: 'Sign in to track your shipments',
  BINDING_REQUIRED: 'Link your SFC account to track',
  INTERNAL_ERROR: 'Tracking is unavailable',
};

export function renderTrackingFailure(
  code = 'INTERNAL_ERROR',
  message = 'Tracking is temporarily unavailable. Please try again.',
) {
  const heading = failureHeadings[code]
    ?? failureHeadings.INTERNAL_ERROR;
  return `
    <div class="tracking-widget-state tracking-widget-state--error">
      <span aria-hidden="true">!</span>
      <h3>${escapeHtml(heading)}</h3>
      <p class="inline-error" role="alert">${escapeHtml(message)}</p>
      <button
        class="button button--ghost"
        type="button"
        data-action="retry-tracking"
      >Try again</button>
    </div>
  `;
}

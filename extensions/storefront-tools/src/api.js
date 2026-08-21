/**
 * SFC storefront API client (App Proxy: /apps/sfc-tools/*)
 */
'use strict';

export function endpoint(baseUrl, path) {
  return `${String(baseUrl || '/apps/sfc-tools').replace(/\/+$/, '')}/${path}`;
}

export async function postJson(url, body, fetchImpl = globalThis.fetch) {
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: String(url).startsWith('/') ? 'same-origin' : 'omit',
    body: JSON.stringify(body),
  });
  return response.json();
}

export function linkAccount(
  {baseUrl = '/apps/sfc-tools', fetchImpl = globalThis.fetch} = {},
) {
  return postJson(
    endpoint(baseUrl, 'account-link'),
    {},
    fetchImpl,
  );
}

export function queryRates(
  input,
  {baseUrl = '/apps/sfc-tools', fetchImpl = globalThis.fetch} = {},
) {
  return postJson(
    endpoint(baseUrl, 'rates'),
    {
      country: String(input.country ?? '').trim().toUpperCase(),
      state: String(input.state ?? '').trim(),
      city: String(input.city ?? '').trim(),
      zipCode: String(
        input.zipCode ?? input.postalCode ?? '',
      ).trim().toUpperCase(),
      weight: Number(input.weight),
      length: Number(input.length),
      width: Number(input.width),
      height: Number(input.height),
    },
    fetchImpl,
  );
}

export function queryTracking(
  trackingNumber,
  {baseUrl = '/apps/sfc-tools', fetchImpl = globalThis.fetch} = {},
) {
  return postJson(
    endpoint(baseUrl, 'tracking'),
    {
      trackingNumber: String(
        trackingNumber,
      ).trim().toUpperCase(),
    },
    fetchImpl,
  );
}

export async function fetchBalance(
  {baseUrl = '/apps/sfc-tools', fetchImpl = globalThis.fetch} = {},
) {
  const response = await fetchImpl(endpoint(baseUrl, 'balance'), {
    method: 'GET',
    credentials: String(endpoint(baseUrl, 'balance')).startsWith('/')
      ? 'same-origin'
      : 'omit',
    headers: {Accept: 'application/json'},
  });
  return response.json();
}


export async function fetchOrderFields(
  shippingMethod,
  country,
  {baseUrl = '/apps/sfc-tools', fetchImpl = globalThis.fetch} = {},
) {
  return postJson(
    endpoint(baseUrl, 'order-fields'),
    {
      shippingMethod: String(shippingMethod ?? '').trim(),
      country: String(country ?? '').trim().toUpperCase(),
    },
    fetchImpl,
  );
}

export function createSfcOrder(
  payload,
  {baseUrl = '/apps/sfc-tools', fetchImpl = globalThis.fetch} = {},
) {
  return postJson(endpoint(baseUrl, 'create-order'), payload, fetchImpl);
}

export function bindDomesticTracking(
  payload,
  {baseUrl = '/apps/sfc-tools', fetchImpl = globalThis.fetch} = {},
) {
  return postJson(endpoint(baseUrl, 'domestic-tracking'), payload, fetchImpl);
}

export async function fetchOrders(
  {page = 1, pageSize = 20, baseUrl = '/apps/sfc-tools', fetchImpl = globalThis.fetch} = {},
) {
  const response = await fetchImpl(
    `${endpoint(baseUrl, 'orders')}?page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`,
    {
      method: 'GET',
      credentials: String(endpoint(baseUrl, 'orders')).startsWith('/')
        ? 'same-origin'
        : 'omit',
      headers: {Accept: 'application/json'},
    },
  );
  return response.json();
}

export async function fetchCompliance(
  {baseUrl = '/apps/sfc-tools', fetchImpl = globalThis.fetch} = {},
) {
  const response = await fetchImpl(endpoint(baseUrl, 'compliance'), {
    method: 'GET',
    credentials: String(endpoint(baseUrl, 'compliance')).startsWith('/')
      ? 'same-origin'
      : 'omit',
    headers: {Accept: 'application/json'},
  });
  return response.json();
}

export function setComplianceAccountClass(
  accountClass,
  {baseUrl = '/apps/sfc-tools', fetchImpl = globalThis.fetch} = {},
) {
  return postJson(
    endpoint(baseUrl, 'compliance-account-class'),
    {accountClass: String(accountClass ?? '').trim()},
    fetchImpl,
  );
}

export function saveComplianceProfile(
  profile,
  {baseUrl = '/apps/sfc-tools', fetchImpl = globalThis.fetch} = {},
) {
  return postJson(
    endpoint(baseUrl, 'compliance-profile'),
    {
      trueName: String(profile?.trueName ?? '').trim(),
      company: String(profile?.company ?? '').trim(),
      creditId: String(profile?.creditId ?? '').trim(),
      cardId: String(profile?.cardId ?? '').trim(),
    },
    fetchImpl,
  );
}

export async function uploadComplianceFile(
  {kind, file, baseUrl = '/apps/sfc-tools', fetchImpl = globalThis.fetch} = {},
) {
  const form = new FormData();
  form.append('kind', String(kind ?? '').trim());
  form.append('file', file);
  const response = await fetchImpl(endpoint(baseUrl, 'compliance-upload'), {
    method: 'POST',
    credentials: String(endpoint(baseUrl, 'compliance-upload')).startsWith('/')
      ? 'same-origin'
      : 'omit',
    body: form,
  });
  return response.json();
}

export function submitComplianceReview(
  {baseUrl = '/apps/sfc-tools', fetchImpl = globalThis.fetch} = {},
) {
  return postJson(endpoint(baseUrl, 'compliance-submit'), {}, fetchImpl);
}

export function checkCargoCompliance(
  payload,
  {baseUrl = '/apps/sfc-tools', fetchImpl = globalThis.fetch} = {},
) {
  return postJson(endpoint(baseUrl, 'cargo-compliance'), payload, fetchImpl);
}

export function complianceFileUrl(
  fileName,
  {baseUrl = '/apps/sfc-tools'} = {},
) {
  const name = String(fileName ?? '').trim();
  if (!name) return '';
  return `${endpoint(baseUrl, 'compliance-file')}?file=${encodeURIComponent(name)}`;
}

export function fetchOrderLabel(
  orderCode,
  {baseUrl = '/apps/sfc-tools', fetchImpl = globalThis.fetch} = {},
) {
  return postJson(
    endpoint(baseUrl, 'label'),
    {orderCode: String(orderCode ?? '').trim()},
    fetchImpl,
  );
}

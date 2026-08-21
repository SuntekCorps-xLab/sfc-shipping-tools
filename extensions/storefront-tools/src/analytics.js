/**
 * Optional storefront analytics (disabled unless SFC_ANALYTICS=1 on root dataset)
 */
'use strict';

import { endpoint, postJson } from './api.js';

export function storageGet(key, store) {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key, value, store) {
  try {
    store.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function makeClientId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnalyticsIds() {
  const ANON_KEY = 'sfc_storefront_anon_id';
  const SESS_KEY = 'sfc_storefront_sess_id';
  let anonymousId = storageGet(ANON_KEY, globalThis.localStorage);
  if (!anonymousId) {
    anonymousId = makeClientId();
    storageSet(ANON_KEY, anonymousId, globalThis.localStorage);
  }
  let sessionId = storageGet(SESS_KEY, globalThis.sessionStorage);
  if (!sessionId) {
    sessionId = makeClientId();
    storageSet(SESS_KEY, sessionId, globalThis.sessionStorage);
  }
  return {anonymousId, sessionId};
}

export function getTrafficSource() {
  try {
    const params = new URLSearchParams(globalThis.location?.search || '');
    const parts = [];
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach((key) => {
      const value = params.get(key);
      if (value) parts.push(`${key}=${value}`);
    });
    if (parts.length) return parts.join('&').slice(0, 255);
    const ref = String(document.referrer || '');
    if (ref) return `ref:${ref}`.slice(0, 255);
  } catch {
    /* ignore */
  }
  return '';
}

/**
 * Optional analytics. Off by default for open-source / privacy.
 * Enable with data-analytics="on" on the root node, or globalThis.SFC_ANALYTICS = true.
 */
export function trackStorefrontEvent(
  eventName,
  {
    baseUrl = '/apps/sfc-tools',
    product = 'sfc',
    status = 'ok',
    payload = null,
    userCode = null,
    fetchImpl = globalThis.fetch,
    enabled = null,
  } = {},
) {
  const on =
    enabled === true ||
    globalThis.SFC_ANALYTICS === true ||
    (typeof document !== 'undefined' &&
      document.querySelector('[data-sfc-tools-root][data-analytics="on"]'));
  if (!on) return Promise.resolve(null);

  const {anonymousId, sessionId} = getAnalyticsIds();
  const body = {
    product,
    event: eventName,
    event_status: status,
    anonymous_id: anonymousId,
    session_id: sessionId,
    page:
      typeof location !== 'undefined'
        ? `${location.pathname}${location.search || ''}`
        : '/',
    source: getTrafficSource(),
    user_code: userCode || undefined,
    payload: payload || undefined,
  };
  return postJson(endpoint(baseUrl, 'event'), body, fetchImpl).catch(() => null);
}

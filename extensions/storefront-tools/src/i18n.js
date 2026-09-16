/**
 * Minimal storefront i18n for the bundled JS.
 *
 * Liquid renders localized strings into a <script type="application/json"
 * data-sfc-i18n> blob (one per block); initSfcTools loads it via
 * setTranslations(). Every t() call passes an English fallback, so a missing or
 * untranslated key never blanks the UI — this lets strings migrate to locales
 * incrementally. Most JS copy is still hardcoded; migrate it to t(key, fallback)
 * and add the key to the blob + locales/en.default.json.
 */
'use strict';

let translations = {};

export function setTranslations(next) {
  translations = next && typeof next === 'object' ? next : {};
}

export function t(key, fallback) {
  const value = translations[key];
  return typeof value === 'string' && value !== '' ? value : fallback;
}

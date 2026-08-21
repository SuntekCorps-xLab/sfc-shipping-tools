/**
 * Theme asset entry — bundled to assets/sfc-tools.js
 */
import { initAll } from './main.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initAll(document));
} else {
  initAll(document);
}

document.addEventListener('shopify:section:load', (event) => initAll(event.target));
document.addEventListener('shopify:block:load', (event) => initAll(event.target));

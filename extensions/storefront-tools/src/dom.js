/** Small, shared DOM helpers for the framework-free storefront bundle. */
'use strict';

export function clear(target) {
  if (!target) return;
  while (target.firstChild) target.firstChild.remove();
}

export function element(tag, className = '', text = null) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = String(text);
  return node;
}

export function focusResult(container) {
  if (!container) return;
  container.setAttribute('tabindex', '-1');
  container.focus({preventScroll: true});
  container.scrollIntoView({behavior: 'smooth', block: 'nearest'});
}

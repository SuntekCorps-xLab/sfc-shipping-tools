/** Rate-result presentation and interactions. */
'use strict';

import {clear, element, focusResult} from './dom.js';
import {approxUsdFromRate, estimateFirstMileRmb} from './rates.js';

const RATE_PAGE_SIZE = 6;

export function formatUsdApprox(value) {
  if (value == null || value === '' || !Number.isFinite(Number(value))) {
    return '';
  }
  return `≈ $${Number(value).toFixed(2)} USD`;
}

export function createRateUi({root, results, getParcel, onStartOrder}) {
  let loadingTimer = null;

  function stopLoading() {
    if (loadingTimer) {
      clearInterval(loadingTimer);
      loadingTimer = null;
    }
    results?.removeAttribute('aria-busy');
  }

  function renderState(title, message, {error = false} = {}) {
    if (!results) return;
    stopLoading();
    clear(results);
    results.classList.remove('results-panel--loading', 'results-panel--filled');
    const state = element(
      'div',
      `empty-state${error ? ' empty-state--error' : ''}`,
    );
    state.append(
      element('p', 'eyebrow', error ? 'SFC QUOTE STATUS' : 'LIVE SFC QUOTE'),
      element('h3', '', title),
      element('p', error ? 'inline-error' : '', message),
    );
    results.append(state);
    focusResult(results);
  }

  function renderLoading() {
    if (!results) return;
    stopLoading();
    clear(results);
    results.classList.add('results-panel--loading');
    results.classList.remove('results-panel--filled');
    results.setAttribute('aria-busy', 'true');

    const panel = element('div', 'rate-loading');
    panel.setAttribute('role', 'status');
    panel.setAttribute('aria-live', 'polite');
    const heading = element('div', 'rate-loading__head');
    const spinner = element('span', 'rate-loading__spinner');
    spinner.setAttribute('aria-hidden', 'true');
    const copy = element('div', 'rate-loading__copy');
    copy.append(
      element('p', 'eyebrow', 'LIVE SFC QUOTE'),
      element('h3', '', 'Checking SFC shipping services…'),
      element('p', 'rate-loading__hint', 'Comparing available routes for your parcel.'),
    );
    heading.append(spinner, copy);

    const steps = element('ol', 'rate-loading__steps');
    const stepNodes = [
      'Sending parcel details securely',
      'Matching SFC shipping services',
      'Calculating live prices',
    ].map((label, index) => {
      const item = element('li', index === 0 ? 'is-active' : '');
      item.append(
        element('span', 'rate-loading__step-dot', index + 1),
        element('span', 'rate-loading__step-label', label),
      );
      return item;
    });
    steps.append(...stepNodes);
    const elapsed = element('p', 'rate-loading__elapsed', 'Working… 0s');
    panel.append(heading, steps, elapsed);
    results.append(panel);
    focusResult(results);

    const startedAt = Date.now();
    loadingTimer = setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      elapsed.textContent =
        seconds < 10
          ? `Working… ${seconds}s`
          : `Still checking available routes… ${seconds}s`;
      const active = seconds < 2 ? 0 : seconds < 6 ? 1 : 2;
      stepNodes.forEach((node, index) => {
        node.classList.toggle('is-active', index === active);
        node.classList.toggle('is-done', index < active);
      });
    }, 400);
  }

  function buildCard(rate, firstMile) {
    const international = Number(rate.amount);
    const internationalAmount = Number.isFinite(international) ? international : 0;
    const firstMileAmount = Number(firstMile?.amount || 0);
    const internationalUsd =
      rate.amountUsd != null && Number.isFinite(Number(rate.amountUsd))
        ? Number(rate.amountUsd)
        : null;
    const firstMileUsd = approxUsdFromRate(
      firstMileAmount,
      internationalAmount,
      internationalUsd,
    );
    const total = internationalAmount + firstMileAmount;
    const totalUsd =
      internationalUsd == null
        ? null
        : Math.round((internationalUsd + Number(firstMileUsd || 0)) * 100) / 100;

    const card = element('article', 'rate-card');
    const row = element('div', 'rate-card__row');
    const service = element('div', 'rate-card__service');
    const serviceCopy = element('div', 'rate-card__copy');
    serviceCopy.append(
      element('h4', '', rate.serviceName || rate.serviceCode || 'SFC service'),
      element('p', '', rate.transitTime ? `Transit ${rate.transitTime}` : 'Transit confirmed by SFC'),
    );
    service.append(
      element('span', 'rate-card__code', rate.serviceCode || 'SFC'),
      serviceCopy,
    );

    const aside = element('div', 'rate-card__aside');
    const breakdown = element('div', 'rate-card__breakdown');
    const totalLine = element('div', 'rate-card__line rate-card__line--total');
    totalLine.append(
      element('span', '', 'Total'),
      element('strong', '', `${total.toFixed(2)} ${rate.currency || 'RMB'}`),
    );
    breakdown.append(
      totalLine,
      element(
        'div',
        'rate-card__subtotal',
        firstMile?.mode === 'dropoff'
          ? `International ${internationalAmount.toFixed(2)} + drop-off first mile 0`
          : `International ${internationalAmount.toFixed(2)} + first mile ${firstMileAmount.toFixed(2)}`,
      ),
    );
    if (totalUsd != null) {
      breakdown.append(element('small', 'rate-card__price-usd', formatUsdApprox(totalUsd)));
    }

    const orderButton = element('button', 'button button--primary rate-card__cta');
    orderButton.type = 'button';
    orderButton.textContent =
      root.dataset.customerLoggedIn === 'true' ? 'Order' : 'Sign in to order';
    Object.assign(orderButton.dataset, {
      action: 'start-order',
      serviceCode: String(rate.serviceCode || ''),
      serviceName: String(rate.serviceName || rate.serviceCode || 'SFC service'),
      amount: internationalAmount.toFixed(2),
      currency: String(rate.currency || 'RMB'),
      totalAmount: total.toFixed(2),
      firstMileAmount: firstMileAmount.toFixed(2),
      firstMileMode: String(firstMile?.mode || 'dropoff'),
    });
    if (internationalUsd != null) orderButton.dataset.amountUsd = internationalUsd.toFixed(2);
    if (totalUsd != null) orderButton.dataset.totalAmountUsd = totalUsd.toFixed(2);
    aside.append(breakdown, orderButton);
    row.append(service, aside);
    card.append(row);
    return card;
  }

  function renderRates(response) {
    if (!results) return;
    stopLoading();
    clear(results);
    results.classList.remove('results-panel--loading');
    results.classList.add('results-panel--filled');
    const firstMile = estimateFirstMileRmb(getParcel?.() || {});
    const rates = [...(Array.isArray(response.rates) ? response.rates : [])].sort(
      (a, b) => Number(a.amount) - Number(b.amount),
    );
    if (!rates.length) {
      renderState('No shipping services found', 'Try another destination or parcel size.');
      return;
    }

    const heading = element('div', 'rate-result-heading');
    heading.append(
      element('p', 'eyebrow', 'AVAILABLE SFC SERVICES'),
      element('h3', '', `${rates.length} shipping options found`),
      element(
        'p',
        'rate-result-sub',
        firstMile.mode === 'pickup'
          ? `Sorted by international price · Estimated first mile ${Number(firstMile.amount || 0).toFixed(2)} RMB`
          : 'Sorted by international price · Drop-off first mile is 0 on this quote',
      ),
    );
    const scroll = element('div', 'rate-list-scroll');
    const list = element('div', 'rate-list');
    rates.forEach((rate, index) => {
      const card = buildCard(rate, firstMile);
      if (index >= RATE_PAGE_SIZE) {
        card.hidden = true;
        card.dataset.rateExtra = 'true';
      }
      list.append(card);
    });
    scroll.append(list);
    const footer = element('div', 'rate-list-footer');
    const hiddenCount = Math.max(0, rates.length - RATE_PAGE_SIZE);
    if (hiddenCount) {
      const more = element('button', 'button button--ghost button--wide', `Show ${hiddenCount} more services`);
      more.type = 'button';
      more.dataset.action = 'show-more-rates';
      footer.append(more);
    }
    footer.append(
      element('p', 'quote-note', 'The backend determines whether public or account-specific pricing is returned.'),
    );
    results.append(heading, scroll, footer);
    focusResult(results);
  }

  results?.addEventListener('click', (event) => {
    const more = event.target.closest('[data-action="show-more-rates"]');
    if (more) {
      results.querySelectorAll('[data-rate-extra="true"]').forEach((card) => {
        card.hidden = false;
        delete card.dataset.rateExtra;
      });
      more.remove();
      return;
    }
    const button = event.target.closest('[data-action="start-order"]');
    if (!button) return;
    onStartOrder?.({
      serviceCode: button.dataset.serviceCode,
      serviceName: button.dataset.serviceName,
      amount: button.dataset.amount,
      currency: button.dataset.currency,
      amountUsd: button.dataset.amountUsd || null,
      totalAmount: button.dataset.totalAmount || button.dataset.amount,
      totalAmountUsd: button.dataset.totalAmountUsd || null,
      firstMileAmount: button.dataset.firstMileAmount || '0',
      firstMileMode: button.dataset.firstMileMode || 'dropoff',
    });
  });

  return {
    renderLoading,
    renderRates,
    renderState,
    stopLoading,
  };
}

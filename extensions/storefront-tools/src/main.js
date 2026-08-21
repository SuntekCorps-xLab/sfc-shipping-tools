/**
 * Storefront page bootstrap
 */
'use strict';

import {
  linkAccount,
  queryRates,
  queryTracking,
  fetchBalance,
  fetchOrderFields,
  createSfcOrder,
  bindDomesticTracking,
  fetchOrders,
  fetchCompliance,
  setComplianceAccountClass,
  saveComplianceProfile,
  uploadComplianceFile,
  submitComplianceReview,
  checkCargoCompliance,
  complianceFileUrl,
  fetchOrderLabel,
} from './api.js';
import {
  REVIEW_STATUS,
  complianceStatusView,
  isAccountApproved,
  normalizeReviewStatus,
  validateComplianceFile,
  validateCargoDeclaration,
  cargoDecisionAllowsOrder,
} from './compliance.js';
import {
  WAREHOUSE_COPY_TEXT,
  validateRateInput,
  normalizeChinaMobile,
  isValidTrackingNumber,
  renderSfcTracking,
  renderTrackingFailure,
} from './rates.js';
import {
  pdfBlobFromBase64,
  downloadPdfBlob,
  showPdfInBrowser,
} from './orders.js';
import { enhanceSelect } from './select.js';
import {clear, element, focusResult} from './dom.js';
import {createRateUi, formatUsdApprox} from './rate-ui.js';
import {
  storageGet,
  storageSet,
  getAnalyticsIds,
  trackStorefrontEvent,
} from './analytics.js';

function initSfcTools(root) {
  if (!root || root.dataset.sfcInitialized === 'true') return;
  root.dataset.sfcInitialized = 'true';

  const apiBase = root.dataset.apiBase || '/apps/sfc-tools';
  const analyticsProduct = root.dataset.analyticsProduct || 'sfc';
  const rateForm = root.querySelector('[data-rate-form]');
  const rateResults = root.querySelector('[data-rate-results]');
  const orderPanel = root.querySelector('[data-order-panel]');
  const orderForm = root.querySelector('[data-order-form]');
  const warehouseCard = root.querySelector('[data-warehouse-card]');
  const pickupOrigin = root.querySelector('[data-pickup-origin]');
  const pickupProvinceSelect = root.querySelector('[data-pickup-province]');

  function trackEvent(eventName, opts = {}) {
    trackStorefrontEvent(eventName, {
      baseUrl: apiBase,
      product: analyticsProduct,
      ...opts,
    });
  }

  trackEvent('page_view', {
    payload: {
      loggedIn: root.dataset.customerLoggedIn === 'true',
    },
  });
  if (root.dataset.customerLoggedIn === 'true') {
    const {sessionId} = getAnalyticsIds();
    const loginFlagKey = `sfc_login_ok_${sessionId}`;
    if (!storageGet(loginFlagKey, globalThis.sessionStorage)) {
      storageSet(loginFlagKey, '1', globalThis.sessionStorage);
      trackEvent('login', {status: 'ok'});
    }
  }

  function syncFirstMileUi() {
    const mode =
      rateForm?.querySelector('input[name="firstMileMode"]:checked')?.value ||
      'pickup';
    const isPickup = mode === 'pickup';
    if (warehouseCard) warehouseCard.hidden = isPickup;
    if (pickupOrigin) pickupOrigin.hidden = !isPickup;
    if (pickupProvinceSelect) {
      pickupProvinceSelect.required = isPickup;
      if (!isPickup) pickupProvinceSelect.value = '';
    }
    rateForm
      ?.querySelectorAll('.first-mile-option')
      .forEach((label) => {
        const input = label.querySelector('input[type="radio"]');
        label.classList.toggle('is-selected', Boolean(input?.checked));
      });
  }

  async function copyWarehouseAddress(button) {
    if (root.dataset.customerLoggedIn !== 'true') {
      goToShopifyLogin();
      return;
    }
    try {
      await navigator.clipboard.writeText(WAREHOUSE_COPY_TEXT);
      if (button) {
        const prev = button.textContent;
        button.textContent = 'Copied';
        setTimeout(() => {
          button.textContent = prev;
        }, 1600);
      }
    } catch {
      window.prompt('Copy warehouse address:', WAREHOUSE_COPY_TEXT);
    }
  }

  rateForm?.addEventListener('change', (event) => {
    if (event.target?.matches?.('[data-first-mile-mode]')) {
      syncFirstMileUi();
    }
  });
  root.querySelectorAll('[data-copy-warehouse]').forEach((btn) => {
    btn.addEventListener('click', () => copyWarehouseAddress(btn));
  });
  syncFirstMileUi();

  const trackingForm = root.querySelector('[data-tracking-form]');
  const trackingInput = root.querySelector('[data-tracking-number]');
  const trackingWidgetContainer = root.querySelector('[data-tracking-widget]');
  const trackingProviderName = root.querySelector('[data-tracking-provider]');
  const currentYear = root.querySelector('[data-current-year]');
  const headerUserCodeEl = root.querySelector('[data-header-user-code]');
  const headerBalanceEl = root.querySelector('[data-header-balance]');
  const headerCurrencyEl = root.querySelector('[data-header-currency]');
  const headerBalanceUsdEl = root.querySelector('[data-header-balance-usd]');
  const orderFieldsRecipient = root.querySelector('[data-order-fields-recipient]');
  const orderFieldsDetails = root.querySelector('[data-order-fields-details]');
  const orderItemsList = root.querySelector('[data-order-items-list]');
  const orderItemsExtras = root.querySelector('[data-order-items-extras]');
  const orderItemAddBtn = root.querySelector('[data-order-item-add]');
  const orderFieldsOptions = root.querySelector('[data-order-fields-options]');
  const orderFieldsSend = root.querySelector('[data-order-fields-send]');
  const ORDER_ITEM_FIELD_KEYS = new Set([
    'descriptionEn',
    'descriptionCn',
    'quantity',
    'declaredValue',
    'detailWeight',
    'hsCode',
    'custom_label',
    'enMaterial',
    'cnMaterial',
    'purpose',
    'amazon_asin_number',
    'export_declare_price',
  ]);
  const MAX_ORDER_ITEMS = 20;
  let orderItemFieldDefs = [];
  let orderItemSeq = 0;
  const orderFieldsSendHeading = root.querySelector(
    '[data-order-fields-send-heading]',
  );
  const orderFieldsRecipientHeading = root.querySelector(
    '[data-order-fields-recipient-heading]',
  );
  const orderFieldsCustomsHeading = root.querySelector(
    '[data-order-fields-customs-heading]',
  );
  const orderFieldsStatus = root.querySelector('[data-order-fields-status]');

  const SHOPIFY_SHIPPER_FIELDS = [
    {key: 'sendName', group: 'send', label: 'Shipper name', required: true, visible: true, inputType: 'text'},
    {key: 'sendOrganization', group: 'send', label: 'Shipper company', required: false, visible: true, inputType: 'text'},
    {key: 'sendCall', group: 'send', label: 'Shipper phone', required: true, visible: true, inputType: 'text'},
    {key: 'sendEmail', group: 'send', label: 'Shipper email', required: false, visible: true, inputType: 'email'},
    {key: 'sendAddress', group: 'send', label: 'Shipper address', required: true, visible: true, inputType: 'text'},
    {key: 'sendState', group: 'send', label: 'Shipper state / province', required: true, visible: true, inputType: 'text'},
    {key: 'sendCity', group: 'send', label: 'Shipper city', required: true, visible: true, inputType: 'text'},
    {key: 'sendZipCode', group: 'send', label: 'Shipper postal code', required: false, visible: true, inputType: 'text'},
  ];

  function ensureShipperFields(fields) {
    const list = Array.isArray(fields) ? fields.slice() : [];
    const keys = new Set(SHOPIFY_SHIPPER_FIELDS.map((f) => f.key));
    const without = list.filter((f) => !keys.has(f?.key));
    return without.concat(SHOPIFY_SHIPPER_FIELDS);
  }
  const orderSubmitStatus = root.querySelector('[data-order-submit-status]');
  const ordersListEl = root.querySelector('[data-orders-list]');
  const ordersStatusEl = root.querySelector('[data-orders-status]');
  const ordersFooterEl = root.querySelector('[data-orders-footer]');
  const ordersMoreBtn = root.querySelector('[data-orders-more]');
  const orderDetailDialog = root.querySelector('[data-order-detail-dialog]');
  const orderDetailTitle = root.querySelector('[data-order-detail-title]');
  const orderDetailStatus = root.querySelector('[data-order-detail-status]');
  const orderDetailBody = root.querySelector('[data-order-detail-body]');
  const orderDetailTrackBtn = root.querySelector('[data-order-detail-track]');
  const orderDetailLabelMenu = root.querySelector(
    '[data-order-detail-label-menu]',
  );
  const orderDetailLabelTrigger = root.querySelector(
    '[data-order-detail-label-trigger]',
  );
  const orderDetailPrintBtn = root.querySelector('[data-order-detail-print]');
  const orderDetailDownloadBtn = root.querySelector(
    '[data-order-detail-download]',
  );

  function syncOrdersScrollMenuState() {
    const scroll = root.querySelector('.orders-list-scroll');
    if (!scroll) return;
    scroll.classList.toggle(
      'is-menu-open',
      Boolean(root.querySelector('.label-menu.is-open')),
    );
  }

  function setLabelMenuOpen(menu, open) {
    if (!menu) return;
    const trigger = menu.querySelector('.label-menu__trigger');
    const panel = menu.querySelector('.label-menu__panel');
    if (open) closeAllLabelMenus(menu);
    menu.classList.toggle('is-open', open);
    if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (panel) panel.hidden = !open;
    syncOrdersScrollMenuState();
  }

  function closeAllLabelMenus(except = null) {
    root.querySelectorAll('.label-menu.is-open').forEach((menu) => {
      if (except && menu === except) return;
      menu.classList.remove('is-open');
      const trigger = menu.querySelector('.label-menu__trigger');
      const panel = menu.querySelector('.label-menu__panel');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      if (panel) panel.hidden = true;
    });
    syncOrdersScrollMenuState();
  }

  function buildLabelMenu(order) {
    const menu = element('div', 'label-menu');
    const trigger = element('button', 'button button--ghost label-menu__trigger');
    trigger.type = 'button';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.innerHTML = 'Label <span aria-hidden="true">▾</span>';

    const panel = element('div', 'label-menu__panel');
    panel.hidden = true;
    panel.setAttribute('role', 'menu');

    const printItem = element('button', 'label-menu__item');
    printItem.type = 'button';
    printItem.setAttribute('role', 'menuitem');
    printItem.textContent = 'Open label';
    printItem.addEventListener('click', () => {
      setLabelMenuOpen(menu, false);
      runOrderLabelAction(order, 'print', trigger);
    });

    const downloadItem = element('button', 'label-menu__item');
    downloadItem.type = 'button';
    downloadItem.setAttribute('role', 'menuitem');
    downloadItem.textContent = 'Download PDF';
    downloadItem.addEventListener('click', () => {
      setLabelMenuOpen(menu, false);
      runOrderLabelAction(order, 'download', trigger);
    });

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      setLabelMenuOpen(menu, !menu.classList.contains('is-open'));
    });

    panel.append(printItem, downloadItem);
    menu.append(trigger, panel);
    return menu;
  }

  async function runOrderLabelAction(order, mode, triggerBtn) {
    const code = String(order?.sfcOrderCode || order?.orderCode || '').trim();
    if (!code) {
      setOrdersStatus('Missing order code for label.', {error: true});
      return;
    }
    // 必须在 await 前打开窗口，否则会被浏览器拦截成“下载回退”
    let previewWin = null;
    if (mode === 'print') {
      previewWin = window.open('about:blank', '_blank');
    }
    const labelHtml = triggerBtn?.innerHTML;
    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.classList.add('is-busy');
      triggerBtn.textContent =
        mode === 'print' ? 'Opening label…' : 'Preparing download…';
    }
    setOrdersStatus(
      mode === 'print'
        ? 'Opening shipping label…'
        : 'Preparing shipping label download…',
    );
    try {
      const data = await fetchOrderLabel(code, {baseUrl: apiBase});
      if (!data?.ok || !data.labelData) {
        if (previewWin && !previewWin.closed) previewWin.close();
        setOrdersStatus(
          data?.message ||
            'Label is not ready yet. Some channels need a tracking number first.',
          {error: true},
        );
        return;
      }
      const blob = pdfBlobFromBase64(data.labelData);
      const fileName = data.fileName || `${code}-label.pdf`;
      if (mode === 'print') {
        showPdfInBrowser(blob, previewWin);
        setOrdersStatus(
          `Label opened for ${data.orderCode || code}. You can print from the PDF viewer.`,
        );
      } else {
        if (previewWin && !previewWin.closed) previewWin.close();
        downloadPdfBlob(blob, fileName);
        setOrdersStatus(`Downloaded ${fileName}.`);
      }
    } catch {
      if (previewWin && !previewWin.closed) previewWin.close();
      setOrdersStatus('Unable to load shipping label. Try again.', {
        error: true,
      });
    } finally {
      if (triggerBtn && labelHtml != null) {
        triggerBtn.disabled = false;
        triggerBtn.classList.remove('is-busy');
        triggerBtn.innerHTML = labelHtml;
      }
    }
  }
  let rateRequestGeneration = 0;
  let trackingRequestGeneration = 0;
  let lastParcel = null;
  let activeOrderRate = null;
  let ordersPage = 1;
  let ordersHaveNext = false;
  let ordersLoaded = [];
  let activeOrderDetail = null;

  root.querySelectorAll('select[data-enhance-select]').forEach(enhanceSelect);

  const accountMenu = root.querySelector('[data-account-menu]');
  const accountMenuTrigger = root.querySelector('[data-account-menu-trigger]');
  const accountMenuPanel = root.querySelector('[data-account-menu-panel]');

  function setAccountMenuOpen(open) {
    if (!accountMenu || !accountMenuTrigger || !accountMenuPanel) return;
    accountMenu.classList.toggle('is-open', open);
    accountMenuTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    accountMenuPanel.hidden = !open;
  }

  accountMenuTrigger?.addEventListener('click', (event) => {
    event.stopPropagation();
    setAccountMenuOpen(Boolean(accountMenuPanel?.hidden));
  });

  // —— Account compliance documents (personal / enterprise) ——
  const complianceDialog = root.querySelector('[data-compliance-dialog]');
  const complianceStatusEl = root.querySelector('[data-compliance-status]');
  const complianceSlotsEl = root.querySelector('[data-compliance-slots]');
  const complianceReviewEl = root.querySelector('[data-compliance-review]');
  const complianceReviewLabelEl = root.querySelector(
    '[data-compliance-review-label]',
  );
  const complianceReviewMessageEl = root.querySelector(
    '[data-compliance-review-message]',
  );
  const complianceSubmitBtn = root.querySelector('[data-compliance-submit]');
  let complianceState = null;
  /** @type {object|null} 资料未齐时暂存选中的渠道，补齐后自动打开下单 */
  let pendingOrderAfterCompliance = null;

  function setComplianceStatus(message, {error = false} = {}) {
    if (!complianceStatusEl) return;
    if (!message) {
      complianceStatusEl.hidden = true;
      complianceStatusEl.textContent = '';
      complianceStatusEl.classList.remove('inline-error');
      return;
    }
    complianceStatusEl.hidden = false;
    complianceStatusEl.textContent = message;
    complianceStatusEl.classList.toggle('inline-error', error);
  }

  function applyAccountClassLocally(accountClass) {
    const next = String(accountClass || '');
    const base = complianceState && typeof complianceState === 'object'
      ? complianceState
      : {ok: true, files: {}, profile: {}, missing: []};
    const optimistic = {
      ...base,
      ok: true,
      accountClass: next || null,
      ready: false,
      missing: [
        ...(Array.isArray(base.missing) ? base.missing : []),
      ],
    };
    // 本地先切上传区，不等接口
    renderComplianceUi(optimistic);
  }

  const complianceProfileEl = root.querySelector('[data-compliance-profile]');
  const complianceTrueNameEl = root.querySelector('[data-compliance-true-name]');
  const complianceCompanyEl = root.querySelector('[data-compliance-company]');
  const complianceCreditIdEl = root.querySelector('[data-compliance-credit-id]');
  const complianceCardIdEl = root.querySelector('[data-compliance-card-id]');

  function isComplianceDocsReady(data) {
    const accountClass = data?.accountClass ? String(data.accountClass) : '';
    const files = data?.files || {};
    if (accountClass === '1') {
      return (
        (files.passport || []).length >= 1 &&
        (files.holding || []).length >= 1
      );
    }
    if (accountClass === '2') {
      const idCount =
        (files.identity || []).length +
        (files.passport || []).length +
        (files.holding || []).length;
      return (files.license || []).length >= 1 && idCount >= 1;
    }
    return false;
  }

  function renderComplianceProfile(data) {
    const accountClass = data?.accountClass ? String(data.accountClass) : '';
    const isPersonal = accountClass === '1';
    const isEnterprise = accountClass === '2';
    // 图在上、信息在下：选好类型就显示表单（不要求先传完图才看到）
    if (complianceProfileEl) {
      complianceProfileEl.hidden = !accountClass;
    }
    const hint = complianceProfileEl?.querySelector(
      '.sfc-compliance-profile__hint',
    );
    if (hint) {
      hint.textContent = isComplianceDocsReady(data)
        ? 'Documents uploaded. Now fill in your details — required before placing orders.'
        : 'Fill in your details below. Upload document photos above too — both are required before placing orders.';
    }

    root.querySelectorAll('[data-compliance-field="company"]').forEach((el) => {
      el.hidden = !isEnterprise;
    });
    root.querySelectorAll('[data-compliance-field="cardId"]').forEach((el) => {
      el.hidden = !isEnterprise;
    });
    root.querySelectorAll('[data-compliance-field="creditId"]').forEach((el) => {
      el.hidden = !(isPersonal || isEnterprise);
    });

    const trueNameLabel = root.querySelector('[data-compliance-true-name-label]');
    const creditIdLabel = root.querySelector('[data-compliance-credit-id-label]');
    if (trueNameLabel) {
      trueNameLabel.textContent = isEnterprise
        ? 'Legal representative name'
        : 'Full name';
    }
    if (creditIdLabel) {
      creditIdLabel.textContent = isEnterprise
        ? 'Business registration number (optional)'
        : 'Passport number';
    }
    if (complianceCreditIdEl) {
      complianceCreditIdEl.placeholder = isEnterprise
        ? 'Company registration / license number'
        : 'Passport number';
      complianceCreditIdEl.required = isPersonal;
    }

    const profile = data?.profile || {};
    if (complianceTrueNameEl) {
      complianceTrueNameEl.value = profile.trueName || '';
    }
    if (complianceCompanyEl) {
      complianceCompanyEl.value = profile.company || '';
    }
    if (complianceCreditIdEl) {
      // 个人：creditId；企业：营业执照号（若与法人证件号相同则企业执照号输入可留空展示）
      if (isPersonal) {
        complianceCreditIdEl.value = profile.creditId || '';
      } else if (isEnterprise) {
        const sameAsCard =
          profile.creditId &&
          profile.cardId &&
          String(profile.creditId) === String(profile.cardId);
        complianceCreditIdEl.value = sameAsCard ? '' : profile.creditId || '';
      }
    }
    if (complianceCardIdEl) {
      complianceCardIdEl.value = profile.cardId || '';
    }
  }

  function renderComplianceUi(data) {
    complianceState = data;
    const accountClass = data?.accountClass ? String(data.accountClass) : '';
    root.querySelectorAll('[data-compliance-account-class]').forEach((input) => {
      input.checked = input.value === accountClass;
    });
    if (complianceSlotsEl) {
      complianceSlotsEl.hidden = !accountClass;
    }
    renderComplianceProfile(data);

    const isPersonal = accountClass === '1';
    const isEnterprise = accountClass === '2';
    const files = data?.files || {};

    const fillSlot = (kind, list, {visible, done}) => {
      const slot = root.querySelector(`[data-compliance-slot="${kind}"]`);
      if (!slot) return;
      slot.hidden = !visible;
      slot.classList.toggle('is-done', Boolean(done));
      const count = slot.querySelector('[data-compliance-slot-count]');
      const ul = slot.querySelector('[data-compliance-file-list]');
      const visual = slot.querySelector('.sfc-compliance-slot__visual');
      const illus = slot.querySelector('.sfc-compliance-illus');
      const names = Array.isArray(list) ? list : [];
      if (count) count.textContent = `${names.length} file(s)`;
      if (ul) clear(ul);

      // 预览直接替换左侧示例图；同图不重建，避免切换账号类型时闪烁重载
      if (visual) {
        const latest = names.length ? names[names.length - 1] : '';
        const existing = visual.querySelector('[data-compliance-preview]');
        if (!latest) {
          if (existing) existing.remove();
          visual.classList.remove('has-preview');
          if (illus) illus.hidden = false;
        } else {
          const url = complianceFileUrl(latest, {baseUrl: apiBase});
          if (existing && existing.getAttribute('href') === url) {
            visual.classList.add('has-preview');
            if (illus) illus.hidden = true;
          } else {
            if (existing) existing.remove();
            const lower = String(latest).toLowerCase();
            const isImage = /\.(jpe?g|png)$/i.test(lower);
            const preview = document.createElement('a');
            preview.href = url;
            preview.target = '_blank';
            preview.rel = 'noopener noreferrer';
            preview.className = 'sfc-compliance-slot__preview';
            preview.dataset.compliancePreview = '1';
            preview.title = latest;
            if (isImage) {
              const img = document.createElement('img');
              img.src = url;
              img.alt = latest;
              img.loading = 'lazy';
              preview.append(img);
            } else {
              const badge = document.createElement('span');
              badge.className = 'sfc-compliance-slot__preview-badge';
              badge.textContent = /\.pdf$/i.test(lower) ? 'PDF' : 'FILE';
              preview.append(badge);
            }
            visual.append(preview);
            visual.classList.add('has-preview');
            if (illus) illus.hidden = true;
          }
        }
      }
    };

    fillSlot('license', files.license, {
      visible: isEnterprise,
      done: (files.license || []).length >= 1,
    });
    fillSlot('passport', files.passport, {
      visible: isPersonal,
      done: (files.passport || []).length >= 1,
    });
    fillSlot('holding', files.holding, {
      visible: isPersonal,
      done: (files.holding || []).length >= 1,
    });
    fillSlot('identity', files.identity, {
      visible: isEnterprise,
      done: (files.identity || []).length >= 1,
    });

    const review = complianceStatusView(data);
    if (complianceReviewEl) {
      complianceReviewEl.hidden = false;
      complianceReviewEl.dataset.tone = review.tone;
    }
    if (complianceReviewLabelEl) {
      complianceReviewLabelEl.textContent = review.label;
    }
    if (complianceReviewMessageEl) {
      complianceReviewMessageEl.textContent = review.message;
    }

    const reviewStatus = normalizeReviewStatus(data);
    const canSubmit = Boolean(data?.ready) && !isAccountApproved(data) && ![
      REVIEW_STATUS.PENDING_REVIEW,
      REVIEW_STATUS.SUSPENDED,
    ].includes(reviewStatus);
    if (complianceSubmitBtn) {
      complianceSubmitBtn.hidden = !canSubmit;
      complianceSubmitBtn.disabled = !canSubmit;
    }

    if (isAccountApproved(data)) {
      setComplianceStatus('Account approved. Shipment-level cargo screening is still required.');
      maybeResumeOrderAfterCompliance(data);
    } else if (reviewStatus === REVIEW_STATUS.PENDING_REVIEW) {
      setComplianceStatus('Your verification is under review. New orders remain locked.');
    } else if (!accountClass) {
      setComplianceStatus('Choose personal or enterprise to continue.', {
        error: true,
      });
    } else if (Array.isArray(data?.missing) && data.missing.length) {
      const labels = data.missing.map((m) => m.label || m.code).join('; ');
      setComplianceStatus(`Still needed: ${labels}`, {error: true});
    } else {
      setComplianceStatus('');
    }
  }

  function maybeResumeOrderAfterCompliance(data) {
    if (!isAccountApproved(data) || !pendingOrderAfterCompliance) return;
    const rate = pendingOrderAfterCompliance;
    pendingOrderAfterCompliance = null;
    closeComplianceDialog();
    openOrderPanelUi(rate);
  }

  async function loadComplianceStatus() {
    if (root.dataset.customerLoggedIn !== 'true') {
      setComplianceStatus('Sign in to manage documents.', {error: true});
      return null;
    }
    setComplianceStatus('Loading…');
    try {
      const data = await fetchCompliance({baseUrl: apiBase});
      if (!data?.ok) {
        setComplianceStatus(data?.message || 'Unable to load documents.', {
          error: true,
        });
        return data;
      }
      renderComplianceUi(data);
      return data;
    } catch {
      setComplianceStatus('Unable to load documents.', {error: true});
      return null;
    }
  }

  function openComplianceDialog() {
    setAccountMenuOpen(false);
    if (!complianceDialog) return;
    loadComplianceStatus();
    if (typeof complianceDialog.showModal === 'function') {
      complianceDialog.showModal();
    } else {
      complianceDialog.setAttribute('open', '');
    }
  }

  function closeComplianceDialog() {
    if (complianceDialog?.open) complianceDialog.close();
  }

  root.querySelectorAll('[data-compliance-open]').forEach((btn) => {
    btn.addEventListener('click', () => openComplianceDialog());
  });
  root.querySelectorAll('[data-compliance-close]').forEach((btn) => {
    btn.addEventListener('click', () => closeComplianceDialog());
  });
  root.querySelector('[data-compliance-refresh]')?.addEventListener('click', () => {
    loadComplianceStatus();
  });
  complianceSubmitBtn?.addEventListener('click', async () => {
    if (!complianceState?.ready) {
      setComplianceStatus('Complete the profile and required documents first.', {
        error: true,
      });
      return;
    }
    complianceSubmitBtn.disabled = true;
    setComplianceStatus('Submitting for SFC review…');
    try {
      const data = await submitComplianceReview({baseUrl: apiBase});
      if (!data?.ok) {
        setComplianceStatus(data?.message || 'Unable to submit verification.', {
          error: true,
        });
        return;
      }
      renderComplianceUi(data);
    } catch {
      setComplianceStatus('Unable to submit verification. Try again.', {
        error: true,
      });
    } finally {
      if (complianceSubmitBtn && !complianceSubmitBtn.hidden) {
        complianceSubmitBtn.disabled = false;
      }
    }
  });
  complianceDialog?.addEventListener('click', (event) => {
    if (event.target === complianceDialog) closeComplianceDialog();
  });

  root.querySelectorAll('[data-compliance-account-class]').forEach((input) => {
    input.addEventListener('change', async () => {
      if (!input.checked) return;
      const nextClass = String(input.value || '');
      applyAccountClassLocally(nextClass);
      setComplianceStatus('Saving account type…');
      try {
        const data = await setComplianceAccountClass(nextClass, {
          baseUrl: apiBase,
        });
        if (!data?.ok) {
          setComplianceStatus(data?.message || 'Unable to save account type.', {
            error: true,
          });
          return;
        }
        renderComplianceUi(data);
      } catch {
        setComplianceStatus('Unable to save account type.', {error: true});
      }
    });
  });

  root.querySelector('[data-compliance-profile-save]')?.addEventListener(
    'click',
    async () => {
      const accountClass = complianceState?.accountClass
        ? String(complianceState.accountClass)
        : '';
      if (!accountClass) {
        setComplianceStatus('Choose personal or enterprise first.', {
          error: true,
        });
        return;
      }
      setComplianceStatus('Saving profile…');
      try {
        const data = await saveComplianceProfile(
          {
            trueName: complianceTrueNameEl?.value || '',
            company: complianceCompanyEl?.value || '',
            creditId: complianceCreditIdEl?.value || '',
            cardId: complianceCardIdEl?.value || '',
          },
          {baseUrl: apiBase},
        );
        if (!data?.ok) {
          setComplianceStatus(data?.message || 'Unable to save profile.', {
            error: true,
          });
          return;
        }
        renderComplianceUi(data);
        setComplianceStatus(data.message || 'Profile saved.');
      } catch {
        setComplianceStatus('Unable to save profile.', {error: true});
      }
    },
  );

  root.querySelectorAll('[data-compliance-slot]').forEach((slot) => {
    const input = slot.querySelector('[data-compliance-file-input]');
    const kind = slot.getAttribute('data-compliance-slot');
    input?.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file || !kind) return;
      const validation = validateComplianceFile(file);
      if (!validation.valid) {
        setComplianceStatus(validation.message, {error: true});
        return;
      }
      setComplianceStatus(`Uploading ${file.name}…`);
      try {
        const data = await uploadComplianceFile({
          kind,
          file,
          baseUrl: apiBase,
        });
        if (!data?.ok) {
          setComplianceStatus(data?.message || 'Upload failed.', {error: true});
          return;
        }
        renderComplianceUi(data);
        setComplianceStatus(data.message || 'Document uploaded.');
      } catch {
        setComplianceStatus('Upload failed.', {error: true});
      }
    });
  });

  document.addEventListener('click', (event) => {
    if (!accountMenu || accountMenu.contains(event.target)) return;
    setAccountMenuOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setAccountMenuOpen(false);
  });

  document.addEventListener('click', (event) => {
    const openMenu = root.querySelector('.label-menu.is-open');
    if (!openMenu) return;
    if (openMenu.contains(event.target)) return;
    closeAllLabelMenus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAllLabelMenus();
  });

  orderDetailLabelTrigger?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!orderDetailLabelMenu) return;
    setLabelMenuOpen(
      orderDetailLabelMenu,
      !orderDetailLabelMenu.classList.contains('is-open'),
    );
  });

  function setUsdHint(el, usdValue) {
    if (!el) return;
    const text = formatUsdApprox(usdValue);
    if (!text) {
      el.hidden = true;
      el.textContent = '';
      return;
    }
    el.hidden = false;
    el.textContent = text;
  }

  function applyAccountSummary(state) {
    const {
      userCode = '',
      balance = '',
      currency = '',
      balanceUsd = null,
      userCodeMessage = '',
    } = state;

    if (headerUserCodeEl) headerUserCodeEl.textContent = userCodeMessage || userCode;
    if (headerBalanceEl) headerBalanceEl.textContent = balance;
    if (headerCurrencyEl) headerCurrencyEl.textContent = currency;
    setUsdHint(headerBalanceUsdEl, balanceUsd);
  }

  async function refreshAccountBalance() {
    if (root.dataset.customerLoggedIn !== 'true') {
      applyAccountSummary({
        balance: '—',
        currency: '',
        balanceUsd: null,
        userCodeMessage: 'Sign in required',
      });
      return;
    }
    applyAccountSummary({
      balance: '…',
      currency: '',
      balanceUsd: null,
      userCodeMessage: 'Linking…',
    });
    try {
      const data = await fetchBalance({baseUrl: apiBase});
      if (data?.ok) {
        applyAccountSummary({
          balance: Number(data.balance).toFixed(2),
          currency: data.currency || '',
          balanceUsd:
            data.balanceUsd != null && data.balanceUsd !== ''
              ? Number(data.balanceUsd)
              : null,
          userCode: data.userCode ? `SFC ${data.userCode}` : 'Linked',
        });
      } else if (data?.code === 'BINDING_REQUIRED') {
        applyAccountSummary({
          balance: '—',
          currency: '',
          userCodeMessage: 'Linking…',
        });
      } else {
        applyAccountSummary({
          balance: '—',
          currency: '',
          userCodeMessage: data?.message || 'Balance unavailable',
        });
      }
    } catch {
      applyAccountSummary({
        balance: '—',
        currency: '',
        userCodeMessage: 'Balance unavailable',
      });
    }
  }

  const PENDING_ORDER_KEY = 'sfcPendingOrder';

  function goToShopifyLogin() {
    trackEvent('login', {status: 'start'});
    const url =
      root.dataset.loginUrl ||
      `/customer_authentication/login?return_to=${encodeURIComponent(
        window.location.pathname || '/',
      )}`;
    window.location.assign(url);
  }

  function setOrderFieldsStatus(message, {error = false} = {}) {
    if (!orderFieldsStatus) return;
    if (!message) {
      orderFieldsStatus.hidden = true;
      orderFieldsStatus.textContent = '';
      return;
    }
    orderFieldsStatus.hidden = false;
    orderFieldsStatus.textContent = message;
    orderFieldsStatus.classList.toggle('inline-error', error);
  }

  function setOrderSubmitStatus(message, {error = false} = {}) {
    if (!orderSubmitStatus) return;
    if (!message) {
      orderSubmitStatus.hidden = true;
      orderSubmitStatus.textContent = '';
      return;
    }
    orderSubmitStatus.hidden = false;
    orderSubmitStatus.textContent = message;
    orderSubmitStatus.classList.toggle('inline-error', error);
    orderSubmitStatus.classList.toggle('recharge-status--ok', !error);
  }

  const orderSuccessGuide = root.querySelector('[data-order-success-guide]');
  const orderSuccessTitle = root.querySelector('[data-order-success-title]');
  const orderSuccessFirstMile = root.querySelector(
    '[data-order-success-step-firstmile]',
  );
  const orderSuccessPrint = root.querySelector('[data-order-success-print]');
  const orderSuccessDownload = root.querySelector(
    '[data-order-success-download]',
  );
  const orderDomesticBlock = root.querySelector(
    '[data-order-domestic-tracking]',
  );
  const orderDomesticTrackingInput = root.querySelector(
    '[data-order-domestic-tracking-no]',
  );
  const orderDomesticSaveBtn = root.querySelector(
    '[data-order-domestic-tracking-save]',
  );
  const orderDomesticStatus = root.querySelector(
    '[data-order-domestic-tracking-status]',
  );
  const orderDetailDomesticInput = root.querySelector(
    '[data-order-detail-domestic-no]',
  );
  const orderDetailDomesticSaveBtn = root.querySelector(
    '[data-order-detail-domestic-save]',
  );
  const orderDetailDomesticStatus = root.querySelector(
    '[data-order-detail-domestic-status]',
  );
  const orderSubmitBtn = orderForm?.querySelector('[data-order-submit]');
  const cargoFlagInputs = [
    ...(orderForm?.querySelectorAll('[data-cargo-flag]') || []),
  ];
  const cargoNoneInput = orderForm?.querySelector('[data-cargo-none]');
  const cargoDetailsEl = orderForm?.querySelector('[data-cargo-details]');
  const cargoDescriptionEl = orderForm?.querySelector('[data-cargo-description]');
  const cargoSdsEl = orderForm?.querySelector('[data-cargo-sds]');
  const cargoUnEl = orderForm?.querySelector('[data-cargo-un]');
  const cargoDgClassEl = orderForm?.querySelector('[data-cargo-dg-class]');
  const cargoAttestationEl = orderForm?.querySelector('[data-cargo-attestation]');
  const cargoStatusEl = orderForm?.querySelector('[data-cargo-status]');
  let lastCreatedOrder = null;
  let detailDomesticOrder = null;

  function setStatusEl(el, message, {error = false} = {}) {
    if (!el) return;
    if (!message) {
      el.hidden = true;
      el.textContent = '';
      return;
    }
    el.hidden = false;
    el.textContent = message;
    el.classList.toggle('inline-error', error);
    el.classList.toggle('recharge-status--ok', !error);
  }

  function setCargoStatus(message, {error = false} = {}) {
    setStatusEl(cargoStatusEl, message, {error});
  }

  function syncCargoDeclarationUi() {
    const hasFlags = cargoFlagInputs.some((input) => input.checked);
    if (hasFlags && cargoNoneInput) cargoNoneInput.checked = false;
    if (cargoDetailsEl) cargoDetailsEl.hidden = !hasFlags;
    if (cargoDescriptionEl) cargoDescriptionEl.required = hasFlags;
    setCargoStatus('');
  }

  function collectCargoDeclaration() {
    const flags = {};
    cargoFlagInputs.forEach((input) => {
      flags[input.value] = input.checked;
    });
    return {
      flags,
      noneOfThese: Boolean(cargoNoneInput?.checked),
      description: cargoDescriptionEl?.value || '',
      sdsReference: cargoSdsEl?.value || '',
      unNumber: cargoUnEl?.value || '',
      dangerousGoodsClass: cargoDgClassEl?.value || '',
      declarationAccepted: Boolean(cargoAttestationEl?.checked),
    };
  }

  cargoFlagInputs.forEach((input) => {
    input.addEventListener('change', syncCargoDeclarationUi);
  });
  cargoNoneInput?.addEventListener('change', () => {
    if (cargoNoneInput.checked) {
      cargoFlagInputs.forEach((input) => {
        input.checked = false;
      });
    }
    syncCargoDeclarationUi();
  });
  syncCargoDeclarationUi();

  function setDomesticTrackingStatus(message, opts = {}) {
    setStatusEl(orderDomesticStatus, message, opts);
  }

  async function saveDomesticTrackingForOrder(
    order,
    {
      inputEl,
      statusEl,
      buttonEl,
      firstMileMode = 'dropoff',
    } = {},
  ) {
    const orderCode = String(order?.orderCode || order?.sfcOrderCode || '').trim();
    if (!orderCode) {
      setStatusEl(statusEl, 'Missing order number.', {error: true});
      return false;
    }
    const trackingNo = String(inputEl?.value || '')
      .trim()
      .replace(/\s+/g, '');
    if (trackingNo.length < 6) {
      setStatusEl(statusEl, 'Enter a valid China domestic tracking number.', {
        error: true,
      });
      inputEl?.focus();
      return false;
    }

    const saveHtml = buttonEl?.innerHTML;
    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.classList.add('is-busy');
      buttonEl.textContent = 'Saving…';
    }
    setStatusEl(statusEl, 'Saving domestic tracking…');

    try {
      const data = await bindDomesticTracking(
        {
          orderCode,
          customerOrderNo: order.customerOrderNo || '',
          firstMileMode,
          domesticTrackingNo: trackingNo,
        },
        {baseUrl: apiBase},
      );
      if (data?.ok) {
        const saved = data.domesticTrackingNo || trackingNo;
        setStatusEl(
          statusEl,
          `Saved: ${saved}. Our team can match this parcel to your SFC order.`,
        );
        if (inputEl) inputEl.value = saved;
        applyDomesticTrackingToLocalOrders(orderCode, saved, {
          sfcOrderCode: order.sfcOrderCode || '',
          customerOrderNo: order.customerOrderNo || '',
        });
        return true;
      }
      if (data?.code === 'LOGIN_REQUIRED' || data?.code === 'BINDING_REQUIRED') {
        goToShopifyLogin();
        return false;
      }
      setStatusEl(
        statusEl,
        data?.message || 'Unable to save domestic tracking. Try again.',
        {error: true},
      );
      return false;
    } catch {
      setStatusEl(statusEl, 'Unable to save domestic tracking. Try again.', {
        error: true,
      });
      return false;
    } finally {
      if (buttonEl && saveHtml != null) {
        buttonEl.disabled = false;
        buttonEl.classList.remove('is-busy');
        buttonEl.innerHTML = saveHtml;
      }
    }
  }

  function orderCodeMatches(order, code) {
    const want = String(code || '')
      .trim()
      .toUpperCase();
    if (!want || !order) return false;
    const a = String(order.orderCode || '')
      .trim()
      .toUpperCase();
    const b = String(order.sfcOrderCode || '')
      .trim()
      .toUpperCase();
    return a === want || b === want;
  }

  function applyDomesticTrackingToLocalOrders(orderCode, trackingNo, extra = {}) {
    const saved = String(trackingNo || '').trim();
    if (!saved) return;

    if (detailDomesticOrder && orderCodeMatches(detailDomesticOrder, orderCode)) {
      detailDomesticOrder.domesticTrackingNo = saved;
    }
    if (activeOrderDetail && orderCodeMatches(activeOrderDetail, orderCode)) {
      activeOrderDetail.domesticTrackingNo = saved;
    }
    if (lastCreatedOrder && orderCodeMatches(lastCreatedOrder, orderCode)) {
      lastCreatedOrder.domesticTrackingNo = saved;
    }

    let touched = false;
    ordersLoaded.forEach((order, idx) => {
      if (!orderCodeMatches(order, orderCode)) return;
      ordersLoaded[idx] = {
        ...order,
        domesticTrackingNo: saved,
        ...(extra.customerOrderNo
          ? {customerOrderNo: order.customerOrderNo || extra.customerOrderNo}
          : {}),
      };
      touched = true;
    });
    if (touched) {
      refreshOrdersListUi();
    }
  }

  function refreshOrdersListUi() {
    if (!ordersListEl) return;
    const snapshot = ordersLoaded.slice();
    clear(ordersListEl);
    ordersLoaded = [];
    if (!snapshot.length) {
      renderOrdersList([], {append: false});
      return;
    }
    snapshot.forEach((order) => {
      ordersLoaded.push(order);
      ordersListEl.append(buildOrderRow(order));
    });
  }

  function hideOrderSuccessGuide() {
    if (orderSuccessGuide) orderSuccessGuide.hidden = true;
    if (orderDomesticBlock) orderDomesticBlock.hidden = true;
    setDomesticTrackingStatus('');
    if (orderSubmitBtn) {
      orderSubmitBtn.hidden = false;
      orderSubmitBtn.disabled = false;
    }
    lastCreatedOrder = null;
  }

  function showOrderSuccessGuide(data, parcel) {
    if (!orderSuccessGuide) return;
    const code = String(data?.orderCode || '').trim();
    const isDropoff = parcel?.firstMileMode === 'dropoff';
    lastCreatedOrder = {
      orderCode: code,
      sfcOrderCode: code,
      customerOrderNo: data?.customerOrderNo || '',
      trackingNumber: data?.trackingNumber || '',
      firstMileMode: isDropoff ? 'dropoff' : 'pickup',
    };

    if (orderSuccessTitle) {
      orderSuccessTitle.textContent = `Order created${
        code ? `: ${code}` : ''
      }${
        data?.trackingNumber ? ` · Tracking ${data.trackingNumber}` : ''
      }.`;
    }
    if (orderSuccessFirstMile) {
      orderSuccessFirstMile.innerHTML = isDropoff
        ? '<strong>Drop off</strong> the parcel at our Huizhou warehouse (address shown above). If you use a China courier, also save the domestic tracking number below.'
        : '<strong>Keep the labeled parcel ready</strong> — we will arrange China pickup using the address you provided.';
    }

    if (orderDomesticBlock) {
      orderDomesticBlock.hidden = !isDropoff;
      if (orderDomesticTrackingInput) orderDomesticTrackingInput.value = '';
      setDomesticTrackingStatus(
        isDropoff
          ? 'Please save your China domestic tracking number after you ship to the warehouse.'
          : '',
      );
    }

    if (orderSubmitBtn) {
      orderSubmitBtn.hidden = true;
    }

    orderSuccessGuide.hidden = false;
    orderSuccessGuide.scrollIntoView({behavior: 'smooth', block: 'nearest'});
  }

  orderSuccessPrint?.addEventListener('click', () => {
    if (!lastCreatedOrder?.orderCode) return;
    runOrderLabelAction(lastCreatedOrder, 'print', orderSuccessPrint);
  });
  orderSuccessDownload?.addEventListener('click', () => {
    if (!lastCreatedOrder?.orderCode) return;
    runOrderLabelAction(lastCreatedOrder, 'download', orderSuccessDownload);
  });

  orderDomesticSaveBtn?.addEventListener('click', () => {
    if (!lastCreatedOrder?.orderCode) {
      setDomesticTrackingStatus('Create an order first.', {error: true});
      return;
    }
    if (lastCreatedOrder.firstMileMode !== 'dropoff') return;
    saveDomesticTrackingForOrder(lastCreatedOrder, {
      inputEl: orderDomesticTrackingInput,
      statusEl: orderDomesticStatus,
      buttonEl: orderDomesticSaveBtn,
      firstMileMode: 'dropoff',
    });
  });

  orderDetailDomesticSaveBtn?.addEventListener('click', () => {
    if (!detailDomesticOrder?.orderCode) {
      setStatusEl(orderDetailDomesticStatus, 'Open an order first.', {
        error: true,
      });
      return;
    }
    saveDomesticTrackingForOrder(detailDomesticOrder, {
      inputEl: orderDetailDomesticInput,
      statusEl: orderDetailDomesticStatus,
      buttonEl: orderDetailDomesticSaveBtn,
      firstMileMode: 'dropoff',
    });
  });

  function currentParcel() {
    if (lastParcel) return {...lastParcel};
    if (!rateForm) return null;
    return serializeRateForm(rateForm);
  }

  function clearOrderFieldHosts() {
    [orderFieldsRecipient, orderFieldsOptions, orderFieldsSend]
      .filter(Boolean)
      .forEach((host) => {
        host.innerHTML = '';
        host.hidden = true;
      });
    if (orderItemsList) orderItemsList.innerHTML = '';
    if (orderItemsExtras) orderItemsExtras.innerHTML = '';
    if (orderFieldsDetails) orderFieldsDetails.hidden = true;
    orderItemFieldDefs = [];
    if (orderFieldsSendHeading) orderFieldsSendHeading.hidden = true;
    if (orderFieldsRecipientHeading) orderFieldsRecipientHeading.hidden = true;
    if (orderFieldsCustomsHeading) orderFieldsCustomsHeading.hidden = true;
  }

  function buildOrderFieldControl(
    field,
    {stateList, cityList, name, itemField = false} = {},
  ) {
    const controlName = name || field.key;
    const wrap = element(
      'label',
      field.key === 'address1' ||
        field.key === 'descriptionEn' ||
        field.key === 'sendAddress'
        ? 'field field--wide'
        : 'field',
    );
    const title = element('span');
    title.textContent = field.label || field.key;
    if (field.required) {
      const star = document.createElement('small');
      star.textContent = ' *';
      star.style.color = 'var(--signal)';
      title.append(star);
    } else {
      const opt = document.createElement('small');
      opt.textContent = ' (optional)';
      title.append(opt);
    }
    wrap.append(title);

    let control;
    if (
      field.key === 'recipientState' &&
      Array.isArray(stateList) &&
      stateList.length
    ) {
      control = document.createElement('select');
      control.name = controlName;
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = 'Select state';
      control.append(blank);
      stateList.forEach((row) => {
        const opt = document.createElement('option');
        opt.value = row.state_code || row.state || '';
        opt.textContent = row.state
          ? `${row.state}${row.state_code ? ` (${row.state_code})` : ''}`
          : opt.value;
        control.append(opt);
      });
    } else if (
      field.key === 'recipientCity' &&
      Array.isArray(cityList) &&
      cityList.length
    ) {
      control = document.createElement('select');
      control.name = controlName;
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = 'Select city';
      control.append(blank);
      cityList.forEach((row) => {
        const opt = document.createElement('option');
        opt.value = row.city || row.city_code || '';
        opt.textContent = row.city
          ? `${row.city}${row.city_code ? ` (${row.city_code})` : ''}`
          : opt.value;
        control.append(opt);
      });
    } else if (field.inputType === 'boolean') {
      control = document.createElement('select');
      control.name = controlName;
      [
        ['', 'No'],
        ['1', 'Yes'],
      ].forEach(([value, label]) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        control.append(opt);
      });
    } else {
      control = document.createElement('input');
      control.name = controlName;
      control.type =
        field.inputType === 'email'
          ? 'email'
          : field.inputType === 'number'
            ? 'number'
            : 'text';
      if (field.inputType === 'number') {
        // Avoid HTML5 step/min mismatch (e.g. min=0.001 + step=0.01 rejects "1")
        if (field.key === 'quantity') {
          control.step = '1';
          control.min = '1';
        } else if (
          field.key === 'detailWeight' ||
          field.key === 'declaredValue' ||
          field.key === 'worth'
        ) {
          control.step = 'any';
          control.min = '0';
        } else {
          control.step = 'any';
          if (field.range?.start != null) control.min = field.range.start;
        }
        if (field.range?.end != null) control.max = field.range.end;
      } else if (field.range?.end) {
        control.maxLength = Number(field.range.end) || 200;
      }
      if (field.key === 'descriptionEn') {
        control.placeholder = 'e.g. Ceramic mug / Water bottle';
      }
      if (field.key === 'quantity') {
        control.value = '1';
      }
      if (field.key === 'sendAddress') {
        control.placeholder = 'Street address in China / origin';
      }
      if (field.key === 'sendCity') {
        control.placeholder = 'e.g. Shenzhen';
      }
      if (field.key === 'sendState') {
        control.placeholder = 'e.g. Guangdong';
      }
    }

    if (field.required) control.required = true;
    if (itemField) control.dataset.itemField = field.key;
    wrap.append(control);
    return wrap;
  }

  function renumberOrderItemRows() {
    if (!orderItemsList) return;
    const rows = [...orderItemsList.querySelectorAll('[data-order-item-row]')];
    rows.forEach((row, index) => {
      const title = row.querySelector('[data-order-item-title]');
      if (title) title.textContent = `Item ${index + 1}`;
      const removeBtn = row.querySelector('[data-order-item-remove]');
      if (removeBtn) removeBtn.disabled = rows.length <= 1;
    });
    if (orderItemAddBtn) {
      orderItemAddBtn.disabled = rows.length >= MAX_ORDER_ITEMS;
    }
  }

  function addOrderItemRow({prefillWeight = false} = {}) {
    if (!orderItemsList || !orderItemFieldDefs.length) return null;
    const rows = orderItemsList.querySelectorAll('[data-order-item-row]');
    if (rows.length >= MAX_ORDER_ITEMS) return null;

    orderItemSeq += 1;
    const rowId = orderItemSeq;
    const row = element('div', 'order-item-row');
    row.dataset.orderItemRow = String(rowId);

    const head = element('div', 'order-item-row__head');
    const title = element('p', 'order-item-row__title');
    title.dataset.orderItemTitle = 'true';
    title.textContent = 'Item';
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'order-item-row__remove';
    removeBtn.dataset.orderItemRemove = 'true';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      const count = orderItemsList.querySelectorAll(
        '[data-order-item-row]',
      ).length;
      if (count <= 1) return;
      row.remove();
      renumberOrderItemRows();
    });
    head.append(title, removeBtn);

    const grid = element('div', 'order-item-row__grid');
    orderItemFieldDefs.forEach((field) => {
      grid.append(
        buildOrderFieldControl(field, {
          name: `item_${rowId}_${field.key}`,
          itemField: true,
        }),
      );
    });

    row.append(head, grid);
    orderItemsList.append(row);

    if (prefillWeight) {
      const weightInput = row.querySelector('[data-item-field="detailWeight"]');
      const parcel = currentParcel();
      if (weightInput && parcel?.weight) {
        weightInput.value = parcel.weight;
      }
    }

    renumberOrderItemRows();
    return row;
  }

  function collectOrderItems() {
    if (!orderItemsList) return [];
    return [...orderItemsList.querySelectorAll('[data-order-item-row]')].map(
      (row) => {
        const item = {};
        row.querySelectorAll('[data-item-field]').forEach((el) => {
          const key = el.dataset.itemField;
          if (!key) return;
          item[key] = el.value;
        });
        return item;
      },
    );
  }

  function renderOrderFields(meta) {
    clearOrderFieldHosts();
    const groups = {
      recipient: orderFieldsRecipient,
      options: orderFieldsOptions,
      send: orderFieldsSend,
    };
    const fields = ensureShipperFields(
      Array.isArray(meta?.fields) ? meta.fields : [],
    );
    const itemFields = [];
    const detailExtras = [];

    fields.forEach((field) => {
      if (!field?.visible) return;
      if (field.group === 'details') {
        if (ORDER_ITEM_FIELD_KEYS.has(field.key)) {
          itemFields.push(field);
        } else {
          // worth 等订单级字段：总申报由明细汇总，不必手填
          if (field.key === 'worth' || field.key === 'total_export_declare') {
            return;
          }
          detailExtras.push(field);
        }
        return;
      }
      const host = groups[field.group] || orderFieldsRecipient;
      if (!host) return;
      host.hidden = false;
      host.append(
        buildOrderFieldControl(field, {
          stateList: meta.stateList,
          cityList: meta.cityList,
        }),
      );
    });

    // 渠道未返回明细字段时给一套标准行
    if (!itemFields.length) {
      itemFields.push(
        {
          key: 'descriptionEn',
          label: 'Item description (English)',
          required: true,
          visible: true,
          inputType: 'text',
        },
        {
          key: 'quantity',
          label: 'Quantity',
          required: true,
          visible: true,
          inputType: 'number',
        },
        {
          key: 'declaredValue',
          label: 'Unit value',
          required: true,
          visible: true,
          inputType: 'number',
        },
        {
          key: 'detailWeight',
          label: 'Unit weight (kg)',
          required: true,
          visible: true,
          inputType: 'number',
        },
      );
    }

    orderItemFieldDefs = itemFields;
    if (orderFieldsDetails && itemFields.length) {
      orderFieldsDetails.hidden = false;
      if (orderFieldsCustomsHeading) orderFieldsCustomsHeading.hidden = false;
      addOrderItemRow({prefillWeight: true});
      detailExtras.forEach((field) => {
        orderItemsExtras?.append(
          buildOrderFieldControl(field, {
            stateList: meta.stateList,
            cityList: meta.cityList,
          }),
        );
      });
    }

    if (orderFieldsSend && !orderFieldsSend.hidden && orderFieldsSendHeading) {
      orderFieldsSendHeading.hidden = false;
    }
    if (
      orderFieldsRecipient &&
      !orderFieldsRecipient.hidden &&
      orderFieldsRecipientHeading
    ) {
      orderFieldsRecipientHeading.hidden = false;
    }

    const parcel = currentParcel();
    if (parcel && orderForm) {
      if (orderForm.elements.recipientState && parcel.state) {
        orderForm.elements.recipientState.value = parcel.state;
      }
      if (orderForm.elements.recipientCity && parcel.city) {
        orderForm.elements.recipientCity.value = parcel.city;
      }
      if (orderForm.elements.zipCode && parcel.zipCode) {
        orderForm.elements.zipCode.value = parcel.zipCode;
      }
    }

    const shipper = meta?.defaultShipper;
    if (shipper && orderForm) {
      Object.keys(shipper).forEach((key) => {
        const el = orderForm.elements[key];
        if (el && shipper[key] != null && shipper[key] !== '') {
          el.value = shipper[key];
        }
      });
    }
  }

  orderItemAddBtn?.addEventListener('click', () => {
    addOrderItemRow({prefillWeight: false});
  });

  async function loadOrderFieldsForRate(rate) {
    const parcel = currentParcel();
    const country = String(parcel?.country || '').trim().toUpperCase();
    const shippingMethod = String(rate.serviceCode || '').trim();
    const countryInput = orderPanel?.querySelector('[data-order-country]');
    if (countryInput) countryInput.value = country;

    clearOrderFieldHosts();
    if (orderFieldsSendHeading) orderFieldsSendHeading.hidden = false;
    if (orderFieldsSend) {
      orderFieldsSend.hidden = false;
      orderFieldsSend.innerHTML =
        '<p class="order-fields-loading">Loading channel requirements…</p>';
    }
    setOrderFieldsStatus('');
    setOrderSubmitStatus('');

    if (!shippingMethod || !country) {
      setOrderFieldsStatus(
        'Select a rate after checking shipping rates so we know the country and channel.',
        {error: true},
      );
      return;
    }

    try {
      const data = await fetchOrderFields(shippingMethod, country, {
        baseUrl: apiBase,
      });
      if (!data?.ok || !Array.isArray(data.fields)) {
        setOrderFieldsStatus(
          data?.message || 'Could not load channel fields. Using a basic form.',
          {error: true},
        );
        renderOrderFields({
          fields: ensureShipperFields([
            {key: 'recipientName', group: 'recipient', label: 'Recipient name', required: true, visible: true, inputType: 'text'},
            {key: 'phone', group: 'recipient', label: 'Phone', required: true, visible: true, inputType: 'text'},
            {key: 'address1', group: 'recipient', label: 'Address', required: true, visible: true, inputType: 'text'},
            {key: 'recipientState', group: 'recipient', label: 'State / Province', required: false, visible: true, inputType: 'text'},
            {key: 'recipientCity', group: 'recipient', label: 'City', required: true, visible: true, inputType: 'text'},
            {key: 'zipCode', group: 'recipient', label: 'Postal code', required: true, visible: true, inputType: 'text'},
            {key: 'email', group: 'recipient', label: 'Recipient email', required: false, visible: true, inputType: 'email'},
            {key: 'descriptionEn', group: 'details', label: 'Item description (English)', required: true, visible: true, inputType: 'text'},
            {key: 'quantity', group: 'details', label: 'Quantity', required: true, visible: true, inputType: 'number'},
            {key: 'declaredValue', group: 'details', label: 'Unit value', required: true, visible: true, inputType: 'number'},
            {key: 'detailWeight', group: 'details', label: 'Unit weight (kg)', required: true, visible: true, inputType: 'number'},
            {key: 'worth', group: 'details', label: 'Total declare value', required: true, visible: true, inputType: 'number'},
          ]),
        });
        return;
      }
      renderOrderFields(data);
      if (!data.hasConfigure) {
        setOrderFieldsStatus(
          'This channel has no special field rules — showing the standard form.',
        );
      }
    } catch {
      setOrderFieldsStatus('Could not load channel fields. Try again.', {
        error: true,
      });
    }
  }

  async function openOrderPanel(rate) {
    if (!orderPanel || !orderForm) return;
    activeOrderRate = rate || null;
    if (root.dataset.customerLoggedIn !== 'true') {
      try {
        sessionStorage.setItem(
          PENDING_ORDER_KEY,
          JSON.stringify({
            serviceCode: rate.serviceCode || '',
            serviceName: rate.serviceName || '',
            amount: rate.amount || '',
            currency: rate.currency || '',
            savedAt: Date.now(),
          }),
        );
      } catch {
        // ignore storage failures
      }
      goToShopifyLogin();
      return;
    }

    // 查价后点 Order 即校验资料，避免填完订单再被拦
    const compliance = await loadComplianceStatus();
    if (!compliance?.ok) {
      if (
        compliance?.code === 'LOGIN_REQUIRED' ||
        compliance?.code === 'BINDING_REQUIRED'
      ) {
        goToShopifyLogin();
        return;
      }
      pendingOrderAfterCompliance = rate;
      openComplianceDialog();
      return;
    }
    if (!isAccountApproved(compliance)) {
      pendingOrderAfterCompliance = rate;
      openComplianceDialog();
      return;
    }

    pendingOrderAfterCompliance = null;
    openOrderPanelUi(rate);
  }

  function openOrderPanelUi(rate) {
    if (!orderPanel || !orderForm) return;
    activeOrderRate = rate || null;

    orderPanel.hidden = false;
    hideOrderSuccessGuide();
    setOrderSubmitStatus('');
    orderPanel.querySelector('[data-order-service-name]').textContent =
      rate.serviceName || rate.serviceCode;
    orderPanel.querySelector('[data-order-service-code]').textContent =
      rate.serviceCode || '';
    orderPanel.querySelector('[data-order-service-price]').textContent =
      rate.totalAmount && rate.currency
        ? `Total ${rate.totalAmount} ${rate.currency}${
            rate.totalAmountUsd != null && rate.totalAmountUsd !== ''
              ? ` (${formatUsdApprox(rate.totalAmountUsd)})`
              : ''
          }`
        : rate.amount && rate.currency
          ? `${rate.amount} ${rate.currency}${
              rate.amountUsd != null && rate.amountUsd !== ''
                ? ` (${formatUsdApprox(rate.amountUsd)})`
                : ''
            }`
          : rate.amount || '—';

    const breakdownEl = orderPanel.querySelector('[data-order-price-breakdown]');
    if (breakdownEl) {
      const fm = Number(rate.firstMileAmount || 0);
      const intl = Number(rate.amount || 0);
      breakdownEl.hidden = false;
      breakdownEl.textContent =
        rate.firstMileMode === 'pickup'
          ? `International ${intl.toFixed(2)} + First mile ${fm.toFixed(2)} RMB (SF-like estimate)`
          : `International ${intl.toFixed(2)} · Drop-off first mile ¥0 (ship to warehouse yourself)`;
    }

    const warehouseCard = orderPanel.querySelector('[data-order-warehouse-card]');
    const pickupBlock = orderPanel.querySelector('[data-order-pickup-block]');
    const isPickup = rate.firstMileMode === 'pickup';
    if (warehouseCard) warehouseCard.hidden = isPickup;
    if (pickupBlock) {
      pickupBlock.hidden = !isPickup;
      pickupBlock
        .querySelectorAll('input')
        .forEach((el) => {
          el.required = isPickup;
          if (!isPickup) el.value = '';
        });
    }

    const pickupPhoneInput = orderForm?.querySelector('[data-order-pickup-phone]');
    if (pickupPhoneInput && pickupPhoneInput.dataset.cnPhoneBound !== 'true') {
      pickupPhoneInput.dataset.cnPhoneBound = 'true';
      pickupPhoneInput.addEventListener('input', () => {
        let digits = String(pickupPhoneInput.value || '').replace(/\D/g, '');
        if (digits.startsWith('0086')) digits = digits.slice(4);
        else if (digits.startsWith('86') && digits.length > 11) {
          digits = digits.slice(2);
        }
        pickupPhoneInput.value = digits.slice(0, 11);
      });
      pickupPhoneInput.addEventListener('blur', () => {
        const normalized = normalizeChinaMobile(pickupPhoneInput.value);
        if (normalized) pickupPhoneInput.value = normalized;
      });
    }

    const methodInput = orderPanel.querySelector('[data-order-shipping-method]');
    if (methodInput) methodInput.value = rate.serviceCode || '';

    loadOrderFieldsForRate(rate);
    orderPanel.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  function closeOrderPanel() {
    if (!orderPanel) return;
    orderPanel.hidden = true;
  }

  const pendingOrderBanner = root.querySelector('[data-pending-order-banner]');
  const pendingOrderMessage = root.querySelector('[data-pending-order-message]');

  function clearPendingOrderStorage() {
    try {
      sessionStorage.removeItem(PENDING_ORDER_KEY);
    } catch {
      // ignore
    }
  }

  function hidePendingOrderBanner() {
    if (!pendingOrderBanner) return;
    pendingOrderBanner.hidden = true;
    if (pendingOrderMessage) pendingOrderMessage.textContent = '';
  }

  /**
   * Login 后查价表单会丢，不能接着打开下单面板。
   * 清掉 pending，提示用户重新选目的地并查价。
   */
  function resumePendingOrderAfterLogin() {
    if (root.dataset.customerLoggedIn !== 'true') return;
    let hadPending = false;
    try {
      const raw = sessionStorage.getItem(PENDING_ORDER_KEY);
      if (raw) {
        const pending = JSON.parse(raw);
        hadPending = Boolean(pending?.serviceCode);
      }
    } catch {
      // ignore parse errors
    }
    clearPendingOrderStorage();
    closeOrderPanel();

    try {
      window.scrollTo({top: 0, left: 0, behavior: 'auto'});
    } catch {
      window.scrollTo(0, 0);
    }

    if (!hadPending || !pendingOrderBanner) return;
    if (pendingOrderMessage) {
      pendingOrderMessage.textContent =
        'You are signed in. Please enter destination and package details again, then check rates to place an order.';
    }
    pendingOrderBanner.hidden = false;
  }

  pendingOrderBanner
    ?.querySelector('[data-pending-order-continue]')
    ?.addEventListener('click', () => {
      hidePendingOrderBanner();
      const ratesSection = root.querySelector('#SfcRates, [id^="SfcRates-"]');
      ratesSection?.scrollIntoView({behavior: 'smooth', block: 'start'});
      rateForm?.querySelector('[name="country"]')?.focus();
    });

  pendingOrderBanner
    ?.querySelector('[data-pending-order-dismiss]')
    ?.addEventListener('click', () => {
      hidePendingOrderBanner();
    });

  function setOrdersStatus(message, {error = false} = {}) {
    if (!ordersStatusEl) return;
    if (!message) {
      ordersStatusEl.hidden = true;
      ordersStatusEl.textContent = '';
      return;
    }
    ordersStatusEl.hidden = false;
    ordersStatusEl.textContent = message;
    ordersStatusEl.classList.toggle('inline-error', error);
  }

  function trackOrderNumber(value) {
    const code = String(value || '').trim();
    if (!code || !trackingInput) return;
    trackingInput.value = code;
    const trackingSection = root.querySelector('#SfcTracking, [id^="SfcTracking-"]');
    trackingSection?.scrollIntoView({behavior: 'smooth', block: 'start'});
    if (trackingForm?.requestSubmit) {
      trackingForm.requestSubmit();
    } else {
      trackingForm?.dispatchEvent(
        new Event('submit', {cancelable: true, bubbles: true}),
      );
    }
  }

  function closeOrderDetailDialog() {
    activeOrderDetail = null;
    closeAllLabelMenus();
    if (!orderDetailDialog) return;
    if (typeof orderDetailDialog.close === 'function') {
      orderDetailDialog.close();
    } else {
      orderDetailDialog.removeAttribute('open');
    }
  }

  function openOrderDetailDialog(order) {
    if (!orderDetailDialog || !orderDetailBody) return;
    activeOrderDetail = order;
    if (orderDetailTitle) {
      orderDetailTitle.textContent = order.orderCode || 'Shipment';
    }
    if (orderDetailStatus) {
      orderDetailStatus.textContent = [
        order.status,
        order.shippingMethod,
        order.countryName || order.country,
      ]
        .filter(Boolean)
        .join(' · ');
    }

    const dims = [order.length, order.width, order.height]
      .filter((n) => n != null && Number(n) > 0)
      .join(' × ');
    const rows = [
      ['Order code', order.orderCode],
      ['SFC order code', order.sfcOrderCode],
      ['Customer reference', order.customerOrderNo],
      ['Status', order.status],
      ['Shipping method', order.shippingMethod],
      ['Tracking number', order.trackingNumber],
      ['China domestic tracking', order.domesticTrackingNo],
      ['Recipient', order.recipientName],
      ['Phone', order.recipientPhone],
      ['Email', order.recipientEmail],
      ['Address', order.recipientAddress],
      ['City', order.city],
      ['State / Province', order.state],
      ['Postal code', order.zipCode],
      ['Country', order.countryName || order.country],
      ['Weight (kg)', order.weight != null ? String(order.weight) : ''],
      ['Dimensions (cm)', dims ? `${dims}` : ''],
      ['Pieces', order.quantity != null ? String(order.quantity) : ''],
      [
        'Declare worth',
        order.declareWorth != null ? String(order.declareWorth) : '',
      ],
      ['Created', order.addTime],
      ['Sent', order.sendTime],
      ['Delivered', order.deliveryTime],
    ];

    clear(orderDetailBody);
    rows.forEach(([label, value]) => {
      if (value == null || String(value).trim() === '') return;
      const row = document.createElement('div');
      row.append(element('dt', '', label), element('dd', '', String(value)));
      orderDetailBody.append(row);
    });

    if (orderDetailTrackBtn) {
      const trackValue = order.trackingNumber || order.orderCode;
      orderDetailTrackBtn.hidden = !trackValue;
      orderDetailTrackBtn.onclick = () => {
        closeOrderDetailDialog();
        if (trackValue) trackOrderNumber(trackValue);
      };
    }

    if (orderDetailPrintBtn) {
      orderDetailPrintBtn.onclick = () => {
        setLabelMenuOpen(orderDetailLabelMenu, false);
        runOrderLabelAction(order, 'print', orderDetailLabelTrigger);
      };
    }
    if (orderDetailDownloadBtn) {
      orderDetailDownloadBtn.onclick = () => {
        setLabelMenuOpen(orderDetailLabelMenu, false);
        runOrderLabelAction(order, 'download', orderDetailLabelTrigger);
      };
    }

    detailDomesticOrder = {
      orderCode: order.orderCode || order.sfcOrderCode || '',
      sfcOrderCode: order.sfcOrderCode || '',
      customerOrderNo: order.customerOrderNo || '',
      domesticTrackingNo: order.domesticTrackingNo || '',
    };
    const existingDomestic = String(order.domesticTrackingNo || '').trim();
    if (orderDetailDomesticInput) {
      orderDetailDomesticInput.value = existingDomestic;
    }
    setStatusEl(
      orderDetailDomesticStatus,
      existingDomestic
        ? `Saved: ${existingDomestic}. You can update it if needed.`
        : '',
    );

    if (typeof orderDetailDialog.showModal === 'function') {
      orderDetailDialog.showModal();
    } else {
      orderDetailDialog.setAttribute('open', 'open');
    }
  }

  function buildOrderRow(order) {
    const card = element('article', 'sfc-order-card');
    const top = element('div', 'sfc-order-card__top');
    const main = element('div', 'sfc-order-card__main');
    main.append(
      element('strong', 'sfc-order-card__code', order.orderCode || '—'),
      element(
        'p',
        'sfc-order-card__meta',
        [
          order.shippingMethod,
          order.country || order.countryName,
          order.addTime ? String(order.addTime).slice(0, 16) : '',
        ]
          .filter(Boolean)
          .join(' · '),
      ),
    );
    const status = element(
      'span',
      'sfc-order-card__status',
      order.status || '—',
    );
    top.append(main, status);

    const details = element('div', 'sfc-order-card__details');
    const bits = [];
    if (order.recipientName) bits.push(`To ${order.recipientName}`);
    if (order.city) bits.push(order.city);
    if (order.customerOrderNo) bits.push(`Ref ${order.customerOrderNo}`);
    if (order.trackingNumber) bits.push(`Track ${order.trackingNumber}`);
    if (order.domesticTrackingNo) {
      bits.push(`China ${order.domesticTrackingNo}`);
    }
    details.append(element('p', '', bits.join(' · ') || 'No extra details'));

    const actions = element('div', 'sfc-order-card__actions');
    const detailBtn = element('button', 'button button--ghost');
    detailBtn.type = 'button';
    detailBtn.textContent = 'Details';
    detailBtn.addEventListener('click', () => openOrderDetailDialog(order));
    actions.append(detailBtn);
    actions.append(buildLabelMenu(order));

    const chinaTrackBtn = element('button', 'button button--ghost');
    chinaTrackBtn.type = 'button';
    chinaTrackBtn.textContent = order.domesticTrackingNo
      ? 'China tracking ✓'
      : 'China tracking';
    chinaTrackBtn.addEventListener('click', () => {
      openOrderDetailDialog(order);
      orderDetailDomesticInput?.focus();
    });
    actions.append(chinaTrackBtn);

    const trackValue = order.trackingNumber || order.orderCode;
    if (trackValue) {
      const trackBtn = element('button', 'button button--ghost');
      trackBtn.type = 'button';
      trackBtn.textContent = 'Track';
      trackBtn.addEventListener('click', () => trackOrderNumber(trackValue));
      actions.append(trackBtn);
    }
    card.append(top, details, actions);
    return card;
  }

  function renderOrdersList(orders, {append = false} = {}) {
    if (!ordersListEl) return;
    if (!append) {
      clear(ordersListEl);
      ordersLoaded = [];
    }
    if (!orders?.length && !ordersLoaded.length) {
      const empty = element('div', 'empty-state orders-empty');
      empty.append(
        element('p', 'eyebrow', 'NO ORDERS YET'),
        element('h3', '', 'No SFC shipments on this account'),
        element(
          'p',
          '',
          'Place an order from a rate result and it will show up here.',
        ),
      );
      ordersListEl.append(empty);
      return;
    }
    orders.forEach((order) => {
      ordersLoaded.push(order);
      ordersListEl.append(buildOrderRow(order));
    });
  }

  async function loadOrders({page = 1, append = false} = {}) {
    if (!ordersListEl) return;
    if (root.dataset.customerLoggedIn !== 'true') {
      return;
    }
    if (!append) {
      clear(ordersListEl);
      ordersListEl.append(
        element('p', 'order-fields-loading', 'Loading your SFC orders…'),
      );
    }
    setOrdersStatus('');
    try {
      const data = await fetchOrders({page, pageSize: 20, baseUrl: apiBase});
      if (!data?.ok) {
        if (data?.code === 'LOGIN_REQUIRED' || data?.code === 'BINDING_REQUIRED') {
          setOrdersStatus(
            data.message || 'Sign in and link your SFC account to see orders.',
            {error: true},
          );
          clear(ordersListEl);
          return;
        }
        setOrdersStatus(data?.message || 'Unable to load orders.', {error: true});
        if (!append) clear(ordersListEl);
        return;
      }
      ordersPage = data.page || page;
      ordersHaveNext = Boolean(data.haveNext);
      if (ordersFooterEl) ordersFooterEl.hidden = !ordersHaveNext;
      if (!append) clear(ordersListEl);
      renderOrdersList(data.orders || [], {append});
      if (typeof data.total === 'number' && data.total > 0) {
        setOrdersStatus(`${data.total} order${data.total === 1 ? '' : 's'} on your SFC account`);
      }
    } catch {
      setOrdersStatus('Unable to load orders. Try again.', {error: true});
      if (!append) clear(ordersListEl);
    }
  }

  root.querySelector('[data-orders-refresh]')?.addEventListener('click', () => {
    loadOrders({page: 1, append: false});
  });
  ordersMoreBtn?.addEventListener('click', () => {
    if (!ordersHaveNext) return;
    loadOrders({page: ordersPage + 1, append: true});
  });

  // —— Shipping Center: real orders table (paged, no summary cards) ——
  const isShippingCenter = root.hasAttribute('data-sfc-shipping-center');
  const CENTER_VIEWS = ['overview', 'orders'];

  function getCenterViewFromHash() {
    const raw = String(location.hash || '')
      .replace(/^#/, '')
      .trim()
      .toLowerCase();
    return CENTER_VIEWS.includes(raw) ? raw : 'overview';
  }

  function setCenterView(view, {updateHash = true} = {}) {
    if (!isShippingCenter) return;
    const next = CENTER_VIEWS.includes(view) ? view : 'overview';
    root.querySelectorAll('[data-center-panel]').forEach((panel) => {
      panel.hidden = panel.getAttribute('data-center-panel') !== next;
    });
    root.querySelectorAll('[data-center-nav]').forEach((link) => {
      const active = link.getAttribute('data-center-nav') === next;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    if (updateHash) {
      const nextHash = `#${next}`;
      if (location.hash !== nextHash) {
        history.replaceState(null, '', `${location.pathname}${location.search}${nextHash}`);
      }
    }
  }

  if (isShippingCenter) {
    setCenterView(getCenterViewFromHash(), {updateHash: false});
    root.addEventListener('click', (event) => {
      const link = event.target.closest?.('[data-center-nav]');
      if (!link || !root.contains(link)) return;
      event.preventDefault();
      setCenterView(link.getAttribute('data-center-nav') || 'overview');
    });
    window.addEventListener('hashchange', () => {
      setCenterView(getCenterViewFromHash(), {updateHash: false});
    });
  }

  const centerOrdersTbody = root.querySelector('[data-center-orders-tbody]');
  const centerOrdersStatusEl = root.querySelector('[data-center-orders-status]');
  const centerOrdersFooter = root.querySelector('[data-center-orders-footer]');
  const centerOrdersPrevBtn = root.querySelector('[data-center-orders-prev]');
  const centerOrdersNextBtn = root.querySelector('[data-center-orders-next]');
  const centerOrdersPageEl = root.querySelector('[data-center-orders-page]');
  const centerOrdersEmptyEl = root.querySelector('[data-center-orders-empty]');
  const centerOrdersTableWrap = root.querySelector(
    '[data-center-orders-table-wrap]',
  );
  const centerOrdersRefreshBtn = root.querySelector(
    '[data-center-orders-refresh]',
  );
  const CENTER_ORDERS_PAGE_SIZE = 5;
  let centerOrdersPage = 1;
  let centerOrdersHaveNext = false;
  let centerOrdersTotal = 0;
  let centerStatOrders = null;
  const centerStatOrdersEl = root.querySelector('[data-center-stat-orders]');

  function setCenterStat(el, value) {
    if (!el) return;
    if (value == null || Number.isNaN(Number(value))) {
      el.classList.add('is-loading');
      el.replaceChildren();
      const pulse = document.createElement('span');
      pulse.className = 'sfc-center-stat__pulse';
      pulse.setAttribute('aria-hidden', 'true');
      el.append(pulse);
      return;
    }
    el.classList.remove('is-loading');
    el.textContent = String(value);
  }

  function refreshCenterStatsPanel() {
    setCenterStat(centerStatOrdersEl, centerStatOrders);
  }

  function setCenterStatusEl(el, message, {error = false, loading = false} = {}) {
    if (!el) return;
    if (!message && !loading) {
      el.hidden = true;
      el.textContent = '';
      el.classList.remove('inline-error', 'is-loading');
      return;
    }
    el.hidden = false;
    el.classList.toggle('inline-error', error);
    el.classList.toggle('is-loading', loading);
    if (loading) {
      el.replaceChildren();
      const spinner = document.createElement('span');
      spinner.className = 'sfc-center-inline-spinner';
      spinner.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.textContent = message || 'Loading…';
      el.append(spinner, label);
      return;
    }
    el.textContent = message;
  }

  function centerOrderStatusLabel(order) {
    return order?.status || '—';
  }

  function centerOrderRoute(order) {
    const dest = order?.countryName || order?.country || '';
    return dest ? `China → ${dest}` : 'China → —';
  }

  function centerOrderUpdated(order) {
    const raw = order?.addTime || order?.sendTime || '';
    if (!raw) return '—';
    return String(raw).slice(0, 16);
  }

  function setCenterOrdersStatus(message, {error = false, loading = false} = {}) {
    setCenterStatusEl(centerOrdersStatusEl, message, {error, loading});
  }

  function updateCenterOrdersPager() {
    const totalPages = Math.max(
      1,
      Math.ceil(centerOrdersTotal / CENTER_ORDERS_PAGE_SIZE) || 1,
    );
    const showPager = centerOrdersTotal > CENTER_ORDERS_PAGE_SIZE;
    if (centerOrdersFooter) centerOrdersFooter.hidden = !showPager;
    if (centerOrdersPageEl) {
      centerOrdersPageEl.textContent = `Page ${centerOrdersPage} / ${totalPages}`;
    }
    if (centerOrdersPrevBtn) {
      centerOrdersPrevBtn.disabled = centerOrdersPage <= 1;
    }
    if (centerOrdersNextBtn) {
      centerOrdersNextBtn.disabled = !centerOrdersHaveNext;
    }
  }

  function renderCenterOrdersRows(orders) {
    if (!centerOrdersTbody) return;
    clear(centerOrdersTbody);
    if (centerOrdersEmptyEl) {
      clear(centerOrdersEmptyEl);
      centerOrdersEmptyEl.hidden = true;
    }
    if (!orders?.length) {
      if (centerOrdersTableWrap) centerOrdersTableWrap.hidden = true;
      if (centerOrdersEmptyEl) {
        centerOrdersEmptyEl.hidden = false;
        centerOrdersEmptyEl.append(
          element('p', '', 'No shipments yet'),
          element(
            'p',
            'sfc-center-placeholder',
            'Place an order from the home page after checking rates.',
          ),
        );
      }
      return;
    }
    if (centerOrdersTableWrap) centerOrdersTableWrap.hidden = false;
    orders.forEach((order) => {
      const tr = document.createElement('tr');
      [
        order.orderCode || '—',
        centerOrderRoute(order),
        centerOrderStatusLabel(order),
        centerOrderUpdated(order),
      ].forEach((text) => {
        const td = document.createElement('td');
        td.textContent = text;
        tr.append(td);
      });
      centerOrdersTbody.append(tr);
    });
  }

  async function loadCenterOrders({page = 1} = {}) {
    if (!isShippingCenter || !centerOrdersTbody) return;
    if (root.dataset.customerLoggedIn !== 'true') {
      setCenterOrdersStatus('Sign in to view your orders.', {error: true});
      return;
    }
    if (centerOrdersTableWrap) centerOrdersTableWrap.hidden = true;
    if (centerOrdersFooter) centerOrdersFooter.hidden = true;
    if (centerOrdersEmptyEl) {
      clear(centerOrdersEmptyEl);
      centerOrdersEmptyEl.hidden = true;
    }
    clear(centerOrdersTbody);
    setCenterOrdersStatus('Loading orders…', {loading: true});
    try {
      const data = await fetchOrders({
        page,
        pageSize: CENTER_ORDERS_PAGE_SIZE,
        baseUrl: apiBase,
      });
      if (!data?.ok) {
        if (
          data?.code === 'LOGIN_REQUIRED' ||
          data?.code === 'BINDING_REQUIRED'
        ) {
          setCenterOrdersStatus(
            data.message || 'Sign in and link your SFC account to view orders.',
            {error: true},
          );
        } else {
          setCenterOrdersStatus(data?.message || 'Could not load orders.', {
            error: true,
          });
        }
        if (centerOrdersFooter) centerOrdersFooter.hidden = true;
        return;
      }
      centerOrdersPage = data.page || page;
      centerOrdersHaveNext = Boolean(data.haveNext);
      centerOrdersTotal =
        typeof data.total === 'number' ? data.total : (data.orders || []).length;
      centerStatOrders = centerOrdersTotal;
      renderCenterOrdersRows(data.orders || []);
      updateCenterOrdersPager();
      refreshCenterStatsPanel();
      if (centerOrdersTotal > 0) {
        setCenterOrdersStatus(`${centerOrdersTotal} shipment(s)`);
      } else {
        setCenterOrdersStatus('');
      }
    } catch {
      setCenterOrdersStatus('Could not load orders. Please try again.', {error: true});
      if (centerOrdersFooter) centerOrdersFooter.hidden = true;
    }
  }

  centerOrdersRefreshBtn?.addEventListener('click', () => {
    loadCenterOrders({page: 1});
  });
  centerOrdersPrevBtn?.addEventListener('click', () => {
    if (centerOrdersPage <= 1) return;
    loadCenterOrders({page: centerOrdersPage - 1});
  });
  centerOrdersNextBtn?.addEventListener('click', () => {
    if (!centerOrdersHaveNext) return;
    loadCenterOrders({page: centerOrdersPage + 1});
  });

  root.querySelector('[data-account-menu-orders]')?.addEventListener('click', () => {
    setAccountMenuOpen(false);
  });
  root.querySelectorAll('[data-order-detail-close]').forEach((btn) => {
    btn.addEventListener('click', () => closeOrderDetailDialog());
  });
  orderDetailDialog?.addEventListener('click', (event) => {
    if (event.target === orderDetailDialog) closeOrderDetailDialog();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && orderDetailDialog?.open) {
      closeOrderDetailDialog();
    }
  });

  // Signed-in: ask the server to resolve/link the verified Shopify customer.
  // No email or account identifier from the DOM is accepted as authority.
  if (root.dataset.customerLoggedIn === 'true') {
    linkAccount({baseUrl: apiBase})
      .then(() => {
        refreshAccountBalance();
        loadOrders({page: 1});
        loadCenterOrders({page: 1});
      })
      .catch(() => {
        refreshAccountBalance();
        loadOrders({page: 1});
        loadCenterOrders({page: 1});
      });
  } else {
    refreshAccountBalance();
  }
  resumePendingOrderAfterLogin();

  function clampDecimalInput(input, {decimals = 2, round = false} = {}) {
    if (!input) return;
    const raw = String(input.value ?? '');
    if (raw === '' || raw === '-' || raw === '.') return;
    if (raw.includes('.')) {
      const [intPart, decPart = ''] = raw.split('.');
      if (decPart.length > decimals) {
        input.value = `${intPart}.${decPart.slice(0, decimals)}`;
      }
    }
    if (!round) return;
    const n = Number(input.value);
    if (!Number.isFinite(n)) return;
    const factor = 10 ** decimals;
    input.value = (Math.round(n * factor) / factor).toFixed(decimals);
  }

  function clampIntegerInput(input, {round = false} = {}) {
    if (!input) return;
    const raw = String(input.value ?? '');
    if (raw === '' || raw === '-') return;
    if (raw.includes('.')) {
      input.value = raw.split('.')[0];
    }
    if (!round) return;
    const n = Number(input.value);
    if (!Number.isFinite(n)) return;
    input.value = String(Math.round(n));
  }

  // Avoid form.elements.length — that is the control count, not the Length field.
  function packageField(form, name) {
    return form?.querySelector(`[name="${name}"]`) || null;
  }

  function bindPackageFieldClamps(form) {
    if (!form) return;
    const weightInput = packageField(form, 'weight');
    const dimInputs = ['length', 'width', 'height']
      .map((name) => packageField(form, name))
      .filter((el) => el && typeof el.addEventListener === 'function');

    weightInput?.addEventListener('input', () =>
      clampDecimalInput(weightInput, {decimals: 2}),
    );
    weightInput?.addEventListener('change', () =>
      clampDecimalInput(weightInput, {decimals: 2, round: true}),
    );
    weightInput?.addEventListener('blur', () =>
      clampDecimalInput(weightInput, {decimals: 2, round: true}),
    );

    dimInputs.forEach((input) => {
      input.addEventListener('input', () => clampIntegerInput(input));
      input.addEventListener('change', () =>
        clampIntegerInput(input, {round: true}),
      );
      input.addEventListener('blur', () =>
        clampIntegerInput(input, {round: true}),
      );
    });
  }

  function serializeRateForm(form) {
    const values = Object.fromEntries(new FormData(form));
    const mode = String(values.firstMileMode || 'pickup').toLowerCase();
    const weightEl = packageField(form, 'weight');
    const lengthEl = packageField(form, 'length');
    const widthEl = packageField(form, 'width');
    const heightEl = packageField(form, 'height');
    clampDecimalInput(weightEl, {decimals: 2, round: true});
    clampIntegerInput(lengthEl, {round: true});
    clampIntegerInput(widthEl, {round: true});
    clampIntegerInput(heightEl, {round: true});
    return {
      firstMileMode: mode === 'pickup' ? 'pickup' : 'dropoff',
      pickupProvince: String(values.pickupProvince || '').trim(),
      country: String(values.country || '').trim().toUpperCase(),
      state: String(values.state || '').trim(),
      city: String(values.city || '').trim(),
      zipCode: String(values.zipCode || '').trim().toUpperCase(),
      weight: Math.round(Number(weightEl?.value) * 100) / 100,
      length: Math.round(Number(lengthEl?.value)),
      width: Math.round(Number(widthEl?.value)),
      height: Math.round(Number(heightEl?.value)),
    };
  }

  const {
    renderLoading: renderRateLoading,
    renderRates,
    renderState: renderRateState,
  } = createRateUi({
    root,
    results: rateResults,
    getParcel: () => lastParcel || currentParcel() || {},
    onStartOrder: openOrderPanel,
  });

  bindPackageFieldClamps(rateForm);

  orderForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (root.dataset.customerLoggedIn !== 'true') {
      goToShopifyLogin();
      return;
    }

    if (!orderForm.reportValidity()) {
      orderForm.querySelector(':invalid')?.focus();
      return;
    }

    const cargoValidation = validateCargoDeclaration(collectCargoDeclaration());
    if (!cargoValidation.valid) {
      setCargoStatus(cargoValidation.message, {error: true});
      orderForm.querySelector('[data-cargo-gate]')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }

    const parcel = currentParcel();
    if (parcel?.firstMileMode === 'pickup') {
      const contact = String(
        orderForm.querySelector('[data-order-pickup-contact]')?.value || '',
      ).trim();
      const phoneInput = orderForm.querySelector('[data-order-pickup-phone]');
      const phoneNormalized = normalizeChinaMobile(phoneInput?.value);
      const address = String(
        orderForm.querySelector('[data-order-pickup-address]')?.value || '',
      ).trim();
      if (!contact || !address) {
        setOrderSubmitStatus(
          'Enter pickup contact, phone, and address for China collection.',
          {error: true},
        );
        return;
      }
      if (!phoneNormalized) {
        setOrderSubmitStatus(
          'Enter a valid China mobile number (11 digits, starts with 1).',
          {error: true},
        );
        phoneInput?.focus();
        return;
      }
      if (phoneInput) phoneInput.value = phoneNormalized;
    }

    const shippingMethod = String(
      orderForm.elements.shippingMethod?.value || '',
    ).trim();
    const country = String(
      orderForm.elements.country?.value || parcel?.country || '',
    )
      .trim()
      .toUpperCase();

    if (!shippingMethod || !country) {
      setOrderSubmitStatus(
        'Missing channel or country. Check rates again and pick a service.',
        {error: true},
      );
      return;
    }

    const items = collectOrderItems();
    if (!items.length) {
      setOrderSubmitStatus('Add at least one customs item for this parcel.', {
        error: true,
      });
      return;
    }
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const desc = String(item.descriptionEn || '').trim();
      const qty = Number(item.quantity);
      const unitValue = Number(item.declaredValue);
      const unitWeight = Number(item.detailWeight);
      if (!desc) {
        setOrderSubmitStatus(`Item ${i + 1}: enter an English description.`, {
          error: true,
        });
        return;
      }
      if (!Number.isFinite(qty) || qty < 1) {
        setOrderSubmitStatus(`Item ${i + 1}: quantity must be at least 1.`, {
          error: true,
        });
        return;
      }
      if (!Number.isFinite(unitValue) || unitValue <= 0) {
        setOrderSubmitStatus(
          `Item ${i + 1}: unit value must be greater than 0.`,
          {error: true},
        );
        return;
      }
      if (!Number.isFinite(unitWeight) || unitWeight <= 0) {
        setOrderSubmitStatus(
          `Item ${i + 1}: unit weight (kg) is required.`,
          {error: true},
        );
        return;
      }
    }

    const values = Object.fromEntries(new FormData(orderForm));
    const fields = {...values};
    delete fields.shippingMethod;
    delete fields.country;
    delete fields.pickupContact;
    delete fields.pickupPhone;
    delete fields.pickupAddress;
    Object.keys(fields).forEach((key) => {
      if (key.startsWith('item_')) delete fields[key];
    });
    ORDER_ITEM_FIELD_KEYS.forEach((key) => {
      delete fields[key];
    });
    delete fields.worth;
    delete fields.total_export_declare;

    const pickupContact = String(
      orderForm.querySelector('[data-order-pickup-contact]')?.value || '',
    ).trim();
    const pickupPhone =
      normalizeChinaMobile(
        orderForm.querySelector('[data-order-pickup-phone]')?.value,
      ) || '';
    const pickupAddress = String(
      orderForm.querySelector('[data-order-pickup-address]')?.value || '',
    ).trim();

    const pickup =
      parcel?.firstMileMode === 'pickup'
        ? {
            mode: 'pickup',
            contact: pickupContact,
            phone: pickupPhone,
            countryCode: '86',
            address: pickupAddress,
            province: parcel.pickupProvince || '',
            firstMileAmount: Number(activeOrderRate?.firstMileAmount || 0),
          }
        : {mode: 'dropoff'};

    const submit = orderForm.querySelector('[data-order-submit]');
    const submitHtml = submit?.innerHTML;
    if (submit) {
      submit.disabled = true;
      submit.classList.add('is-busy');
      submit.innerHTML =
        '<span class="button__spinner" aria-hidden="true"></span> Running safety checks…';
    }
    setOrderSubmitStatus('Confirming account approval and cargo eligibility…');
    setCargoStatus('Checking this shipment with SFC…');
    hideOrderSuccessGuide();

    try {
      const accountCompliance = await fetchCompliance({baseUrl: apiBase});
      if (!accountCompliance?.ok || !isAccountApproved(accountCompliance)) {
        pendingOrderAfterCompliance = activeOrderRate;
        renderComplianceUi(accountCompliance?.ok ? accountCompliance : {});
        openComplianceDialog();
        setOrderSubmitStatus(
          accountCompliance?.message ||
            'SFC account approval is required before creating an order.',
          {error: true},
        );
        return;
      }

      const cargoCheck = await checkCargoCompliance(
        {
          shippingMethod,
          country,
          items,
          parcel: parcel || {},
          declaration: cargoValidation.declaration,
        },
        {baseUrl: apiBase},
      );

      if (!cargoDecisionAllowsOrder(cargoCheck)) {
        const decision = String(cargoCheck?.decision || '').toUpperCase();
        const fallback =
          decision === 'MANUAL_REVIEW'
            ? 'This shipment has been routed to manual review. Do not send the parcel until SFC approves it.'
            : decision === 'BLOCK'
              ? 'The selected service cannot accept this cargo.'
              : 'SFC could not confirm cargo eligibility. No order was created.';
        setCargoStatus(cargoCheck?.message || fallback, {error: true});
        setOrderSubmitStatus(cargoCheck?.message || fallback, {error: true});
        return;
      }

      setCargoStatus('Cargo screening passed for the selected service.');
      if (submit) {
        submit.innerHTML =
          '<span class="button__spinner" aria-hidden="true"></span> Creating order…';
      }
      setOrderSubmitStatus('Submitting the approved shipment to SFC…');

      const data = await createSfcOrder(
        {
          shippingMethod,
          country,
          fields,
          items,
          parcel: parcel || {},
          pickup,
          cargoDeclaration: cargoValidation.declaration,
          cargoReviewId: cargoCheck.reviewId || '',
        },
        {baseUrl: apiBase},
      );
      if (data?.ok) {
        setOrderSubmitStatus('');
        showOrderSuccessGuide(data, parcel);
        loadOrders({page: 1, append: false});
        return;
      }
      if (data?.code === 'LOGIN_REQUIRED' || data?.code === 'BINDING_REQUIRED') {
        goToShopifyLogin();
        return;
      }
      if (String(data?.code || '').startsWith('ACCOUNT_REVIEW_')) {
        pendingOrderAfterCompliance = activeOrderRate;
        openComplianceDialog();
      }
      hideOrderSuccessGuide();
      setOrderSubmitStatus(
        data?.message || 'Unable to create the order. Please check the fields.',
        {error: true},
      );
    } catch {
      hideOrderSuccessGuide();
      setOrderSubmitStatus(
        'Safety checks are unavailable. No order was created. Try again later.',
        {error: true},
      );
      setCargoStatus('Safety checks are unavailable. Shipping remains locked.', {
        error: true,
      });
    } finally {
      if (submit && submitHtml != null) {
        submit.disabled = false;
        submit.classList.remove('is-busy');
        submit.innerHTML = submitHtml;
      }
    }
  });


  rateForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    closeOrderPanel();
    const requestGeneration = ++rateRequestGeneration;
    const input = serializeRateForm(rateForm);
    const validation = validateRateInput({
      ...input,
      postalCode: input.zipCode,
    });
    if (!validation.valid) {
      renderRateState('Check the shipment details', validation.message, {
        error: true,
      });
      if (input.firstMileMode === 'pickup' && !input.pickupProvince) {
        rateForm.querySelector('[data-pickup-province]')?.focus();
      } else {
        rateForm.querySelector(':invalid')?.focus();
      }
      return;
    }

    const submit = rateForm.querySelector('[type="submit"]');
    const submitHtml = submit.innerHTML;
    submit.disabled = true;
    submit.classList.add('is-busy');
    submit.innerHTML =
      '<span class="button__spinner" aria-hidden="true"></span> Checking rates…';
    renderRateLoading();
    try {
      const response = await queryRates(input, {baseUrl: apiBase});
      if (requestGeneration !== rateRequestGeneration) return;
      if (response.ok) {
        lastParcel = input;
        renderRates(response);
        return;
      }
      renderRateState(
        response.code === 'RATE_LIMIT_REACHED' || response.code === 'RATE_LIMITED'
          ? 'Too many quote requests'
          : 'A live quote is not available',
        response.message || 'Please try again or contact the SFC team.',
        {error: true},
      );
    } catch {
      if (requestGeneration !== rateRequestGeneration) return;
      renderRateState(
        'SFC freight quotes are unavailable',
        'Please try again or contact the SFC team.',
        {error: true},
      );
    } finally {
      if (requestGeneration === rateRequestGeneration) {
        submit.disabled = false;
        submit.classList.remove('is-busy');
        submit.innerHTML = submitHtml;
      }
    }
  });

  function renderTrackingLoading() {
    trackingWidgetContainer.innerHTML = `
      <div class="tracking-widget-state" role="status">
        <span class="tracking-widget-spinner" aria-hidden="true"></span>
        <h3>Loading live tracking</h3>
        <p>Checking SFC tracking securely…</p>
      </div>
    `;
  }

  function renderTrackingValidationError() {
    trackingWidgetContainer.innerHTML = renderTrackingFailure(
      'INTERNAL_ERROR',
      'Enter 5–50 letters, numbers or hyphens without spaces.',
    );
  }

  async function submitTrackingLookup() {
    const requestGeneration = ++trackingRequestGeneration;
    const value = trackingInput.value.trim();
    if (trackingProviderName) trackingProviderName.textContent = 'SFC';
    if (!isValidTrackingNumber(value)) {
      renderTrackingValidationError();
      trackingInput.focus();
      return;
    }

    const submit = trackingForm.querySelector('[type="submit"]');
    submit.disabled = true;
    renderTrackingLoading();
    try {
      const response = await queryTracking(value, {baseUrl: apiBase});
      if (requestGeneration !== trackingRequestGeneration) return;
      if (response.ok) {
        trackingWidgetContainer.innerHTML = renderSfcTracking(
          response.result,
        );
      } else if (
        response.code === 'LOGIN_REQUIRED' ||
        response.code === 'BINDING_REQUIRED'
      ) {
        trackingWidgetContainer.innerHTML = renderTrackingFailure(
          response.code,
          response.message ||
            (response.code === 'LOGIN_REQUIRED'
              ? 'Sign in with Shopify to track your own shipments.'
              : 'Link your SFC account before tracking shipments.'),
        );
        const loginBtn = document.createElement('button');
        loginBtn.type = 'button';
        loginBtn.className = 'button button--primary';
        loginBtn.textContent =
          response.code === 'LOGIN_REQUIRED'
            ? 'Sign in'
            : 'Link SFC account';
        loginBtn.addEventListener('click', () => goToShopifyLogin());
        trackingWidgetContainer
          .querySelector('.tracking-widget-state')
          ?.append(loginBtn);
      } else {
        trackingWidgetContainer.innerHTML = renderTrackingFailure(
          response.code,
          response.message,
        );
      }
      focusResult(trackingWidgetContainer);
    } catch {
      if (requestGeneration !== trackingRequestGeneration) return;
      trackingWidgetContainer.innerHTML = renderTrackingFailure(
        'INTERNAL_ERROR',
      );
      focusResult(trackingWidgetContainer);
    } finally {
      if (requestGeneration === trackingRequestGeneration) {
        submit.disabled = false;
      }
    }
  }

  trackingForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    submitTrackingLookup();
  });

  trackingWidgetContainer?.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="retry-tracking"]')) {
      submitTrackingLookup();
    }
  });

  for (const link of root.querySelectorAll('[data-sfc-registration]')) {
    link.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('sfc:registration-click', {
        detail: {source: 'storefront_sfc_tools'},
      }));
    });
  }

  const backTopBtn = root.querySelector('[data-sfc-back-top]');
  if (backTopBtn) {
    const syncBackTop = () => {
      const show = window.scrollY > 420;
      backTopBtn.classList.toggle('is-visible', show);
      backTopBtn.hidden = !show;
    };
    syncBackTop();
    window.addEventListener('scroll', syncBackTop, {passive: true});
    backTopBtn.addEventListener('click', () => {
      window.scrollTo({top: 0, left: 0, behavior: 'smooth'});
    });
  }

  if (currentYear) currentYear.textContent = String(new Date().getFullYear());
}

function initAll(scope) {
  if (scope.matches?.('[data-sfc-tools-root]')) initSfcTools(scope);
  scope.querySelectorAll?.('[data-sfc-tools-root]').forEach(initSfcTools);
}

export { initSfcTools, initAll };


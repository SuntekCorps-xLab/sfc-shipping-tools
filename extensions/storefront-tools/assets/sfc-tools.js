"use strict";
(() => {
  // extensions/storefront-tools/src/api.js
  function endpoint(baseUrl, path) {
    return `${String(baseUrl || "/apps/sfc-tools").replace(/\/+$/, "")}/${path}`;
  }
  async function postJson(url, body, fetchImpl = globalThis.fetch) {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: String(url).startsWith("/") ? "same-origin" : "omit",
      body: JSON.stringify(body)
    });
    return response.json();
  }
  function linkAccount({ baseUrl = "/apps/sfc-tools", fetchImpl = globalThis.fetch } = {}) {
    return postJson(
      endpoint(baseUrl, "account-link"),
      {},
      fetchImpl
    );
  }
  function queryRates(input, { baseUrl = "/apps/sfc-tools", fetchImpl = globalThis.fetch } = {}) {
    var _a, _b, _c, _d, _e;
    return postJson(
      endpoint(baseUrl, "rates"),
      {
        country: String((_a = input.country) != null ? _a : "").trim().toUpperCase(),
        state: String((_b = input.state) != null ? _b : "").trim(),
        city: String((_c = input.city) != null ? _c : "").trim(),
        zipCode: String(
          (_e = (_d = input.zipCode) != null ? _d : input.postalCode) != null ? _e : ""
        ).trim().toUpperCase(),
        weight: Number(input.weight),
        length: Number(input.length),
        width: Number(input.width),
        height: Number(input.height)
      },
      fetchImpl
    );
  }
  function queryTracking(trackingNumber, { baseUrl = "/apps/sfc-tools", fetchImpl = globalThis.fetch } = {}) {
    return postJson(
      endpoint(baseUrl, "tracking"),
      {
        trackingNumber: String(
          trackingNumber
        ).trim().toUpperCase()
      },
      fetchImpl
    );
  }
  async function fetchBalance({ baseUrl = "/apps/sfc-tools", fetchImpl = globalThis.fetch } = {}) {
    const response = await fetchImpl(endpoint(baseUrl, "balance"), {
      method: "GET",
      credentials: String(endpoint(baseUrl, "balance")).startsWith("/") ? "same-origin" : "omit",
      headers: { Accept: "application/json" }
    });
    return response.json();
  }
  async function fetchOrderFields(shippingMethod, country, { baseUrl = "/apps/sfc-tools", fetchImpl = globalThis.fetch } = {}) {
    return postJson(
      endpoint(baseUrl, "order-fields"),
      {
        shippingMethod: String(shippingMethod != null ? shippingMethod : "").trim(),
        country: String(country != null ? country : "").trim().toUpperCase()
      },
      fetchImpl
    );
  }
  function createSfcOrder(payload, { baseUrl = "/apps/sfc-tools", fetchImpl = globalThis.fetch } = {}) {
    return postJson(endpoint(baseUrl, "create-order"), payload, fetchImpl);
  }
  function bindDomesticTracking(payload, { baseUrl = "/apps/sfc-tools", fetchImpl = globalThis.fetch } = {}) {
    return postJson(endpoint(baseUrl, "domestic-tracking"), payload, fetchImpl);
  }
  async function fetchOrders({ page = 1, pageSize = 20, baseUrl = "/apps/sfc-tools", fetchImpl = globalThis.fetch } = {}) {
    const response = await fetchImpl(
      `${endpoint(baseUrl, "orders")}?page=${encodeURIComponent(page)}&pageSize=${encodeURIComponent(pageSize)}`,
      {
        method: "GET",
        credentials: String(endpoint(baseUrl, "orders")).startsWith("/") ? "same-origin" : "omit",
        headers: { Accept: "application/json" }
      }
    );
    return response.json();
  }
  async function fetchCompliance({ baseUrl = "/apps/sfc-tools", fetchImpl = globalThis.fetch } = {}) {
    const response = await fetchImpl(endpoint(baseUrl, "compliance"), {
      method: "GET",
      credentials: String(endpoint(baseUrl, "compliance")).startsWith("/") ? "same-origin" : "omit",
      headers: { Accept: "application/json" }
    });
    return response.json();
  }
  function setComplianceAccountClass(accountClass, { baseUrl = "/apps/sfc-tools", fetchImpl = globalThis.fetch } = {}) {
    return postJson(
      endpoint(baseUrl, "compliance-account-class"),
      { accountClass: String(accountClass != null ? accountClass : "").trim() },
      fetchImpl
    );
  }
  function saveComplianceProfile(profile, { baseUrl = "/apps/sfc-tools", fetchImpl = globalThis.fetch } = {}) {
    var _a, _b, _c, _d;
    return postJson(
      endpoint(baseUrl, "compliance-profile"),
      {
        trueName: String((_a = profile == null ? void 0 : profile.trueName) != null ? _a : "").trim(),
        company: String((_b = profile == null ? void 0 : profile.company) != null ? _b : "").trim(),
        creditId: String((_c = profile == null ? void 0 : profile.creditId) != null ? _c : "").trim(),
        cardId: String((_d = profile == null ? void 0 : profile.cardId) != null ? _d : "").trim()
      },
      fetchImpl
    );
  }
  async function uploadComplianceFile({ kind, file, baseUrl = "/apps/sfc-tools", fetchImpl = globalThis.fetch } = {}) {
    const form = new FormData();
    form.append("kind", String(kind != null ? kind : "").trim());
    form.append("file", file);
    const response = await fetchImpl(endpoint(baseUrl, "compliance-upload"), {
      method: "POST",
      credentials: String(endpoint(baseUrl, "compliance-upload")).startsWith("/") ? "same-origin" : "omit",
      body: form
    });
    return response.json();
  }
  function submitComplianceReview({ baseUrl = "/apps/sfc-tools", fetchImpl = globalThis.fetch } = {}) {
    return postJson(endpoint(baseUrl, "compliance-submit"), {}, fetchImpl);
  }
  function checkCargoCompliance(payload, { baseUrl = "/apps/sfc-tools", fetchImpl = globalThis.fetch } = {}) {
    return postJson(endpoint(baseUrl, "cargo-compliance"), payload, fetchImpl);
  }
  function complianceFileUrl(fileName, { baseUrl = "/apps/sfc-tools" } = {}) {
    const name = String(fileName != null ? fileName : "").trim();
    if (!name) return "";
    return `${endpoint(baseUrl, "compliance-file")}?file=${encodeURIComponent(name)}`;
  }
  function fetchOrderLabel(orderCode, { baseUrl = "/apps/sfc-tools", fetchImpl = globalThis.fetch } = {}) {
    return postJson(
      endpoint(baseUrl, "label"),
      { orderCode: String(orderCode != null ? orderCode : "").trim() },
      fetchImpl
    );
  }

  // extensions/storefront-tools/src/compliance.js
  var REVIEW_STATUS = Object.freeze({
    DRAFT: "DRAFT",
    PENDING_REVIEW: "PENDING_REVIEW",
    NEEDS_MORE_INFO: "NEEDS_MORE_INFO",
    REJECTED: "REJECTED",
    APPROVED_GENERAL: "APPROVED_GENERAL",
    APPROVED_DG: "APPROVED_DG",
    SUSPENDED: "SUSPENDED",
    EXPIRED: "EXPIRED"
  });
  var CARGO_FLAG_KEYS = Object.freeze([
    "battery",
    "liquid",
    "powder",
    "aerosol",
    "magnetic",
    "chemical",
    "food",
    "medicine",
    "cosmetics",
    "otherRestricted"
  ]);
  var MAX_COMPLIANCE_FILE_BYTES = 10 * 1024 * 1024;
  var ALLOWED_FILE_TYPES = /* @__PURE__ */ new Set([
    "image/jpeg",
    "image/png",
    "application/pdf"
  ]);
  var STATUS_ALIASES = /* @__PURE__ */ new Map([
    ["0", REVIEW_STATUS.DRAFT],
    ["1", REVIEW_STATUS.APPROVED_GENERAL],
    ["2", REVIEW_STATUS.REJECTED],
    ["3", REVIEW_STATUS.PENDING_REVIEW],
    ["4", REVIEW_STATUS.NEEDS_MORE_INFO],
    ["APPROVED", REVIEW_STATUS.APPROVED_GENERAL],
    ["GENERAL_APPROVED", REVIEW_STATUS.APPROVED_GENERAL],
    ["DG_APPROVED", REVIEW_STATUS.APPROVED_DG],
    ["PENDING", REVIEW_STATUS.PENDING_REVIEW]
  ]);
  function normalizeReviewStatus(data = {}) {
    var _a, _b, _c;
    const raw = String(
      (_c = (_b = (_a = data.reviewStatus) != null ? _a : data.complianceStatus) != null ? _b : data.auditStatus) != null ? _c : ""
    ).trim().toUpperCase();
    if (!raw) return REVIEW_STATUS.DRAFT;
    return STATUS_ALIASES.get(raw) || raw;
  }
  function isAccountApproved(data = {}) {
    const status = normalizeReviewStatus(data);
    const approved = status === REVIEW_STATUS.APPROVED_GENERAL || status === REVIEW_STATUS.APPROVED_DG;
    if (approved) return true;
    const hasExplicitStatus = [
      data.reviewStatus,
      data.complianceStatus,
      data.auditStatus
    ].some((value) => value != null && String(value).trim() !== "");
    return !hasExplicitStatus && data.canPlaceOrders === true;
  }
  function complianceStatusView(data = {}) {
    const status = normalizeReviewStatus(data);
    const views = {
      [REVIEW_STATUS.DRAFT]: {
        label: data.ready ? "Ready to submit" : "Information required",
        tone: data.ready ? "ready" : "neutral",
        message: data.ready ? "Your profile is complete. Submit it for SFC review before shipping." : "Complete the profile and required documents before submitting for review."
      },
      [REVIEW_STATUS.PENDING_REVIEW]: {
        label: "Under review",
        tone: "pending",
        message: "SFC is reviewing your account. Orders remain locked until approval."
      },
      [REVIEW_STATUS.NEEDS_MORE_INFO]: {
        label: "More information needed",
        tone: "warning",
        message: data.reviewMessage || "SFC needs additional or corrected information. Update the requested items and resubmit."
      },
      [REVIEW_STATUS.REJECTED]: {
        label: "Not approved",
        tone: "danger",
        message: data.reviewMessage || "This account is not approved for shipping. Contact SFC support for next steps."
      },
      [REVIEW_STATUS.APPROVED_GENERAL]: {
        label: "Approved for general cargo",
        tone: "approved",
        message: "Account review is complete. General cargo may proceed to per-shipment screening."
      },
      [REVIEW_STATUS.APPROVED_DG]: {
        label: "Approved for regulated cargo review",
        tone: "approved",
        message: "Account review is complete. Regulated cargo still requires shipment-level approval."
      },
      [REVIEW_STATUS.SUSPENDED]: {
        label: "Shipping suspended",
        tone: "danger",
        message: data.reviewMessage || "New shipments are disabled. Historical orders and tracking remain available."
      },
      [REVIEW_STATUS.EXPIRED]: {
        label: "Verification expired",
        tone: "warning",
        message: "Update your documents and submit the account for review again."
      }
    };
    return {
      status,
      ...views[status] || {
        label: "Review unavailable",
        tone: "danger",
        message: "SFC returned an unknown review state. Shipping remains locked for safety."
      }
    };
  }
  function validateComplianceFile(file, { maxBytes = MAX_COMPLIANCE_FILE_BYTES } = {}) {
    if (!file) return { valid: false, message: "Choose a document to upload." };
    if (!ALLOWED_FILE_TYPES.has(String(file.type || "").toLowerCase())) {
      return { valid: false, message: "Use a JPG, PNG, or PDF document." };
    }
    if (!Number.isFinite(file.size) || file.size <= 0) {
      return { valid: false, message: "The selected document is empty." };
    }
    if (file.size > maxBytes) {
      return { valid: false, message: "Each document must be 10 MB or smaller." };
    }
    return { valid: true };
  }
  function normalizeCargoDeclaration(input = {}) {
    var _a, _b, _c, _d;
    const flags = {};
    CARGO_FLAG_KEYS.forEach((key) => {
      var _a2, _b2;
      flags[key] = Boolean((_b2 = (_a2 = input.flags) == null ? void 0 : _a2[key]) != null ? _b2 : input[key]);
    });
    return {
      flags,
      noneOfThese: Boolean(input.noneOfThese),
      description: String((_a = input.description) != null ? _a : "").trim(),
      sdsReference: String((_b = input.sdsReference) != null ? _b : "").trim(),
      unNumber: String((_c = input.unNumber) != null ? _c : "").trim().toUpperCase(),
      dangerousGoodsClass: String((_d = input.dangerousGoodsClass) != null ? _d : "").trim(),
      declarationAccepted: Boolean(input.declarationAccepted)
    };
  }
  function validateCargoDeclaration(input = {}) {
    const declaration = normalizeCargoDeclaration(input);
    const selectedFlags = CARGO_FLAG_KEYS.filter((key) => declaration.flags[key]);
    if (declaration.noneOfThese && selectedFlags.length) {
      return {
        valid: false,
        message: "Choose either \u201Cnone of these\u201D or the applicable cargo flags, not both.",
        declaration
      };
    }
    if (!declaration.noneOfThese && !selectedFlags.length) {
      return {
        valid: false,
        message: "Confirm that none apply, or select every cargo characteristic that applies.",
        declaration
      };
    }
    if (selectedFlags.length && declaration.description.length < 3) {
      return {
        valid: false,
        message: "Describe the regulated or restricted cargo for SFC review.",
        declaration
      };
    }
    if (!declaration.declarationAccepted) {
      return {
        valid: false,
        message: "Confirm that the cargo declaration is complete and accurate.",
        declaration
      };
    }
    return {
      valid: true,
      declaration,
      decisionHint: selectedFlags.length ? "MANUAL_REVIEW" : "ALLOW"
    };
  }
  function cargoDecisionAllowsOrder(result = {}) {
    return result.ok === true && String(result.decision || "").toUpperCase() === "ALLOW" && String(result.reviewId || "").trim().length > 0;
  }

  // extensions/storefront-tools/src/rates.js
  var REQUIRED_RATE_FIELDS = [
    "country",
    "weight",
    "length",
    "width",
    "height"
  ];
  var PACKAGE_LIMITS = {
    weight: { min: 0.01, max: 100 },
    length: { min: 1, max: 200 },
    width: { min: 1, max: 200 },
    height: { min: 1, max: 200 }
  };
  var FIRST_MILE_ZONE_RATES = {
    local: { firstKg: 14, perKg: 2.5, label: "Guangdong" },
    nearby: { firstKg: 20, perKg: 7, label: "Nearby provinces" },
    mainland: { firstKg: 22, perKg: 12, label: "Mainland" },
    far: { firstKg: 26, perKg: 16, label: "Far / west / northeast" }
  };
  var FIRST_MILE_PROVINCES = {
    Guangdong: "local",
    Hunan: "nearby",
    Jiangxi: "nearby",
    Fujian: "nearby",
    Guangxi: "nearby",
    Hainan: "nearby",
    Zhejiang: "mainland",
    Jiangsu: "mainland",
    Shanghai: "mainland",
    Anhui: "mainland",
    Hubei: "mainland",
    Henan: "mainland",
    Shandong: "mainland",
    Beijing: "mainland",
    Tianjin: "mainland",
    Hebei: "mainland",
    Shanxi: "mainland",
    Chongqing: "mainland",
    Sichuan: "mainland",
    Guizhou: "mainland",
    Yunnan: "mainland",
    Shaanxi: "mainland",
    Liaoning: "far",
    Jilin: "far",
    Heilongjiang: "far",
    InnerMongolia: "far",
    Gansu: "far",
    Qinghai: "far",
    Ningxia: "far",
    Xinjiang: "far",
    Tibet: "far"
  };
  function firstMileZoneForProvince(province) {
    const band = FIRST_MILE_PROVINCES[province];
    if (!band) return null;
    return FIRST_MILE_ZONE_RATES[band];
  }
  var WAREHOUSE_COPY_TEXT = "\u5E7F\u4E1C\u7701\u60E0\u5DDE\u5E02\u60E0\u9633\u533A\u767D\u77F3\u6751\u660E\u6CF0\u8DEF17\u53F7\u671D\u9CB2\u4EA7\u4E1A\u56ED,\u4E09\u6001\u901F\u9012\u4E00\u697C\n\u6536\u4EF6\u4EBA\uFF1A\u5218\u6B63+Y5169\n\u7535\u8BDD\uFF1A18938091512";
  function chargeableWeightKg(weight, length, width, height) {
    const actual = Number(weight) || 0;
    const volumetric = (Number(length) || 0) * (Number(width) || 0) * (Number(height) || 0) / 6e3;
    return Math.max(actual, volumetric, 0.01);
  }
  function normalizeChinaMobile(value) {
    let digits = String(value != null ? value : "").replace(/\D/g, "");
    if (digits.startsWith("0086")) digits = digits.slice(4);
    else if (digits.startsWith("86") && digits.length > 11) digits = digits.slice(2);
    if (/^1[3-9]\d{9}$/.test(digits)) return digits;
    return "";
  }
  function estimateFirstMileRmb(input) {
    const mode = String(input.firstMileMode || "pickup").toLowerCase();
    if (mode !== "pickup") {
      return {
        mode: "dropoff",
        amount: 0,
        currency: "RMB",
        label: "Drop-off (you pay local courier)",
        note: "\xA50 on this quote"
      };
    }
    const province = String(input.pickupProvince || "").trim();
    const zone = firstMileZoneForProvince(province);
    if (!zone) {
      return {
        mode: "pickup",
        amount: null,
        currency: "RMB",
        label: "Pickup estimate",
        note: "Select pickup province",
        error: "Select the China pickup province to estimate first-mile cost."
      };
    }
    const cw = chargeableWeightKg(
      input.weight,
      input.length,
      input.width,
      input.height
    );
    const extra = Math.max(0, cw - 1);
    const amount = Math.round((zone.firstKg + extra * zone.perKg) * 100) / 100;
    return {
      mode: "pickup",
      amount,
      currency: "RMB",
      label: `Pickup \xB7 ${zone.label}`,
      note: "SF Express\u2013like estimate",
      chargeableWeight: Math.round(cw * 100) / 100
    };
  }
  function approxUsdFromRate(rmbAmount, internationalRmb, internationalUsd) {
    if (rmbAmount == null || !Number.isFinite(Number(rmbAmount))) return null;
    const rmb = Number(internationalRmb);
    const usd = Number(internationalUsd);
    if (Number.isFinite(rmb) && rmb > 0 && Number.isFinite(usd)) {
      return Math.round(Number(rmbAmount) * usd / rmb * 100) / 100;
    }
    return null;
  }
  var OPTIONAL_LOCATION_PATTERN = /^[\p{L}\p{N} .,'’()-]{1,100}$/u;
  var OPTIONAL_POSTAL_PATTERN = /^[A-Z0-9][A-Z0-9 -]{0,19}$/;
  function validateRateInput(input) {
    var _a, _b, _c, _d, _e;
    const firstMile = estimateFirstMileRmb(input);
    if (firstMile.error) {
      return { valid: false, message: firstMile.error };
    }
    const hasRequiredFields = REQUIRED_RATE_FIELDS.every((field) => {
      const value = input[field];
      return typeof value === "number" ? Number.isFinite(value) && value > 0 : Boolean(String(value != null ? value : "").trim());
    });
    if (!hasRequiredFields) {
      return {
        valid: false,
        message: "Please complete the destination country and package details."
      };
    }
    const country = String((_a = input.country) != null ? _a : "").trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(country)) {
      return {
        valid: false,
        message: "Please select a valid destination country / region."
      };
    }
    const state = String((_b = input.state) != null ? _b : "").trim();
    const city = String((_c = input.city) != null ? _c : "").trim();
    const postalCode = String(
      (_e = (_d = input.postalCode) != null ? _d : input.zipCode) != null ? _e : ""
    ).trim().toUpperCase();
    if (state && !OPTIONAL_LOCATION_PATTERN.test(state)) {
      return {
        valid: false,
        message: "State / province contains unsupported characters."
      };
    }
    if (city && !OPTIONAL_LOCATION_PATTERN.test(city)) {
      return {
        valid: false,
        message: "City contains unsupported characters."
      };
    }
    if (postalCode && !OPTIONAL_POSTAL_PATTERN.test(postalCode)) {
      return {
        valid: false,
        message: "Postal code contains unsupported characters."
      };
    }
    const packageIsInRange = Object.entries(PACKAGE_LIMITS).every(([field, range]) => {
      const value = Number(input[field]);
      return Number.isFinite(value) && value >= range.min && value <= range.max;
    });
    if (!packageIsInRange) {
      return {
        valid: false,
        message: "Weight must be 0.01\u2013100 kg and each dimension must be 1\u2013200 cm."
      };
    }
    return { valid: true, message: "" };
  }
  function isValidTrackingNumber(value) {
    return /^[A-Za-z0-9-]{5,50}$/.test(String(value != null ? value : "").trim());
  }
  var escapeHtml = (value) => String(value != null ? value : "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  function renderSfcTracking(result) {
    const eventList = Array.isArray(result.events) ? result.events : [];
    const events = eventList.map((event, index) => `
    <li class="sfc-tracking-event${index === 0 ? " is-latest" : ""}">
      <time datetime="${escapeHtml(event.time || "")}">${escapeHtml(event.time || "\u2014")}</time>
      <span aria-hidden="true"></span>
      <div class="sfc-tracking-event__body">
        <strong>${escapeHtml(
      event.description || "Tracking update"
    )}</strong>
        ${event.location ? `<small>${escapeHtml(event.location)}</small>` : ""}
      </div>
    </li>
  `).join("");
    const orderCode = result.orderCode && result.orderCode !== result.trackingNumber ? result.orderCode : "";
    return `
    <div class="sfc-tracking-result">
      <div class="sfc-tracking-summary">
        ${result.isDemo ? '<span class="demo-badge">DEMO DATA</span>' : ""}
        <div class="sfc-tracking-summary__head">
          <div>
            <p class="eyebrow">CURRENT STATUS</p>
            <h3>${escapeHtml(result.status || "In transit")}</h3>
          </div>
          <span class="sfc-tracking-status-pill">${escapeHtml(
      result.status || "In transit"
    )}</span>
        </div>
        <dl class="sfc-tracking-meta">
          <div>
            <dt>Tracking number</dt>
            <dd>${escapeHtml(result.trackingNumber || "\u2014")}</dd>
          </div>
          ${orderCode ? `<div>
            <dt>SFC order</dt>
            <dd>${escapeHtml(orderCode)}</dd>
          </div>` : ""}
          <div>
            <dt>Shipping channel</dt>
            <dd>${escapeHtml(
      result.shippingChannel || "Not provided"
    )}</dd>
          </div>
          <div>
            <dt>Destination</dt>
            <dd>${escapeHtml(
      result.destination || "Not provided"
    )}</dd>
          </div>
          <div>
            <dt>Latest update</dt>
            <dd>${escapeHtml(
      result.latestUpdate || "Not provided"
    )}</dd>
          </div>
        </dl>
      </div>
      <div class="sfc-tracking-timeline-wrap">
        <p class="sfc-tracking-timeline__label">Shipment milestones</p>
        <ol class="sfc-tracking-timeline">
          ${events || `<li class="tracking-empty-event">${escapeHtml(
      result.hasEvents === false || !eventList.length ? "Order found. Tracking milestones will appear here after the first scan." : "No scan events were provided."
    )}</li>`}
        </ol>
      </div>
    </div>
  `;
  }
  var failureHeadings = {
    SFC_NOT_FOUND: "Tracking number not found",
    SFC_NOT_CONFIGURED: "SFC tracking is not configured",
    SFC_TIMEOUT: "SFC tracking timed out",
    SFC_UNAVAILABLE: "SFC tracking is unavailable",
    LOGIN_REQUIRED: "Sign in to track your shipments",
    BINDING_REQUIRED: "Link your SFC account to track",
    INTERNAL_ERROR: "Tracking is unavailable"
  };
  function renderTrackingFailure(code = "INTERNAL_ERROR", message = "Tracking is temporarily unavailable. Please try again.") {
    var _a;
    const heading = (_a = failureHeadings[code]) != null ? _a : failureHeadings.INTERNAL_ERROR;
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

  // extensions/storefront-tools/src/orders.js
  function pdfBlobFromBase64(base64) {
    const binary = atob(String(base64 || ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: "application/pdf" });
  }
  function downloadPdfBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "sfc-label.pdf";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3e4);
  }
  function showPdfInBrowser(blob, previewWin) {
    var _a, _b;
    const url = URL.createObjectURL(blob);
    if (previewWin && !previewWin.closed) {
      try {
        previewWin.location.href = url;
        previewWin.focus();
        setTimeout(() => URL.revokeObjectURL(url), 12e4);
        return true;
      } catch (e) {
        try {
          previewWin.close();
        } catch (e2) {
        }
      }
    }
    const root = document.querySelector("[data-sfc-tools-root]") || document.body;
    let host = root.querySelector("[data-sfc-label-preview]");
    if (!host) {
      host = document.createElement("div");
      host.setAttribute("data-sfc-label-preview", "1");
      host.className = "sfc-label-preview";
      host.innerHTML = `
      <div class="sfc-label-preview__panel" role="dialog" aria-modal="true" aria-label="Shipping label">
        <div class="sfc-label-preview__bar">
          <strong>Shipping label</strong>
          <button type="button" class="button button--ghost" data-sfc-label-preview-close>Close</button>
        </div>
        <iframe class="sfc-label-preview__frame" title="Shipping label PDF"></iframe>
      </div>`;
      root.append(host);
      (_a = host.querySelector("[data-sfc-label-preview-close]")) == null ? void 0 : _a.addEventListener("click", () => {
        const frame2 = host.querySelector("iframe");
        if (frame2 == null ? void 0 : frame2.src) URL.revokeObjectURL(frame2.src);
        host.remove();
      });
    }
    const frame = host.querySelector("iframe");
    if (frame) {
      if ((_b = frame.src) == null ? void 0 : _b.startsWith("blob:")) URL.revokeObjectURL(frame.src);
      frame.src = url;
    }
    return true;
  }

  // extensions/storefront-tools/src/select.js
  function enhanceSelect(select) {
    if (!select || select.dataset.enhanced === "true") return;
    select.dataset.enhanced = "true";
    select.classList.add("sfc-select__native");
    select.setAttribute("tabindex", "-1");
    select.setAttribute("aria-hidden", "true");
    const wrap = document.createElement("div");
    wrap.className = "sfc-select";
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "sfc-select__trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    const label = document.createElement("span");
    label.className = "sfc-select__label";
    const chevron = document.createElement("span");
    chevron.className = "sfc-select__chevron";
    chevron.setAttribute("aria-hidden", "true");
    trigger.append(label, chevron);
    const list = document.createElement("ul");
    list.className = "sfc-select__list";
    list.setAttribute("role", "listbox");
    list.hidden = true;
    wrap.append(trigger, list);
    let activeIndex = -1;
    function optionNodes() {
      return Array.from(select.options);
    }
    function selectedOption() {
      return select.options[select.selectedIndex] || select.options[0];
    }
    function syncLabel() {
      var _a;
      const opt = selectedOption();
      const text = ((_a = opt == null ? void 0 : opt.textContent) == null ? void 0 : _a.trim()) || "Select";
      label.textContent = text;
      label.classList.toggle("is-placeholder", !(opt == null ? void 0 : opt.value));
    }
    function renderOptions() {
      list.replaceChildren();
      optionNodes().forEach((opt, index) => {
        if (!opt.value) return;
        const item = document.createElement("li");
        item.setAttribute("role", "presentation");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sfc-select__option";
        btn.setAttribute("role", "option");
        btn.dataset.index = String(index);
        btn.dataset.value = opt.value;
        btn.textContent = opt.textContent.trim();
        btn.setAttribute("aria-selected", opt.selected ? "true" : "false");
        if (opt.selected) btn.classList.add("is-selected");
        if (opt.disabled) {
          btn.disabled = true;
          btn.style.opacity = "0.45";
        }
        btn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          choose(index);
        });
        item.appendChild(btn);
        list.appendChild(item);
      });
    }
    function setActive(index) {
      const buttons = list.querySelectorAll(".sfc-select__option");
      buttons.forEach((btn) => btn.classList.remove("is-active"));
      activeIndex = index;
      const current = buttons[index];
      if (current) {
        current.classList.add("is-active");
        current.scrollIntoView({ block: "nearest" });
      }
    }
    function open() {
      renderOptions();
      list.hidden = false;
      wrap.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
      const selected = list.querySelector(".sfc-select__option.is-selected");
      const buttons = Array.from(list.querySelectorAll(".sfc-select__option"));
      setActive(selected ? buttons.indexOf(selected) : 0);
    }
    function close() {
      list.hidden = true;
      wrap.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
      activeIndex = -1;
    }
    function choose(index) {
      const opt = select.options[index];
      if (!opt || opt.disabled) return;
      select.selectedIndex = index;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      syncLabel();
      close();
      trigger.focus();
    }
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (wrap.classList.contains("is-open")) close();
      else open();
    });
    trigger.addEventListener("keydown", (event) => {
      const openNow = wrap.classList.contains("is-open");
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!openNow) {
          open();
          return;
        }
        const buttons = list.querySelectorAll(".sfc-select__option");
        if (!buttons.length) return;
        const delta = event.key === "ArrowDown" ? 1 : -1;
        const next = Math.max(0, Math.min(buttons.length - 1, activeIndex + delta));
        setActive(next);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!openNow) {
          open();
          return;
        }
        if (activeIndex >= 0) {
          const btn = list.querySelectorAll(".sfc-select__option")[activeIndex];
          if (btn) choose(Number(btn.dataset.index));
        }
      } else if (event.key === "Escape" && openNow) {
        event.preventDefault();
        close();
      }
    });
    document.addEventListener("click", (event) => {
      if (!wrap.contains(event.target)) close();
    });
    select.addEventListener("change", syncLabel);
    syncLabel();
  }

  // extensions/storefront-tools/src/dom.js
  function clear(target) {
    if (!target) return;
    while (target.firstChild) target.firstChild.remove();
  }
  function element(tag, className = "", text = null) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = String(text);
    return node;
  }
  function focusResult(container) {
    if (!container) return;
    container.setAttribute("tabindex", "-1");
    container.focus({ preventScroll: true });
    container.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // extensions/storefront-tools/src/rate-ui.js
  var RATE_PAGE_SIZE = 6;
  function formatUsdApprox(value) {
    if (value == null || value === "" || !Number.isFinite(Number(value))) {
      return "";
    }
    return `\u2248 $${Number(value).toFixed(2)} USD`;
  }
  function createRateUi({ root, results, getParcel, onStartOrder }) {
    let loadingTimer = null;
    function stopLoading() {
      if (loadingTimer) {
        clearInterval(loadingTimer);
        loadingTimer = null;
      }
      results == null ? void 0 : results.removeAttribute("aria-busy");
    }
    function renderState(title, message, { error = false } = {}) {
      if (!results) return;
      stopLoading();
      clear(results);
      results.classList.remove("results-panel--loading", "results-panel--filled");
      const state = element(
        "div",
        `empty-state${error ? " empty-state--error" : ""}`
      );
      state.append(
        element("p", "eyebrow", error ? "SFC QUOTE STATUS" : "LIVE SFC QUOTE"),
        element("h3", "", title),
        element("p", error ? "inline-error" : "", message)
      );
      results.append(state);
      focusResult(results);
    }
    function renderLoading() {
      if (!results) return;
      stopLoading();
      clear(results);
      results.classList.add("results-panel--loading");
      results.classList.remove("results-panel--filled");
      results.setAttribute("aria-busy", "true");
      const panel = element("div", "rate-loading");
      panel.setAttribute("role", "status");
      panel.setAttribute("aria-live", "polite");
      const heading = element("div", "rate-loading__head");
      const spinner = element("span", "rate-loading__spinner");
      spinner.setAttribute("aria-hidden", "true");
      const copy = element("div", "rate-loading__copy");
      copy.append(
        element("p", "eyebrow", "LIVE SFC QUOTE"),
        element("h3", "", "Checking SFC shipping services\u2026"),
        element("p", "rate-loading__hint", "Comparing available routes for your parcel.")
      );
      heading.append(spinner, copy);
      const steps = element("ol", "rate-loading__steps");
      const stepNodes = [
        "Sending parcel details securely",
        "Matching SFC shipping services",
        "Calculating live prices"
      ].map((label, index) => {
        const item = element("li", index === 0 ? "is-active" : "");
        item.append(
          element("span", "rate-loading__step-dot", index + 1),
          element("span", "rate-loading__step-label", label)
        );
        return item;
      });
      steps.append(...stepNodes);
      const elapsed = element("p", "rate-loading__elapsed", "Working\u2026 0s");
      panel.append(heading, steps, elapsed);
      results.append(panel);
      focusResult(results);
      const startedAt = Date.now();
      loadingTimer = setInterval(() => {
        const seconds = Math.floor((Date.now() - startedAt) / 1e3);
        elapsed.textContent = seconds < 10 ? `Working\u2026 ${seconds}s` : `Still checking available routes\u2026 ${seconds}s`;
        const active = seconds < 2 ? 0 : seconds < 6 ? 1 : 2;
        stepNodes.forEach((node, index) => {
          node.classList.toggle("is-active", index === active);
          node.classList.toggle("is-done", index < active);
        });
      }, 400);
    }
    function buildCard(rate, firstMile) {
      const international = Number(rate.amount);
      const internationalAmount = Number.isFinite(international) ? international : 0;
      const firstMileAmount = Number((firstMile == null ? void 0 : firstMile.amount) || 0);
      const internationalUsd = rate.amountUsd != null && Number.isFinite(Number(rate.amountUsd)) ? Number(rate.amountUsd) : null;
      const firstMileUsd = approxUsdFromRate(
        firstMileAmount,
        internationalAmount,
        internationalUsd
      );
      const total = internationalAmount + firstMileAmount;
      const totalUsd = internationalUsd == null ? null : Math.round((internationalUsd + Number(firstMileUsd || 0)) * 100) / 100;
      const card = element("article", "rate-card");
      const row = element("div", "rate-card__row");
      const service = element("div", "rate-card__service");
      const serviceCopy = element("div", "rate-card__copy");
      serviceCopy.append(
        element("h4", "", rate.serviceName || rate.serviceCode || "SFC service"),
        element("p", "", rate.transitTime ? `Transit ${rate.transitTime}` : "Transit confirmed by SFC")
      );
      service.append(
        element("span", "rate-card__code", rate.serviceCode || "SFC"),
        serviceCopy
      );
      const aside = element("div", "rate-card__aside");
      const breakdown = element("div", "rate-card__breakdown");
      const totalLine = element("div", "rate-card__line rate-card__line--total");
      totalLine.append(
        element("span", "", "Total"),
        element("strong", "", `${total.toFixed(2)} ${rate.currency || "RMB"}`)
      );
      breakdown.append(
        totalLine,
        element(
          "div",
          "rate-card__subtotal",
          (firstMile == null ? void 0 : firstMile.mode) === "dropoff" ? `International ${internationalAmount.toFixed(2)} + drop-off first mile 0` : `International ${internationalAmount.toFixed(2)} + first mile ${firstMileAmount.toFixed(2)}`
        )
      );
      if (totalUsd != null) {
        breakdown.append(element("small", "rate-card__price-usd", formatUsdApprox(totalUsd)));
      }
      const orderButton = element("button", "button button--primary rate-card__cta");
      orderButton.type = "button";
      orderButton.textContent = root.dataset.customerLoggedIn === "true" ? "Order" : "Sign in to order";
      Object.assign(orderButton.dataset, {
        action: "start-order",
        serviceCode: String(rate.serviceCode || ""),
        serviceName: String(rate.serviceName || rate.serviceCode || "SFC service"),
        amount: internationalAmount.toFixed(2),
        currency: String(rate.currency || "RMB"),
        totalAmount: total.toFixed(2),
        firstMileAmount: firstMileAmount.toFixed(2),
        firstMileMode: String((firstMile == null ? void 0 : firstMile.mode) || "dropoff")
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
      results.classList.remove("results-panel--loading");
      results.classList.add("results-panel--filled");
      const firstMile = estimateFirstMileRmb((getParcel == null ? void 0 : getParcel()) || {});
      const rates = [...Array.isArray(response.rates) ? response.rates : []].sort(
        (a, b) => Number(a.amount) - Number(b.amount)
      );
      if (!rates.length) {
        renderState("No shipping services found", "Try another destination or parcel size.");
        return;
      }
      const heading = element("div", "rate-result-heading");
      heading.append(
        element("p", "eyebrow", "AVAILABLE SFC SERVICES"),
        element("h3", "", `${rates.length} shipping options found`),
        element(
          "p",
          "rate-result-sub",
          firstMile.mode === "pickup" ? `Sorted by international price \xB7 Estimated first mile ${Number(firstMile.amount || 0).toFixed(2)} RMB` : "Sorted by international price \xB7 Drop-off first mile is 0 on this quote"
        )
      );
      const scroll = element("div", "rate-list-scroll");
      const list = element("div", "rate-list");
      rates.forEach((rate, index) => {
        const card = buildCard(rate, firstMile);
        if (index >= RATE_PAGE_SIZE) {
          card.hidden = true;
          card.dataset.rateExtra = "true";
        }
        list.append(card);
      });
      scroll.append(list);
      const footer = element("div", "rate-list-footer");
      const hiddenCount = Math.max(0, rates.length - RATE_PAGE_SIZE);
      if (hiddenCount) {
        const more = element("button", "button button--ghost button--wide", `Show ${hiddenCount} more services`);
        more.type = "button";
        more.dataset.action = "show-more-rates";
        footer.append(more);
      }
      footer.append(
        element("p", "quote-note", "The backend determines whether public or account-specific pricing is returned.")
      );
      results.append(heading, scroll, footer);
      focusResult(results);
    }
    results == null ? void 0 : results.addEventListener("click", (event) => {
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
      onStartOrder == null ? void 0 : onStartOrder({
        serviceCode: button.dataset.serviceCode,
        serviceName: button.dataset.serviceName,
        amount: button.dataset.amount,
        currency: button.dataset.currency,
        amountUsd: button.dataset.amountUsd || null,
        totalAmount: button.dataset.totalAmount || button.dataset.amount,
        totalAmountUsd: button.dataset.totalAmountUsd || null,
        firstMileAmount: button.dataset.firstMileAmount || "0",
        firstMileMode: button.dataset.firstMileMode || "dropoff"
      });
    });
    return {
      renderLoading,
      renderRates,
      renderState,
      stopLoading
    };
  }

  // extensions/storefront-tools/src/analytics.js
  function storageGet(key, store) {
    try {
      return store.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function storageSet(key, value, store) {
    try {
      store.setItem(key, value);
    } catch (e) {
    }
  }
  function makeClientId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
  function getAnalyticsIds() {
    const ANON_KEY = "sfc_storefront_anon_id";
    const SESS_KEY = "sfc_storefront_sess_id";
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
    return { anonymousId, sessionId };
  }
  function getTrafficSource() {
    var _a;
    try {
      const params = new URLSearchParams(((_a = globalThis.location) == null ? void 0 : _a.search) || "");
      const parts = [];
      ["utm_source", "utm_medium", "utm_campaign"].forEach((key) => {
        const value = params.get(key);
        if (value) parts.push(`${key}=${value}`);
      });
      if (parts.length) return parts.join("&").slice(0, 255);
      const ref = String(document.referrer || "");
      if (ref) return `ref:${ref}`.slice(0, 255);
    } catch (e) {
    }
    return "";
  }
  function trackStorefrontEvent(eventName, {
    baseUrl = "/apps/sfc-tools",
    product = "sfc",
    status = "ok",
    payload = null,
    userCode = null,
    fetchImpl = globalThis.fetch,
    enabled = null
  } = {}) {
    const on = enabled === true || globalThis.SFC_ANALYTICS === true || typeof document !== "undefined" && document.querySelector('[data-sfc-tools-root][data-analytics="on"]');
    if (!on) return Promise.resolve(null);
    const { anonymousId, sessionId } = getAnalyticsIds();
    const body = {
      product,
      event: eventName,
      event_status: status,
      anonymous_id: anonymousId,
      session_id: sessionId,
      page: typeof location !== "undefined" ? `${location.pathname}${location.search || ""}` : "/",
      source: getTrafficSource(),
      user_code: userCode || void 0,
      payload: payload || void 0
    };
    return postJson(endpoint(baseUrl, "event"), body, fetchImpl).catch(() => null);
  }

  // extensions/storefront-tools/src/main.js
  function initSfcTools(root) {
    var _a, _b, _c, _d, _e, _f;
    if (!root || root.dataset.sfcInitialized === "true") return;
    root.dataset.sfcInitialized = "true";
    const apiBase = root.dataset.apiBase || "/apps/sfc-tools";
    const analyticsProduct = root.dataset.analyticsProduct || "sfc";
    const rateForm = root.querySelector("[data-rate-form]");
    const rateResults = root.querySelector("[data-rate-results]");
    const orderPanel = root.querySelector("[data-order-panel]");
    const orderForm = root.querySelector("[data-order-form]");
    const warehouseCard = root.querySelector("[data-warehouse-card]");
    const pickupOrigin = root.querySelector("[data-pickup-origin]");
    const pickupProvinceSelect = root.querySelector("[data-pickup-province]");
    function trackEvent(eventName, opts = {}) {
      trackStorefrontEvent(eventName, {
        baseUrl: apiBase,
        product: analyticsProduct,
        ...opts
      });
    }
    trackEvent("page_view", {
      payload: {
        loggedIn: root.dataset.customerLoggedIn === "true"
      }
    });
    if (root.dataset.customerLoggedIn === "true") {
      const { sessionId } = getAnalyticsIds();
      const loginFlagKey = `sfc_login_ok_${sessionId}`;
      if (!storageGet(loginFlagKey, globalThis.sessionStorage)) {
        storageSet(loginFlagKey, "1", globalThis.sessionStorage);
        trackEvent("login", { status: "ok" });
      }
    }
    function syncFirstMileUi() {
      var _a2;
      const mode = ((_a2 = rateForm == null ? void 0 : rateForm.querySelector('input[name="firstMileMode"]:checked')) == null ? void 0 : _a2.value) || "pickup";
      const isPickup = mode === "pickup";
      if (warehouseCard) warehouseCard.hidden = isPickup;
      if (pickupOrigin) pickupOrigin.hidden = !isPickup;
      if (pickupProvinceSelect) {
        pickupProvinceSelect.required = isPickup;
        if (!isPickup) pickupProvinceSelect.value = "";
      }
      rateForm == null ? void 0 : rateForm.querySelectorAll(".first-mile-option").forEach((label) => {
        const input = label.querySelector('input[type="radio"]');
        label.classList.toggle("is-selected", Boolean(input == null ? void 0 : input.checked));
      });
    }
    async function copyWarehouseAddress(button) {
      if (root.dataset.customerLoggedIn !== "true") {
        goToShopifyLogin();
        return;
      }
      try {
        await navigator.clipboard.writeText(WAREHOUSE_COPY_TEXT);
        if (button) {
          const prev = button.textContent;
          button.textContent = "Copied";
          setTimeout(() => {
            button.textContent = prev;
          }, 1600);
        }
      } catch (e) {
        window.prompt("Copy warehouse address:", WAREHOUSE_COPY_TEXT);
      }
    }
    rateForm == null ? void 0 : rateForm.addEventListener("change", (event) => {
      var _a2, _b2;
      if ((_b2 = (_a2 = event.target) == null ? void 0 : _a2.matches) == null ? void 0 : _b2.call(_a2, "[data-first-mile-mode]")) {
        syncFirstMileUi();
      }
    });
    root.querySelectorAll("[data-copy-warehouse]").forEach((btn) => {
      btn.addEventListener("click", () => copyWarehouseAddress(btn));
    });
    syncFirstMileUi();
    const trackingForm = root.querySelector("[data-tracking-form]");
    const trackingInput = root.querySelector("[data-tracking-number]");
    const trackingWidgetContainer = root.querySelector("[data-tracking-widget]");
    const trackingProviderName = root.querySelector("[data-tracking-provider]");
    const currentYear = root.querySelector("[data-current-year]");
    const headerUserCodeEl = root.querySelector("[data-header-user-code]");
    const headerBalanceEl = root.querySelector("[data-header-balance]");
    const headerCurrencyEl = root.querySelector("[data-header-currency]");
    const headerBalanceUsdEl = root.querySelector("[data-header-balance-usd]");
    const orderFieldsRecipient = root.querySelector("[data-order-fields-recipient]");
    const orderFieldsDetails = root.querySelector("[data-order-fields-details]");
    const orderItemsList = root.querySelector("[data-order-items-list]");
    const orderItemsExtras = root.querySelector("[data-order-items-extras]");
    const orderItemAddBtn = root.querySelector("[data-order-item-add]");
    const orderFieldsOptions = root.querySelector("[data-order-fields-options]");
    const orderFieldsSend = root.querySelector("[data-order-fields-send]");
    const ORDER_ITEM_FIELD_KEYS = /* @__PURE__ */ new Set([
      "descriptionEn",
      "descriptionCn",
      "quantity",
      "declaredValue",
      "detailWeight",
      "hsCode",
      "custom_label",
      "enMaterial",
      "cnMaterial",
      "purpose",
      "amazon_asin_number",
      "export_declare_price"
    ]);
    const MAX_ORDER_ITEMS = 20;
    let orderItemFieldDefs = [];
    let orderItemSeq = 0;
    const orderFieldsSendHeading = root.querySelector(
      "[data-order-fields-send-heading]"
    );
    const orderFieldsRecipientHeading = root.querySelector(
      "[data-order-fields-recipient-heading]"
    );
    const orderFieldsCustomsHeading = root.querySelector(
      "[data-order-fields-customs-heading]"
    );
    const orderFieldsStatus = root.querySelector("[data-order-fields-status]");
    const SHOPIFY_SHIPPER_FIELDS = [
      { key: "sendName", group: "send", label: "Shipper name", required: true, visible: true, inputType: "text" },
      { key: "sendOrganization", group: "send", label: "Shipper company", required: false, visible: true, inputType: "text" },
      { key: "sendCall", group: "send", label: "Shipper phone", required: true, visible: true, inputType: "text" },
      { key: "sendEmail", group: "send", label: "Shipper email", required: false, visible: true, inputType: "email" },
      { key: "sendAddress", group: "send", label: "Shipper address", required: true, visible: true, inputType: "text" },
      { key: "sendState", group: "send", label: "Shipper state / province", required: true, visible: true, inputType: "text" },
      { key: "sendCity", group: "send", label: "Shipper city", required: true, visible: true, inputType: "text" },
      { key: "sendZipCode", group: "send", label: "Shipper postal code", required: false, visible: true, inputType: "text" }
    ];
    function ensureShipperFields(fields) {
      const list = Array.isArray(fields) ? fields.slice() : [];
      const keys = new Set(SHOPIFY_SHIPPER_FIELDS.map((f) => f.key));
      const without = list.filter((f) => !keys.has(f == null ? void 0 : f.key));
      return without.concat(SHOPIFY_SHIPPER_FIELDS);
    }
    const orderSubmitStatus = root.querySelector("[data-order-submit-status]");
    const ordersListEl = root.querySelector("[data-orders-list]");
    const ordersStatusEl = root.querySelector("[data-orders-status]");
    const ordersFooterEl = root.querySelector("[data-orders-footer]");
    const ordersMoreBtn = root.querySelector("[data-orders-more]");
    const orderDetailDialog = root.querySelector("[data-order-detail-dialog]");
    const orderDetailTitle = root.querySelector("[data-order-detail-title]");
    const orderDetailStatus = root.querySelector("[data-order-detail-status]");
    const orderDetailBody = root.querySelector("[data-order-detail-body]");
    const orderDetailTrackBtn = root.querySelector("[data-order-detail-track]");
    const orderDetailLabelMenu = root.querySelector(
      "[data-order-detail-label-menu]"
    );
    const orderDetailLabelTrigger = root.querySelector(
      "[data-order-detail-label-trigger]"
    );
    const orderDetailPrintBtn = root.querySelector("[data-order-detail-print]");
    const orderDetailDownloadBtn = root.querySelector(
      "[data-order-detail-download]"
    );
    function syncOrdersScrollMenuState() {
      const scroll = root.querySelector(".orders-list-scroll");
      if (!scroll) return;
      scroll.classList.toggle(
        "is-menu-open",
        Boolean(root.querySelector(".label-menu.is-open"))
      );
    }
    function setLabelMenuOpen(menu, open) {
      if (!menu) return;
      const trigger = menu.querySelector(".label-menu__trigger");
      const panel = menu.querySelector(".label-menu__panel");
      if (open) closeAllLabelMenus(menu);
      menu.classList.toggle("is-open", open);
      if (trigger) trigger.setAttribute("aria-expanded", open ? "true" : "false");
      if (panel) panel.hidden = !open;
      syncOrdersScrollMenuState();
    }
    function closeAllLabelMenus(except = null) {
      root.querySelectorAll(".label-menu.is-open").forEach((menu) => {
        if (except && menu === except) return;
        menu.classList.remove("is-open");
        const trigger = menu.querySelector(".label-menu__trigger");
        const panel = menu.querySelector(".label-menu__panel");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
        if (panel) panel.hidden = true;
      });
      syncOrdersScrollMenuState();
    }
    function buildLabelMenu(order) {
      const menu = element("div", "label-menu");
      const trigger = element("button", "button button--ghost label-menu__trigger");
      trigger.type = "button";
      trigger.setAttribute("aria-expanded", "false");
      trigger.setAttribute("aria-haspopup", "menu");
      trigger.innerHTML = 'Label <span aria-hidden="true">\u25BE</span>';
      const panel = element("div", "label-menu__panel");
      panel.hidden = true;
      panel.setAttribute("role", "menu");
      const printItem = element("button", "label-menu__item");
      printItem.type = "button";
      printItem.setAttribute("role", "menuitem");
      printItem.textContent = "Open label";
      printItem.addEventListener("click", () => {
        setLabelMenuOpen(menu, false);
        runOrderLabelAction(order, "print", trigger);
      });
      const downloadItem = element("button", "label-menu__item");
      downloadItem.type = "button";
      downloadItem.setAttribute("role", "menuitem");
      downloadItem.textContent = "Download PDF";
      downloadItem.addEventListener("click", () => {
        setLabelMenuOpen(menu, false);
        runOrderLabelAction(order, "download", trigger);
      });
      trigger.addEventListener("click", (event) => {
        event.stopPropagation();
        setLabelMenuOpen(menu, !menu.classList.contains("is-open"));
      });
      panel.append(printItem, downloadItem);
      menu.append(trigger, panel);
      return menu;
    }
    async function runOrderLabelAction(order, mode, triggerBtn) {
      const code = String((order == null ? void 0 : order.sfcOrderCode) || (order == null ? void 0 : order.orderCode) || "").trim();
      if (!code) {
        setOrdersStatus("Missing order code for label.", { error: true });
        return;
      }
      let previewWin = null;
      if (mode === "print") {
        previewWin = window.open("about:blank", "_blank");
      }
      const labelHtml = triggerBtn == null ? void 0 : triggerBtn.innerHTML;
      if (triggerBtn) {
        triggerBtn.disabled = true;
        triggerBtn.classList.add("is-busy");
        triggerBtn.textContent = mode === "print" ? "Opening label\u2026" : "Preparing download\u2026";
      }
      setOrdersStatus(
        mode === "print" ? "Opening shipping label\u2026" : "Preparing shipping label download\u2026"
      );
      try {
        const data = await fetchOrderLabel(code, { baseUrl: apiBase });
        if (!(data == null ? void 0 : data.ok) || !data.labelData) {
          if (previewWin && !previewWin.closed) previewWin.close();
          setOrdersStatus(
            (data == null ? void 0 : data.message) || "Label is not ready yet. Some channels need a tracking number first.",
            { error: true }
          );
          return;
        }
        const blob = pdfBlobFromBase64(data.labelData);
        const fileName = data.fileName || `${code}-label.pdf`;
        if (mode === "print") {
          showPdfInBrowser(blob, previewWin);
          setOrdersStatus(
            `Label opened for ${data.orderCode || code}. You can print from the PDF viewer.`
          );
        } else {
          if (previewWin && !previewWin.closed) previewWin.close();
          downloadPdfBlob(blob, fileName);
          setOrdersStatus(`Downloaded ${fileName}.`);
        }
      } catch (e) {
        if (previewWin && !previewWin.closed) previewWin.close();
        setOrdersStatus("Unable to load shipping label. Try again.", {
          error: true
        });
      } finally {
        if (triggerBtn && labelHtml != null) {
          triggerBtn.disabled = false;
          triggerBtn.classList.remove("is-busy");
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
    root.querySelectorAll("select[data-enhance-select]").forEach(enhanceSelect);
    const accountMenu = root.querySelector("[data-account-menu]");
    const accountMenuTrigger = root.querySelector("[data-account-menu-trigger]");
    const accountMenuPanel = root.querySelector("[data-account-menu-panel]");
    function setAccountMenuOpen(open) {
      if (!accountMenu || !accountMenuTrigger || !accountMenuPanel) return;
      accountMenu.classList.toggle("is-open", open);
      accountMenuTrigger.setAttribute("aria-expanded", open ? "true" : "false");
      accountMenuPanel.hidden = !open;
    }
    accountMenuTrigger == null ? void 0 : accountMenuTrigger.addEventListener("click", (event) => {
      event.stopPropagation();
      setAccountMenuOpen(Boolean(accountMenuPanel == null ? void 0 : accountMenuPanel.hidden));
    });
    const complianceDialog = root.querySelector("[data-compliance-dialog]");
    const complianceStatusEl = root.querySelector("[data-compliance-status]");
    const complianceSlotsEl = root.querySelector("[data-compliance-slots]");
    const complianceReviewEl = root.querySelector("[data-compliance-review]");
    const complianceReviewLabelEl = root.querySelector(
      "[data-compliance-review-label]"
    );
    const complianceReviewMessageEl = root.querySelector(
      "[data-compliance-review-message]"
    );
    const complianceSubmitBtn = root.querySelector("[data-compliance-submit]");
    let complianceState = null;
    let pendingOrderAfterCompliance = null;
    function setComplianceStatus(message, { error = false } = {}) {
      if (!complianceStatusEl) return;
      if (!message) {
        complianceStatusEl.hidden = true;
        complianceStatusEl.textContent = "";
        complianceStatusEl.classList.remove("inline-error");
        return;
      }
      complianceStatusEl.hidden = false;
      complianceStatusEl.textContent = message;
      complianceStatusEl.classList.toggle("inline-error", error);
    }
    function applyAccountClassLocally(accountClass) {
      const next = String(accountClass || "");
      const base = complianceState && typeof complianceState === "object" ? complianceState : { ok: true, files: {}, profile: {}, missing: [] };
      const optimistic = {
        ...base,
        ok: true,
        accountClass: next || null,
        ready: false,
        missing: [
          ...Array.isArray(base.missing) ? base.missing : []
        ]
      };
      renderComplianceUi(optimistic);
    }
    const complianceProfileEl = root.querySelector("[data-compliance-profile]");
    const complianceTrueNameEl = root.querySelector("[data-compliance-true-name]");
    const complianceCompanyEl = root.querySelector("[data-compliance-company]");
    const complianceCreditIdEl = root.querySelector("[data-compliance-credit-id]");
    const complianceCardIdEl = root.querySelector("[data-compliance-card-id]");
    function isComplianceDocsReady(data) {
      const accountClass = (data == null ? void 0 : data.accountClass) ? String(data.accountClass) : "";
      const files = (data == null ? void 0 : data.files) || {};
      if (accountClass === "1") {
        return (files.passport || []).length >= 1 && (files.holding || []).length >= 1;
      }
      if (accountClass === "2") {
        const idCount = (files.identity || []).length + (files.passport || []).length + (files.holding || []).length;
        return (files.license || []).length >= 1 && idCount >= 1;
      }
      return false;
    }
    function renderComplianceProfile(data) {
      const accountClass = (data == null ? void 0 : data.accountClass) ? String(data.accountClass) : "";
      const isPersonal = accountClass === "1";
      const isEnterprise = accountClass === "2";
      if (complianceProfileEl) {
        complianceProfileEl.hidden = !accountClass;
      }
      const hint = complianceProfileEl == null ? void 0 : complianceProfileEl.querySelector(
        ".sfc-compliance-profile__hint"
      );
      if (hint) {
        hint.textContent = isComplianceDocsReady(data) ? "Documents uploaded. Now fill in your details \u2014 required before placing orders." : "Fill in your details below. Upload document photos above too \u2014 both are required before placing orders.";
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
      const trueNameLabel = root.querySelector("[data-compliance-true-name-label]");
      const creditIdLabel = root.querySelector("[data-compliance-credit-id-label]");
      if (trueNameLabel) {
        trueNameLabel.textContent = isEnterprise ? "Legal representative name" : "Full name";
      }
      if (creditIdLabel) {
        creditIdLabel.textContent = isEnterprise ? "Business registration number (optional)" : "Passport number";
      }
      if (complianceCreditIdEl) {
        complianceCreditIdEl.placeholder = isEnterprise ? "Company registration / license number" : "Passport number";
        complianceCreditIdEl.required = isPersonal;
      }
      const profile = (data == null ? void 0 : data.profile) || {};
      if (complianceTrueNameEl) {
        complianceTrueNameEl.value = profile.trueName || "";
      }
      if (complianceCompanyEl) {
        complianceCompanyEl.value = profile.company || "";
      }
      if (complianceCreditIdEl) {
        if (isPersonal) {
          complianceCreditIdEl.value = profile.creditId || "";
        } else if (isEnterprise) {
          const sameAsCard = profile.creditId && profile.cardId && String(profile.creditId) === String(profile.cardId);
          complianceCreditIdEl.value = sameAsCard ? "" : profile.creditId || "";
        }
      }
      if (complianceCardIdEl) {
        complianceCardIdEl.value = profile.cardId || "";
      }
    }
    function renderComplianceUi(data) {
      complianceState = data;
      const accountClass = (data == null ? void 0 : data.accountClass) ? String(data.accountClass) : "";
      root.querySelectorAll("[data-compliance-account-class]").forEach((input) => {
        input.checked = input.value === accountClass;
      });
      if (complianceSlotsEl) {
        complianceSlotsEl.hidden = !accountClass;
      }
      renderComplianceProfile(data);
      const isPersonal = accountClass === "1";
      const isEnterprise = accountClass === "2";
      const files = (data == null ? void 0 : data.files) || {};
      const fillSlot = (kind, list, { visible, done }) => {
        const slot = root.querySelector(`[data-compliance-slot="${kind}"]`);
        if (!slot) return;
        slot.hidden = !visible;
        slot.classList.toggle("is-done", Boolean(done));
        const count = slot.querySelector("[data-compliance-slot-count]");
        const ul = slot.querySelector("[data-compliance-file-list]");
        const visual = slot.querySelector(".sfc-compliance-slot__visual");
        const illus = slot.querySelector(".sfc-compliance-illus");
        const names = Array.isArray(list) ? list : [];
        if (count) count.textContent = `${names.length} file(s)`;
        if (ul) clear(ul);
        if (visual) {
          const latest = names.length ? names[names.length - 1] : "";
          const existing = visual.querySelector("[data-compliance-preview]");
          if (!latest) {
            if (existing) existing.remove();
            visual.classList.remove("has-preview");
            if (illus) illus.hidden = false;
          } else {
            const url = complianceFileUrl(latest, { baseUrl: apiBase });
            if (existing && existing.getAttribute("href") === url) {
              visual.classList.add("has-preview");
              if (illus) illus.hidden = true;
            } else {
              if (existing) existing.remove();
              const lower = String(latest).toLowerCase();
              const isImage = /\.(jpe?g|png)$/i.test(lower);
              const preview = document.createElement("a");
              preview.href = url;
              preview.target = "_blank";
              preview.rel = "noopener noreferrer";
              preview.className = "sfc-compliance-slot__preview";
              preview.dataset.compliancePreview = "1";
              preview.title = latest;
              if (isImage) {
                const img = document.createElement("img");
                img.src = url;
                img.alt = latest;
                img.loading = "lazy";
                preview.append(img);
              } else {
                const badge = document.createElement("span");
                badge.className = "sfc-compliance-slot__preview-badge";
                badge.textContent = /\.pdf$/i.test(lower) ? "PDF" : "FILE";
                preview.append(badge);
              }
              visual.append(preview);
              visual.classList.add("has-preview");
              if (illus) illus.hidden = true;
            }
          }
        }
      };
      fillSlot("license", files.license, {
        visible: isEnterprise,
        done: (files.license || []).length >= 1
      });
      fillSlot("passport", files.passport, {
        visible: isPersonal,
        done: (files.passport || []).length >= 1
      });
      fillSlot("holding", files.holding, {
        visible: isPersonal,
        done: (files.holding || []).length >= 1
      });
      fillSlot("identity", files.identity, {
        visible: isEnterprise,
        done: (files.identity || []).length >= 1
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
      const canSubmit = Boolean(data == null ? void 0 : data.ready) && !isAccountApproved(data) && ![
        REVIEW_STATUS.PENDING_REVIEW,
        REVIEW_STATUS.SUSPENDED
      ].includes(reviewStatus);
      if (complianceSubmitBtn) {
        complianceSubmitBtn.hidden = !canSubmit;
        complianceSubmitBtn.disabled = !canSubmit;
      }
      if (isAccountApproved(data)) {
        setComplianceStatus("Account approved. Shipment-level cargo screening is still required.");
        maybeResumeOrderAfterCompliance(data);
      } else if (reviewStatus === REVIEW_STATUS.PENDING_REVIEW) {
        setComplianceStatus("Your verification is under review. New orders remain locked.");
      } else if (!accountClass) {
        setComplianceStatus("Choose personal or enterprise to continue.", {
          error: true
        });
      } else if (Array.isArray(data == null ? void 0 : data.missing) && data.missing.length) {
        const labels = data.missing.map((m) => m.label || m.code).join("; ");
        setComplianceStatus(`Still needed: ${labels}`, { error: true });
      } else {
        setComplianceStatus("");
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
      if (root.dataset.customerLoggedIn !== "true") {
        setComplianceStatus("Sign in to manage documents.", { error: true });
        return null;
      }
      setComplianceStatus("Loading\u2026");
      try {
        const data = await fetchCompliance({ baseUrl: apiBase });
        if (!(data == null ? void 0 : data.ok)) {
          setComplianceStatus((data == null ? void 0 : data.message) || "Unable to load documents.", {
            error: true
          });
          return data;
        }
        renderComplianceUi(data);
        return data;
      } catch (e) {
        setComplianceStatus("Unable to load documents.", { error: true });
        return null;
      }
    }
    function openComplianceDialog() {
      setAccountMenuOpen(false);
      if (!complianceDialog) return;
      loadComplianceStatus();
      if (typeof complianceDialog.showModal === "function") {
        complianceDialog.showModal();
      } else {
        complianceDialog.setAttribute("open", "");
      }
    }
    function closeComplianceDialog() {
      if (complianceDialog == null ? void 0 : complianceDialog.open) complianceDialog.close();
    }
    root.querySelectorAll("[data-compliance-open]").forEach((btn) => {
      btn.addEventListener("click", () => openComplianceDialog());
    });
    root.querySelectorAll("[data-compliance-close]").forEach((btn) => {
      btn.addEventListener("click", () => closeComplianceDialog());
    });
    (_a = root.querySelector("[data-compliance-refresh]")) == null ? void 0 : _a.addEventListener("click", () => {
      loadComplianceStatus();
    });
    complianceSubmitBtn == null ? void 0 : complianceSubmitBtn.addEventListener("click", async () => {
      if (!(complianceState == null ? void 0 : complianceState.ready)) {
        setComplianceStatus("Complete the profile and required documents first.", {
          error: true
        });
        return;
      }
      complianceSubmitBtn.disabled = true;
      setComplianceStatus("Submitting for SFC review\u2026");
      try {
        const data = await submitComplianceReview({ baseUrl: apiBase });
        if (!(data == null ? void 0 : data.ok)) {
          setComplianceStatus((data == null ? void 0 : data.message) || "Unable to submit verification.", {
            error: true
          });
          return;
        }
        renderComplianceUi(data);
      } catch (e) {
        setComplianceStatus("Unable to submit verification. Try again.", {
          error: true
        });
      } finally {
        if (complianceSubmitBtn && !complianceSubmitBtn.hidden) {
          complianceSubmitBtn.disabled = false;
        }
      }
    });
    complianceDialog == null ? void 0 : complianceDialog.addEventListener("click", (event) => {
      if (event.target === complianceDialog) closeComplianceDialog();
    });
    root.querySelectorAll("[data-compliance-account-class]").forEach((input) => {
      input.addEventListener("change", async () => {
        if (!input.checked) return;
        const nextClass = String(input.value || "");
        applyAccountClassLocally(nextClass);
        setComplianceStatus("Saving account type\u2026");
        try {
          const data = await setComplianceAccountClass(nextClass, {
            baseUrl: apiBase
          });
          if (!(data == null ? void 0 : data.ok)) {
            setComplianceStatus((data == null ? void 0 : data.message) || "Unable to save account type.", {
              error: true
            });
            return;
          }
          renderComplianceUi(data);
        } catch (e) {
          setComplianceStatus("Unable to save account type.", { error: true });
        }
      });
    });
    (_b = root.querySelector("[data-compliance-profile-save]")) == null ? void 0 : _b.addEventListener(
      "click",
      async () => {
        const accountClass = (complianceState == null ? void 0 : complianceState.accountClass) ? String(complianceState.accountClass) : "";
        if (!accountClass) {
          setComplianceStatus("Choose personal or enterprise first.", {
            error: true
          });
          return;
        }
        setComplianceStatus("Saving profile\u2026");
        try {
          const data = await saveComplianceProfile(
            {
              trueName: (complianceTrueNameEl == null ? void 0 : complianceTrueNameEl.value) || "",
              company: (complianceCompanyEl == null ? void 0 : complianceCompanyEl.value) || "",
              creditId: (complianceCreditIdEl == null ? void 0 : complianceCreditIdEl.value) || "",
              cardId: (complianceCardIdEl == null ? void 0 : complianceCardIdEl.value) || ""
            },
            { baseUrl: apiBase }
          );
          if (!(data == null ? void 0 : data.ok)) {
            setComplianceStatus((data == null ? void 0 : data.message) || "Unable to save profile.", {
              error: true
            });
            return;
          }
          renderComplianceUi(data);
          setComplianceStatus(data.message || "Profile saved.");
        } catch (e) {
          setComplianceStatus("Unable to save profile.", { error: true });
        }
      }
    );
    root.querySelectorAll("[data-compliance-slot]").forEach((slot) => {
      const input = slot.querySelector("[data-compliance-file-input]");
      const kind = slot.getAttribute("data-compliance-slot");
      input == null ? void 0 : input.addEventListener("change", async () => {
        var _a2;
        const file = (_a2 = input.files) == null ? void 0 : _a2[0];
        input.value = "";
        if (!file || !kind) return;
        const validation = validateComplianceFile(file);
        if (!validation.valid) {
          setComplianceStatus(validation.message, { error: true });
          return;
        }
        setComplianceStatus(`Uploading ${file.name}\u2026`);
        try {
          const data = await uploadComplianceFile({
            kind,
            file,
            baseUrl: apiBase
          });
          if (!(data == null ? void 0 : data.ok)) {
            setComplianceStatus((data == null ? void 0 : data.message) || "Upload failed.", { error: true });
            return;
          }
          renderComplianceUi(data);
          setComplianceStatus(data.message || "Document uploaded.");
        } catch (e) {
          setComplianceStatus("Upload failed.", { error: true });
        }
      });
    });
    document.addEventListener("click", (event) => {
      if (!accountMenu || accountMenu.contains(event.target)) return;
      setAccountMenuOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    });
    document.addEventListener("click", (event) => {
      const openMenu = root.querySelector(".label-menu.is-open");
      if (!openMenu) return;
      if (openMenu.contains(event.target)) return;
      closeAllLabelMenus();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAllLabelMenus();
    });
    orderDetailLabelTrigger == null ? void 0 : orderDetailLabelTrigger.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!orderDetailLabelMenu) return;
      setLabelMenuOpen(
        orderDetailLabelMenu,
        !orderDetailLabelMenu.classList.contains("is-open")
      );
    });
    function setUsdHint(el, usdValue) {
      if (!el) return;
      const text = formatUsdApprox(usdValue);
      if (!text) {
        el.hidden = true;
        el.textContent = "";
        return;
      }
      el.hidden = false;
      el.textContent = text;
    }
    function applyAccountSummary(state) {
      const {
        userCode = "",
        balance = "",
        currency = "",
        balanceUsd = null,
        userCodeMessage = ""
      } = state;
      if (headerUserCodeEl) headerUserCodeEl.textContent = userCodeMessage || userCode;
      if (headerBalanceEl) headerBalanceEl.textContent = balance;
      if (headerCurrencyEl) headerCurrencyEl.textContent = currency;
      setUsdHint(headerBalanceUsdEl, balanceUsd);
    }
    async function refreshAccountBalance() {
      if (root.dataset.customerLoggedIn !== "true") {
        applyAccountSummary({
          balance: "\u2014",
          currency: "",
          balanceUsd: null,
          userCodeMessage: "Sign in required"
        });
        return;
      }
      applyAccountSummary({
        balance: "\u2026",
        currency: "",
        balanceUsd: null,
        userCodeMessage: "Linking\u2026"
      });
      try {
        const data = await fetchBalance({ baseUrl: apiBase });
        if (data == null ? void 0 : data.ok) {
          applyAccountSummary({
            balance: Number(data.balance).toFixed(2),
            currency: data.currency || "",
            balanceUsd: data.balanceUsd != null && data.balanceUsd !== "" ? Number(data.balanceUsd) : null,
            userCode: data.userCode ? `SFC ${data.userCode}` : "Linked"
          });
        } else if ((data == null ? void 0 : data.code) === "BINDING_REQUIRED") {
          applyAccountSummary({
            balance: "\u2014",
            currency: "",
            userCodeMessage: "Linking\u2026"
          });
        } else {
          applyAccountSummary({
            balance: "\u2014",
            currency: "",
            userCodeMessage: (data == null ? void 0 : data.message) || "Balance unavailable"
          });
        }
      } catch (e) {
        applyAccountSummary({
          balance: "\u2014",
          currency: "",
          userCodeMessage: "Balance unavailable"
        });
      }
    }
    const PENDING_ORDER_KEY = "sfcPendingOrder";
    function goToShopifyLogin() {
      trackEvent("login", { status: "start" });
      const url = root.dataset.loginUrl || `/customer_authentication/login?return_to=${encodeURIComponent(
        window.location.pathname || "/"
      )}`;
      window.location.assign(url);
    }
    function setOrderFieldsStatus(message, { error = false } = {}) {
      if (!orderFieldsStatus) return;
      if (!message) {
        orderFieldsStatus.hidden = true;
        orderFieldsStatus.textContent = "";
        return;
      }
      orderFieldsStatus.hidden = false;
      orderFieldsStatus.textContent = message;
      orderFieldsStatus.classList.toggle("inline-error", error);
    }
    function setOrderSubmitStatus(message, { error = false } = {}) {
      if (!orderSubmitStatus) return;
      if (!message) {
        orderSubmitStatus.hidden = true;
        orderSubmitStatus.textContent = "";
        return;
      }
      orderSubmitStatus.hidden = false;
      orderSubmitStatus.textContent = message;
      orderSubmitStatus.classList.toggle("inline-error", error);
      orderSubmitStatus.classList.toggle("recharge-status--ok", !error);
    }
    const orderSuccessGuide = root.querySelector("[data-order-success-guide]");
    const orderSuccessTitle = root.querySelector("[data-order-success-title]");
    const orderSuccessFirstMile = root.querySelector(
      "[data-order-success-step-firstmile]"
    );
    const orderSuccessPrint = root.querySelector("[data-order-success-print]");
    const orderSuccessDownload = root.querySelector(
      "[data-order-success-download]"
    );
    const orderDomesticBlock = root.querySelector(
      "[data-order-domestic-tracking]"
    );
    const orderDomesticTrackingInput = root.querySelector(
      "[data-order-domestic-tracking-no]"
    );
    const orderDomesticSaveBtn = root.querySelector(
      "[data-order-domestic-tracking-save]"
    );
    const orderDomesticStatus = root.querySelector(
      "[data-order-domestic-tracking-status]"
    );
    const orderDetailDomesticInput = root.querySelector(
      "[data-order-detail-domestic-no]"
    );
    const orderDetailDomesticSaveBtn = root.querySelector(
      "[data-order-detail-domestic-save]"
    );
    const orderDetailDomesticStatus = root.querySelector(
      "[data-order-detail-domestic-status]"
    );
    const orderSubmitBtn = orderForm == null ? void 0 : orderForm.querySelector("[data-order-submit]");
    const cargoFlagInputs = [
      ...(orderForm == null ? void 0 : orderForm.querySelectorAll("[data-cargo-flag]")) || []
    ];
    const cargoNoneInput = orderForm == null ? void 0 : orderForm.querySelector("[data-cargo-none]");
    const cargoDetailsEl = orderForm == null ? void 0 : orderForm.querySelector("[data-cargo-details]");
    const cargoDescriptionEl = orderForm == null ? void 0 : orderForm.querySelector("[data-cargo-description]");
    const cargoSdsEl = orderForm == null ? void 0 : orderForm.querySelector("[data-cargo-sds]");
    const cargoUnEl = orderForm == null ? void 0 : orderForm.querySelector("[data-cargo-un]");
    const cargoDgClassEl = orderForm == null ? void 0 : orderForm.querySelector("[data-cargo-dg-class]");
    const cargoAttestationEl = orderForm == null ? void 0 : orderForm.querySelector("[data-cargo-attestation]");
    const cargoStatusEl = orderForm == null ? void 0 : orderForm.querySelector("[data-cargo-status]");
    let lastCreatedOrder = null;
    let detailDomesticOrder = null;
    function setStatusEl(el, message, { error = false } = {}) {
      if (!el) return;
      if (!message) {
        el.hidden = true;
        el.textContent = "";
        return;
      }
      el.hidden = false;
      el.textContent = message;
      el.classList.toggle("inline-error", error);
      el.classList.toggle("recharge-status--ok", !error);
    }
    function setCargoStatus(message, { error = false } = {}) {
      setStatusEl(cargoStatusEl, message, { error });
    }
    function syncCargoDeclarationUi() {
      const hasFlags = cargoFlagInputs.some((input) => input.checked);
      if (hasFlags && cargoNoneInput) cargoNoneInput.checked = false;
      if (cargoDetailsEl) cargoDetailsEl.hidden = !hasFlags;
      if (cargoDescriptionEl) cargoDescriptionEl.required = hasFlags;
      setCargoStatus("");
    }
    function collectCargoDeclaration() {
      const flags = {};
      cargoFlagInputs.forEach((input) => {
        flags[input.value] = input.checked;
      });
      return {
        flags,
        noneOfThese: Boolean(cargoNoneInput == null ? void 0 : cargoNoneInput.checked),
        description: (cargoDescriptionEl == null ? void 0 : cargoDescriptionEl.value) || "",
        sdsReference: (cargoSdsEl == null ? void 0 : cargoSdsEl.value) || "",
        unNumber: (cargoUnEl == null ? void 0 : cargoUnEl.value) || "",
        dangerousGoodsClass: (cargoDgClassEl == null ? void 0 : cargoDgClassEl.value) || "",
        declarationAccepted: Boolean(cargoAttestationEl == null ? void 0 : cargoAttestationEl.checked)
      };
    }
    cargoFlagInputs.forEach((input) => {
      input.addEventListener("change", syncCargoDeclarationUi);
    });
    cargoNoneInput == null ? void 0 : cargoNoneInput.addEventListener("change", () => {
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
    async function saveDomesticTrackingForOrder(order, {
      inputEl,
      statusEl,
      buttonEl,
      firstMileMode = "dropoff"
    } = {}) {
      const orderCode = String((order == null ? void 0 : order.orderCode) || (order == null ? void 0 : order.sfcOrderCode) || "").trim();
      if (!orderCode) {
        setStatusEl(statusEl, "Missing order number.", { error: true });
        return false;
      }
      const trackingNo = String((inputEl == null ? void 0 : inputEl.value) || "").trim().replace(/\s+/g, "");
      if (trackingNo.length < 6) {
        setStatusEl(statusEl, "Enter a valid China domestic tracking number.", {
          error: true
        });
        inputEl == null ? void 0 : inputEl.focus();
        return false;
      }
      const saveHtml = buttonEl == null ? void 0 : buttonEl.innerHTML;
      if (buttonEl) {
        buttonEl.disabled = true;
        buttonEl.classList.add("is-busy");
        buttonEl.textContent = "Saving\u2026";
      }
      setStatusEl(statusEl, "Saving domestic tracking\u2026");
      try {
        const data = await bindDomesticTracking(
          {
            orderCode,
            customerOrderNo: order.customerOrderNo || "",
            firstMileMode,
            domesticTrackingNo: trackingNo
          },
          { baseUrl: apiBase }
        );
        if (data == null ? void 0 : data.ok) {
          const saved = data.domesticTrackingNo || trackingNo;
          setStatusEl(
            statusEl,
            `Saved: ${saved}. Our team can match this parcel to your SFC order.`
          );
          if (inputEl) inputEl.value = saved;
          applyDomesticTrackingToLocalOrders(orderCode, saved, {
            sfcOrderCode: order.sfcOrderCode || "",
            customerOrderNo: order.customerOrderNo || ""
          });
          return true;
        }
        if ((data == null ? void 0 : data.code) === "LOGIN_REQUIRED" || (data == null ? void 0 : data.code) === "BINDING_REQUIRED") {
          goToShopifyLogin();
          return false;
        }
        setStatusEl(
          statusEl,
          (data == null ? void 0 : data.message) || "Unable to save domestic tracking. Try again.",
          { error: true }
        );
        return false;
      } catch (e) {
        setStatusEl(statusEl, "Unable to save domestic tracking. Try again.", {
          error: true
        });
        return false;
      } finally {
        if (buttonEl && saveHtml != null) {
          buttonEl.disabled = false;
          buttonEl.classList.remove("is-busy");
          buttonEl.innerHTML = saveHtml;
        }
      }
    }
    function orderCodeMatches(order, code) {
      const want = String(code || "").trim().toUpperCase();
      if (!want || !order) return false;
      const a = String(order.orderCode || "").trim().toUpperCase();
      const b = String(order.sfcOrderCode || "").trim().toUpperCase();
      return a === want || b === want;
    }
    function applyDomesticTrackingToLocalOrders(orderCode, trackingNo, extra = {}) {
      const saved = String(trackingNo || "").trim();
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
          ...extra.customerOrderNo ? { customerOrderNo: order.customerOrderNo || extra.customerOrderNo } : {}
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
        renderOrdersList([], { append: false });
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
      setDomesticTrackingStatus("");
      if (orderSubmitBtn) {
        orderSubmitBtn.hidden = false;
        orderSubmitBtn.disabled = false;
      }
      lastCreatedOrder = null;
    }
    function showOrderSuccessGuide(data, parcel) {
      if (!orderSuccessGuide) return;
      const code = String((data == null ? void 0 : data.orderCode) || "").trim();
      const isDropoff = (parcel == null ? void 0 : parcel.firstMileMode) === "dropoff";
      lastCreatedOrder = {
        orderCode: code,
        sfcOrderCode: code,
        customerOrderNo: (data == null ? void 0 : data.customerOrderNo) || "",
        trackingNumber: (data == null ? void 0 : data.trackingNumber) || "",
        firstMileMode: isDropoff ? "dropoff" : "pickup"
      };
      if (orderSuccessTitle) {
        orderSuccessTitle.textContent = `Order created${code ? `: ${code}` : ""}${(data == null ? void 0 : data.trackingNumber) ? ` \xB7 Tracking ${data.trackingNumber}` : ""}.`;
      }
      if (orderSuccessFirstMile) {
        orderSuccessFirstMile.innerHTML = isDropoff ? "<strong>Drop off</strong> the parcel at our Huizhou warehouse (address shown above). If you use a China courier, also save the domestic tracking number below." : "<strong>Keep the labeled parcel ready</strong> \u2014 we will arrange China pickup using the address you provided.";
      }
      if (orderDomesticBlock) {
        orderDomesticBlock.hidden = !isDropoff;
        if (orderDomesticTrackingInput) orderDomesticTrackingInput.value = "";
        setDomesticTrackingStatus(
          isDropoff ? "Please save your China domestic tracking number after you ship to the warehouse." : ""
        );
      }
      if (orderSubmitBtn) {
        orderSubmitBtn.hidden = true;
      }
      orderSuccessGuide.hidden = false;
      orderSuccessGuide.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    orderSuccessPrint == null ? void 0 : orderSuccessPrint.addEventListener("click", () => {
      if (!(lastCreatedOrder == null ? void 0 : lastCreatedOrder.orderCode)) return;
      runOrderLabelAction(lastCreatedOrder, "print", orderSuccessPrint);
    });
    orderSuccessDownload == null ? void 0 : orderSuccessDownload.addEventListener("click", () => {
      if (!(lastCreatedOrder == null ? void 0 : lastCreatedOrder.orderCode)) return;
      runOrderLabelAction(lastCreatedOrder, "download", orderSuccessDownload);
    });
    orderDomesticSaveBtn == null ? void 0 : orderDomesticSaveBtn.addEventListener("click", () => {
      if (!(lastCreatedOrder == null ? void 0 : lastCreatedOrder.orderCode)) {
        setDomesticTrackingStatus("Create an order first.", { error: true });
        return;
      }
      if (lastCreatedOrder.firstMileMode !== "dropoff") return;
      saveDomesticTrackingForOrder(lastCreatedOrder, {
        inputEl: orderDomesticTrackingInput,
        statusEl: orderDomesticStatus,
        buttonEl: orderDomesticSaveBtn,
        firstMileMode: "dropoff"
      });
    });
    orderDetailDomesticSaveBtn == null ? void 0 : orderDetailDomesticSaveBtn.addEventListener("click", () => {
      if (!(detailDomesticOrder == null ? void 0 : detailDomesticOrder.orderCode)) {
        setStatusEl(orderDetailDomesticStatus, "Open an order first.", {
          error: true
        });
        return;
      }
      saveDomesticTrackingForOrder(detailDomesticOrder, {
        inputEl: orderDetailDomesticInput,
        statusEl: orderDetailDomesticStatus,
        buttonEl: orderDetailDomesticSaveBtn,
        firstMileMode: "dropoff"
      });
    });
    function currentParcel() {
      if (lastParcel) return { ...lastParcel };
      if (!rateForm) return null;
      return serializeRateForm(rateForm);
    }
    function clearOrderFieldHosts() {
      [orderFieldsRecipient, orderFieldsOptions, orderFieldsSend].filter(Boolean).forEach((host) => {
        host.innerHTML = "";
        host.hidden = true;
      });
      if (orderItemsList) orderItemsList.innerHTML = "";
      if (orderItemsExtras) orderItemsExtras.innerHTML = "";
      if (orderFieldsDetails) orderFieldsDetails.hidden = true;
      orderItemFieldDefs = [];
      if (orderFieldsSendHeading) orderFieldsSendHeading.hidden = true;
      if (orderFieldsRecipientHeading) orderFieldsRecipientHeading.hidden = true;
      if (orderFieldsCustomsHeading) orderFieldsCustomsHeading.hidden = true;
    }
    function buildOrderFieldControl(field, { stateList, cityList, name, itemField = false } = {}) {
      var _a2, _b2, _c2;
      const controlName = name || field.key;
      const wrap = element(
        "label",
        field.key === "address1" || field.key === "descriptionEn" || field.key === "sendAddress" ? "field field--wide" : "field"
      );
      const title = element("span");
      title.textContent = field.label || field.key;
      if (field.required) {
        const star = document.createElement("small");
        star.textContent = " *";
        star.style.color = "var(--signal)";
        title.append(star);
      } else {
        const opt = document.createElement("small");
        opt.textContent = " (optional)";
        title.append(opt);
      }
      wrap.append(title);
      let control;
      if (field.key === "recipientState" && Array.isArray(stateList) && stateList.length) {
        control = document.createElement("select");
        control.name = controlName;
        const blank = document.createElement("option");
        blank.value = "";
        blank.textContent = "Select state";
        control.append(blank);
        stateList.forEach((row) => {
          const opt = document.createElement("option");
          opt.value = row.state_code || row.state || "";
          opt.textContent = row.state ? `${row.state}${row.state_code ? ` (${row.state_code})` : ""}` : opt.value;
          control.append(opt);
        });
      } else if (field.key === "recipientCity" && Array.isArray(cityList) && cityList.length) {
        control = document.createElement("select");
        control.name = controlName;
        const blank = document.createElement("option");
        blank.value = "";
        blank.textContent = "Select city";
        control.append(blank);
        cityList.forEach((row) => {
          const opt = document.createElement("option");
          opt.value = row.city || row.city_code || "";
          opt.textContent = row.city ? `${row.city}${row.city_code ? ` (${row.city_code})` : ""}` : opt.value;
          control.append(opt);
        });
      } else if (field.inputType === "boolean") {
        control = document.createElement("select");
        control.name = controlName;
        [
          ["", "No"],
          ["1", "Yes"]
        ].forEach(([value, label]) => {
          const opt = document.createElement("option");
          opt.value = value;
          opt.textContent = label;
          control.append(opt);
        });
      } else {
        control = document.createElement("input");
        control.name = controlName;
        control.type = field.inputType === "email" ? "email" : field.inputType === "number" ? "number" : "text";
        if (field.inputType === "number") {
          if (field.key === "quantity") {
            control.step = "1";
            control.min = "1";
          } else if (field.key === "detailWeight" || field.key === "declaredValue" || field.key === "worth") {
            control.step = "any";
            control.min = "0";
          } else {
            control.step = "any";
            if (((_a2 = field.range) == null ? void 0 : _a2.start) != null) control.min = field.range.start;
          }
          if (((_b2 = field.range) == null ? void 0 : _b2.end) != null) control.max = field.range.end;
        } else if ((_c2 = field.range) == null ? void 0 : _c2.end) {
          control.maxLength = Number(field.range.end) || 200;
        }
        if (field.key === "descriptionEn") {
          control.placeholder = "e.g. Ceramic mug / Water bottle";
        }
        if (field.key === "quantity") {
          control.value = "1";
        }
        if (field.key === "sendAddress") {
          control.placeholder = "Street address in China / origin";
        }
        if (field.key === "sendCity") {
          control.placeholder = "e.g. Shenzhen";
        }
        if (field.key === "sendState") {
          control.placeholder = "e.g. Guangdong";
        }
      }
      if (field.required) control.required = true;
      if (itemField) control.dataset.itemField = field.key;
      wrap.append(control);
      return wrap;
    }
    function renumberOrderItemRows() {
      if (!orderItemsList) return;
      const rows = [...orderItemsList.querySelectorAll("[data-order-item-row]")];
      rows.forEach((row, index) => {
        const title = row.querySelector("[data-order-item-title]");
        if (title) title.textContent = `Item ${index + 1}`;
        const removeBtn = row.querySelector("[data-order-item-remove]");
        if (removeBtn) removeBtn.disabled = rows.length <= 1;
      });
      if (orderItemAddBtn) {
        orderItemAddBtn.disabled = rows.length >= MAX_ORDER_ITEMS;
      }
    }
    function addOrderItemRow({ prefillWeight = false } = {}) {
      if (!orderItemsList || !orderItemFieldDefs.length) return null;
      const rows = orderItemsList.querySelectorAll("[data-order-item-row]");
      if (rows.length >= MAX_ORDER_ITEMS) return null;
      orderItemSeq += 1;
      const rowId = orderItemSeq;
      const row = element("div", "order-item-row");
      row.dataset.orderItemRow = String(rowId);
      const head = element("div", "order-item-row__head");
      const title = element("p", "order-item-row__title");
      title.dataset.orderItemTitle = "true";
      title.textContent = "Item";
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "order-item-row__remove";
      removeBtn.dataset.orderItemRemove = "true";
      removeBtn.textContent = "Remove";
      removeBtn.addEventListener("click", () => {
        const count = orderItemsList.querySelectorAll(
          "[data-order-item-row]"
        ).length;
        if (count <= 1) return;
        row.remove();
        renumberOrderItemRows();
      });
      head.append(title, removeBtn);
      const grid = element("div", "order-item-row__grid");
      orderItemFieldDefs.forEach((field) => {
        grid.append(
          buildOrderFieldControl(field, {
            name: `item_${rowId}_${field.key}`,
            itemField: true
          })
        );
      });
      row.append(head, grid);
      orderItemsList.append(row);
      if (prefillWeight) {
        const weightInput = row.querySelector('[data-item-field="detailWeight"]');
        const parcel = currentParcel();
        if (weightInput && (parcel == null ? void 0 : parcel.weight)) {
          weightInput.value = parcel.weight;
        }
      }
      renumberOrderItemRows();
      return row;
    }
    function collectOrderItems() {
      if (!orderItemsList) return [];
      return [...orderItemsList.querySelectorAll("[data-order-item-row]")].map(
        (row) => {
          const item = {};
          row.querySelectorAll("[data-item-field]").forEach((el) => {
            const key = el.dataset.itemField;
            if (!key) return;
            item[key] = el.value;
          });
          return item;
        }
      );
    }
    function renderOrderFields(meta) {
      clearOrderFieldHosts();
      const groups = {
        recipient: orderFieldsRecipient,
        options: orderFieldsOptions,
        send: orderFieldsSend
      };
      const fields = ensureShipperFields(
        Array.isArray(meta == null ? void 0 : meta.fields) ? meta.fields : []
      );
      const itemFields = [];
      const detailExtras = [];
      fields.forEach((field) => {
        if (!(field == null ? void 0 : field.visible)) return;
        if (field.group === "details") {
          if (ORDER_ITEM_FIELD_KEYS.has(field.key)) {
            itemFields.push(field);
          } else {
            if (field.key === "worth" || field.key === "total_export_declare") {
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
            cityList: meta.cityList
          })
        );
      });
      if (!itemFields.length) {
        itemFields.push(
          {
            key: "descriptionEn",
            label: "Item description (English)",
            required: true,
            visible: true,
            inputType: "text"
          },
          {
            key: "quantity",
            label: "Quantity",
            required: true,
            visible: true,
            inputType: "number"
          },
          {
            key: "declaredValue",
            label: "Unit value",
            required: true,
            visible: true,
            inputType: "number"
          },
          {
            key: "detailWeight",
            label: "Unit weight (kg)",
            required: true,
            visible: true,
            inputType: "number"
          }
        );
      }
      orderItemFieldDefs = itemFields;
      if (orderFieldsDetails && itemFields.length) {
        orderFieldsDetails.hidden = false;
        if (orderFieldsCustomsHeading) orderFieldsCustomsHeading.hidden = false;
        addOrderItemRow({ prefillWeight: true });
        detailExtras.forEach((field) => {
          orderItemsExtras == null ? void 0 : orderItemsExtras.append(
            buildOrderFieldControl(field, {
              stateList: meta.stateList,
              cityList: meta.cityList
            })
          );
        });
      }
      if (orderFieldsSend && !orderFieldsSend.hidden && orderFieldsSendHeading) {
        orderFieldsSendHeading.hidden = false;
      }
      if (orderFieldsRecipient && !orderFieldsRecipient.hidden && orderFieldsRecipientHeading) {
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
      const shipper = meta == null ? void 0 : meta.defaultShipper;
      if (shipper && orderForm) {
        Object.keys(shipper).forEach((key) => {
          const el = orderForm.elements[key];
          if (el && shipper[key] != null && shipper[key] !== "") {
            el.value = shipper[key];
          }
        });
      }
    }
    orderItemAddBtn == null ? void 0 : orderItemAddBtn.addEventListener("click", () => {
      addOrderItemRow({ prefillWeight: false });
    });
    async function loadOrderFieldsForRate(rate) {
      const parcel = currentParcel();
      const country = String((parcel == null ? void 0 : parcel.country) || "").trim().toUpperCase();
      const shippingMethod = String(rate.serviceCode || "").trim();
      const countryInput = orderPanel == null ? void 0 : orderPanel.querySelector("[data-order-country]");
      if (countryInput) countryInput.value = country;
      clearOrderFieldHosts();
      if (orderFieldsSendHeading) orderFieldsSendHeading.hidden = false;
      if (orderFieldsSend) {
        orderFieldsSend.hidden = false;
        orderFieldsSend.innerHTML = '<p class="order-fields-loading">Loading channel requirements\u2026</p>';
      }
      setOrderFieldsStatus("");
      setOrderSubmitStatus("");
      if (!shippingMethod || !country) {
        setOrderFieldsStatus(
          "Select a rate after checking shipping rates so we know the country and channel.",
          { error: true }
        );
        return;
      }
      try {
        const data = await fetchOrderFields(shippingMethod, country, {
          baseUrl: apiBase
        });
        if (!(data == null ? void 0 : data.ok) || !Array.isArray(data.fields)) {
          setOrderFieldsStatus(
            (data == null ? void 0 : data.message) || "Could not load channel fields. Using a basic form.",
            { error: true }
          );
          renderOrderFields({
            fields: ensureShipperFields([
              { key: "recipientName", group: "recipient", label: "Recipient name", required: true, visible: true, inputType: "text" },
              { key: "phone", group: "recipient", label: "Phone", required: true, visible: true, inputType: "text" },
              { key: "address1", group: "recipient", label: "Address", required: true, visible: true, inputType: "text" },
              { key: "recipientState", group: "recipient", label: "State / Province", required: false, visible: true, inputType: "text" },
              { key: "recipientCity", group: "recipient", label: "City", required: true, visible: true, inputType: "text" },
              { key: "zipCode", group: "recipient", label: "Postal code", required: true, visible: true, inputType: "text" },
              { key: "email", group: "recipient", label: "Recipient email", required: false, visible: true, inputType: "email" },
              { key: "descriptionEn", group: "details", label: "Item description (English)", required: true, visible: true, inputType: "text" },
              { key: "quantity", group: "details", label: "Quantity", required: true, visible: true, inputType: "number" },
              { key: "declaredValue", group: "details", label: "Unit value", required: true, visible: true, inputType: "number" },
              { key: "detailWeight", group: "details", label: "Unit weight (kg)", required: true, visible: true, inputType: "number" },
              { key: "worth", group: "details", label: "Total declare value", required: true, visible: true, inputType: "number" }
            ])
          });
          return;
        }
        renderOrderFields(data);
        if (!data.hasConfigure) {
          setOrderFieldsStatus(
            "This channel has no special field rules \u2014 showing the standard form."
          );
        }
      } catch (e) {
        setOrderFieldsStatus("Could not load channel fields. Try again.", {
          error: true
        });
      }
    }
    async function openOrderPanel(rate) {
      if (!orderPanel || !orderForm) return;
      activeOrderRate = rate || null;
      if (root.dataset.customerLoggedIn !== "true") {
        try {
          sessionStorage.setItem(
            PENDING_ORDER_KEY,
            JSON.stringify({
              serviceCode: rate.serviceCode || "",
              serviceName: rate.serviceName || "",
              amount: rate.amount || "",
              currency: rate.currency || "",
              savedAt: Date.now()
            })
          );
        } catch (e) {
        }
        goToShopifyLogin();
        return;
      }
      const compliance = await loadComplianceStatus();
      if (!(compliance == null ? void 0 : compliance.ok)) {
        if ((compliance == null ? void 0 : compliance.code) === "LOGIN_REQUIRED" || (compliance == null ? void 0 : compliance.code) === "BINDING_REQUIRED") {
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
      setOrderSubmitStatus("");
      orderPanel.querySelector("[data-order-service-name]").textContent = rate.serviceName || rate.serviceCode;
      orderPanel.querySelector("[data-order-service-code]").textContent = rate.serviceCode || "";
      orderPanel.querySelector("[data-order-service-price]").textContent = rate.totalAmount && rate.currency ? `Total ${rate.totalAmount} ${rate.currency}${rate.totalAmountUsd != null && rate.totalAmountUsd !== "" ? ` (${formatUsdApprox(rate.totalAmountUsd)})` : ""}` : rate.amount && rate.currency ? `${rate.amount} ${rate.currency}${rate.amountUsd != null && rate.amountUsd !== "" ? ` (${formatUsdApprox(rate.amountUsd)})` : ""}` : rate.amount || "\u2014";
      const breakdownEl = orderPanel.querySelector("[data-order-price-breakdown]");
      if (breakdownEl) {
        const fm = Number(rate.firstMileAmount || 0);
        const intl = Number(rate.amount || 0);
        breakdownEl.hidden = false;
        breakdownEl.textContent = rate.firstMileMode === "pickup" ? `International ${intl.toFixed(2)} + First mile ${fm.toFixed(2)} RMB (SF-like estimate)` : `International ${intl.toFixed(2)} \xB7 Drop-off first mile \xA50 (ship to warehouse yourself)`;
      }
      const warehouseCard2 = orderPanel.querySelector("[data-order-warehouse-card]");
      const pickupBlock = orderPanel.querySelector("[data-order-pickup-block]");
      const isPickup = rate.firstMileMode === "pickup";
      if (warehouseCard2) warehouseCard2.hidden = isPickup;
      if (pickupBlock) {
        pickupBlock.hidden = !isPickup;
        pickupBlock.querySelectorAll("input").forEach((el) => {
          el.required = isPickup;
          if (!isPickup) el.value = "";
        });
      }
      const pickupPhoneInput = orderForm == null ? void 0 : orderForm.querySelector("[data-order-pickup-phone]");
      if (pickupPhoneInput && pickupPhoneInput.dataset.cnPhoneBound !== "true") {
        pickupPhoneInput.dataset.cnPhoneBound = "true";
        pickupPhoneInput.addEventListener("input", () => {
          let digits = String(pickupPhoneInput.value || "").replace(/\D/g, "");
          if (digits.startsWith("0086")) digits = digits.slice(4);
          else if (digits.startsWith("86") && digits.length > 11) {
            digits = digits.slice(2);
          }
          pickupPhoneInput.value = digits.slice(0, 11);
        });
        pickupPhoneInput.addEventListener("blur", () => {
          const normalized = normalizeChinaMobile(pickupPhoneInput.value);
          if (normalized) pickupPhoneInput.value = normalized;
        });
      }
      const methodInput = orderPanel.querySelector("[data-order-shipping-method]");
      if (methodInput) methodInput.value = rate.serviceCode || "";
      loadOrderFieldsForRate(rate);
      orderPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function closeOrderPanel() {
      if (!orderPanel) return;
      orderPanel.hidden = true;
    }
    const pendingOrderBanner = root.querySelector("[data-pending-order-banner]");
    const pendingOrderMessage = root.querySelector("[data-pending-order-message]");
    function clearPendingOrderStorage() {
      try {
        sessionStorage.removeItem(PENDING_ORDER_KEY);
      } catch (e) {
      }
    }
    function hidePendingOrderBanner() {
      if (!pendingOrderBanner) return;
      pendingOrderBanner.hidden = true;
      if (pendingOrderMessage) pendingOrderMessage.textContent = "";
    }
    function resumePendingOrderAfterLogin() {
      if (root.dataset.customerLoggedIn !== "true") return;
      let hadPending = false;
      try {
        const raw = sessionStorage.getItem(PENDING_ORDER_KEY);
        if (raw) {
          const pending = JSON.parse(raw);
          hadPending = Boolean(pending == null ? void 0 : pending.serviceCode);
        }
      } catch (e) {
      }
      clearPendingOrderStorage();
      closeOrderPanel();
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } catch (e) {
        window.scrollTo(0, 0);
      }
      if (!hadPending || !pendingOrderBanner) return;
      if (pendingOrderMessage) {
        pendingOrderMessage.textContent = "You are signed in. Please enter destination and package details again, then check rates to place an order.";
      }
      pendingOrderBanner.hidden = false;
    }
    (_c = pendingOrderBanner == null ? void 0 : pendingOrderBanner.querySelector("[data-pending-order-continue]")) == null ? void 0 : _c.addEventListener("click", () => {
      var _a2;
      hidePendingOrderBanner();
      const ratesSection = root.querySelector('#SfcRates, [id^="SfcRates-"]');
      ratesSection == null ? void 0 : ratesSection.scrollIntoView({ behavior: "smooth", block: "start" });
      (_a2 = rateForm == null ? void 0 : rateForm.querySelector('[name="country"]')) == null ? void 0 : _a2.focus();
    });
    (_d = pendingOrderBanner == null ? void 0 : pendingOrderBanner.querySelector("[data-pending-order-dismiss]")) == null ? void 0 : _d.addEventListener("click", () => {
      hidePendingOrderBanner();
    });
    function setOrdersStatus(message, { error = false } = {}) {
      if (!ordersStatusEl) return;
      if (!message) {
        ordersStatusEl.hidden = true;
        ordersStatusEl.textContent = "";
        return;
      }
      ordersStatusEl.hidden = false;
      ordersStatusEl.textContent = message;
      ordersStatusEl.classList.toggle("inline-error", error);
    }
    function trackOrderNumber(value) {
      const code = String(value || "").trim();
      if (!code || !trackingInput) return;
      trackingInput.value = code;
      const trackingSection = root.querySelector('#SfcTracking, [id^="SfcTracking-"]');
      trackingSection == null ? void 0 : trackingSection.scrollIntoView({ behavior: "smooth", block: "start" });
      if (trackingForm == null ? void 0 : trackingForm.requestSubmit) {
        trackingForm.requestSubmit();
      } else {
        trackingForm == null ? void 0 : trackingForm.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true })
        );
      }
    }
    function closeOrderDetailDialog() {
      activeOrderDetail = null;
      closeAllLabelMenus();
      if (!orderDetailDialog) return;
      if (typeof orderDetailDialog.close === "function") {
        orderDetailDialog.close();
      } else {
        orderDetailDialog.removeAttribute("open");
      }
    }
    function openOrderDetailDialog(order) {
      if (!orderDetailDialog || !orderDetailBody) return;
      activeOrderDetail = order;
      if (orderDetailTitle) {
        orderDetailTitle.textContent = order.orderCode || "Shipment";
      }
      if (orderDetailStatus) {
        orderDetailStatus.textContent = [
          order.status,
          order.shippingMethod,
          order.countryName || order.country
        ].filter(Boolean).join(" \xB7 ");
      }
      const dims = [order.length, order.width, order.height].filter((n) => n != null && Number(n) > 0).join(" \xD7 ");
      const rows = [
        ["Order code", order.orderCode],
        ["SFC order code", order.sfcOrderCode],
        ["Customer reference", order.customerOrderNo],
        ["Status", order.status],
        ["Shipping method", order.shippingMethod],
        ["Tracking number", order.trackingNumber],
        ["China domestic tracking", order.domesticTrackingNo],
        ["Recipient", order.recipientName],
        ["Phone", order.recipientPhone],
        ["Email", order.recipientEmail],
        ["Address", order.recipientAddress],
        ["City", order.city],
        ["State / Province", order.state],
        ["Postal code", order.zipCode],
        ["Country", order.countryName || order.country],
        ["Weight (kg)", order.weight != null ? String(order.weight) : ""],
        ["Dimensions (cm)", dims ? `${dims}` : ""],
        ["Pieces", order.quantity != null ? String(order.quantity) : ""],
        [
          "Declare worth",
          order.declareWorth != null ? String(order.declareWorth) : ""
        ],
        ["Created", order.addTime],
        ["Sent", order.sendTime],
        ["Delivered", order.deliveryTime]
      ];
      clear(orderDetailBody);
      rows.forEach(([label, value]) => {
        if (value == null || String(value).trim() === "") return;
        const row = document.createElement("div");
        row.append(element("dt", "", label), element("dd", "", String(value)));
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
          runOrderLabelAction(order, "print", orderDetailLabelTrigger);
        };
      }
      if (orderDetailDownloadBtn) {
        orderDetailDownloadBtn.onclick = () => {
          setLabelMenuOpen(orderDetailLabelMenu, false);
          runOrderLabelAction(order, "download", orderDetailLabelTrigger);
        };
      }
      detailDomesticOrder = {
        orderCode: order.orderCode || order.sfcOrderCode || "",
        sfcOrderCode: order.sfcOrderCode || "",
        customerOrderNo: order.customerOrderNo || "",
        domesticTrackingNo: order.domesticTrackingNo || ""
      };
      const existingDomestic = String(order.domesticTrackingNo || "").trim();
      if (orderDetailDomesticInput) {
        orderDetailDomesticInput.value = existingDomestic;
      }
      setStatusEl(
        orderDetailDomesticStatus,
        existingDomestic ? `Saved: ${existingDomestic}. You can update it if needed.` : ""
      );
      if (typeof orderDetailDialog.showModal === "function") {
        orderDetailDialog.showModal();
      } else {
        orderDetailDialog.setAttribute("open", "open");
      }
    }
    function buildOrderRow(order) {
      const card = element("article", "sfc-order-card");
      const top = element("div", "sfc-order-card__top");
      const main = element("div", "sfc-order-card__main");
      main.append(
        element("strong", "sfc-order-card__code", order.orderCode || "\u2014"),
        element(
          "p",
          "sfc-order-card__meta",
          [
            order.shippingMethod,
            order.country || order.countryName,
            order.addTime ? String(order.addTime).slice(0, 16) : ""
          ].filter(Boolean).join(" \xB7 ")
        )
      );
      const status = element(
        "span",
        "sfc-order-card__status",
        order.status || "\u2014"
      );
      top.append(main, status);
      const details = element("div", "sfc-order-card__details");
      const bits = [];
      if (order.recipientName) bits.push(`To ${order.recipientName}`);
      if (order.city) bits.push(order.city);
      if (order.customerOrderNo) bits.push(`Ref ${order.customerOrderNo}`);
      if (order.trackingNumber) bits.push(`Track ${order.trackingNumber}`);
      if (order.domesticTrackingNo) {
        bits.push(`China ${order.domesticTrackingNo}`);
      }
      details.append(element("p", "", bits.join(" \xB7 ") || "No extra details"));
      const actions = element("div", "sfc-order-card__actions");
      const detailBtn = element("button", "button button--ghost");
      detailBtn.type = "button";
      detailBtn.textContent = "Details";
      detailBtn.addEventListener("click", () => openOrderDetailDialog(order));
      actions.append(detailBtn);
      actions.append(buildLabelMenu(order));
      const chinaTrackBtn = element("button", "button button--ghost");
      chinaTrackBtn.type = "button";
      chinaTrackBtn.textContent = order.domesticTrackingNo ? "China tracking \u2713" : "China tracking";
      chinaTrackBtn.addEventListener("click", () => {
        openOrderDetailDialog(order);
        orderDetailDomesticInput == null ? void 0 : orderDetailDomesticInput.focus();
      });
      actions.append(chinaTrackBtn);
      const trackValue = order.trackingNumber || order.orderCode;
      if (trackValue) {
        const trackBtn = element("button", "button button--ghost");
        trackBtn.type = "button";
        trackBtn.textContent = "Track";
        trackBtn.addEventListener("click", () => trackOrderNumber(trackValue));
        actions.append(trackBtn);
      }
      card.append(top, details, actions);
      return card;
    }
    function renderOrdersList(orders, { append = false } = {}) {
      if (!ordersListEl) return;
      if (!append) {
        clear(ordersListEl);
        ordersLoaded = [];
      }
      if (!(orders == null ? void 0 : orders.length) && !ordersLoaded.length) {
        const empty = element("div", "empty-state orders-empty");
        empty.append(
          element("p", "eyebrow", "NO ORDERS YET"),
          element("h3", "", "No SFC shipments on this account"),
          element(
            "p",
            "",
            "Place an order from a rate result and it will show up here."
          )
        );
        ordersListEl.append(empty);
        return;
      }
      orders.forEach((order) => {
        ordersLoaded.push(order);
        ordersListEl.append(buildOrderRow(order));
      });
    }
    async function loadOrders({ page = 1, append = false } = {}) {
      if (!ordersListEl) return;
      if (root.dataset.customerLoggedIn !== "true") {
        return;
      }
      if (!append) {
        clear(ordersListEl);
        ordersListEl.append(
          element("p", "order-fields-loading", "Loading your SFC orders\u2026")
        );
      }
      setOrdersStatus("");
      try {
        const data = await fetchOrders({ page, pageSize: 20, baseUrl: apiBase });
        if (!(data == null ? void 0 : data.ok)) {
          if ((data == null ? void 0 : data.code) === "LOGIN_REQUIRED" || (data == null ? void 0 : data.code) === "BINDING_REQUIRED") {
            setOrdersStatus(
              data.message || "Sign in and link your SFC account to see orders.",
              { error: true }
            );
            clear(ordersListEl);
            return;
          }
          setOrdersStatus((data == null ? void 0 : data.message) || "Unable to load orders.", { error: true });
          if (!append) clear(ordersListEl);
          return;
        }
        ordersPage = data.page || page;
        ordersHaveNext = Boolean(data.haveNext);
        if (ordersFooterEl) ordersFooterEl.hidden = !ordersHaveNext;
        if (!append) clear(ordersListEl);
        renderOrdersList(data.orders || [], { append });
        if (typeof data.total === "number" && data.total > 0) {
          setOrdersStatus(`${data.total} order${data.total === 1 ? "" : "s"} on your SFC account`);
        }
      } catch (e) {
        setOrdersStatus("Unable to load orders. Try again.", { error: true });
        if (!append) clear(ordersListEl);
      }
    }
    (_e = root.querySelector("[data-orders-refresh]")) == null ? void 0 : _e.addEventListener("click", () => {
      loadOrders({ page: 1, append: false });
    });
    ordersMoreBtn == null ? void 0 : ordersMoreBtn.addEventListener("click", () => {
      if (!ordersHaveNext) return;
      loadOrders({ page: ordersPage + 1, append: true });
    });
    const isShippingCenter = root.hasAttribute("data-sfc-shipping-center");
    const CENTER_VIEWS = ["overview", "orders"];
    function getCenterViewFromHash() {
      const raw = String(location.hash || "").replace(/^#/, "").trim().toLowerCase();
      return CENTER_VIEWS.includes(raw) ? raw : "overview";
    }
    function setCenterView(view, { updateHash = true } = {}) {
      if (!isShippingCenter) return;
      const next = CENTER_VIEWS.includes(view) ? view : "overview";
      root.querySelectorAll("[data-center-panel]").forEach((panel) => {
        panel.hidden = panel.getAttribute("data-center-panel") !== next;
      });
      root.querySelectorAll("[data-center-nav]").forEach((link) => {
        const active = link.getAttribute("data-center-nav") === next;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
      if (updateHash) {
        const nextHash = `#${next}`;
        if (location.hash !== nextHash) {
          history.replaceState(null, "", `${location.pathname}${location.search}${nextHash}`);
        }
      }
    }
    if (isShippingCenter) {
      setCenterView(getCenterViewFromHash(), { updateHash: false });
      root.addEventListener("click", (event) => {
        var _a2, _b2;
        const link = (_b2 = (_a2 = event.target).closest) == null ? void 0 : _b2.call(_a2, "[data-center-nav]");
        if (!link || !root.contains(link)) return;
        event.preventDefault();
        setCenterView(link.getAttribute("data-center-nav") || "overview");
      });
      window.addEventListener("hashchange", () => {
        setCenterView(getCenterViewFromHash(), { updateHash: false });
      });
    }
    const centerOrdersTbody = root.querySelector("[data-center-orders-tbody]");
    const centerOrdersStatusEl = root.querySelector("[data-center-orders-status]");
    const centerOrdersFooter = root.querySelector("[data-center-orders-footer]");
    const centerOrdersPrevBtn = root.querySelector("[data-center-orders-prev]");
    const centerOrdersNextBtn = root.querySelector("[data-center-orders-next]");
    const centerOrdersPageEl = root.querySelector("[data-center-orders-page]");
    const centerOrdersEmptyEl = root.querySelector("[data-center-orders-empty]");
    const centerOrdersTableWrap = root.querySelector(
      "[data-center-orders-table-wrap]"
    );
    const centerOrdersRefreshBtn = root.querySelector(
      "[data-center-orders-refresh]"
    );
    const CENTER_ORDERS_PAGE_SIZE = 5;
    let centerOrdersPage = 1;
    let centerOrdersHaveNext = false;
    let centerOrdersTotal = 0;
    let centerStatOrders = null;
    const centerStatOrdersEl = root.querySelector("[data-center-stat-orders]");
    function setCenterStat(el, value) {
      if (!el) return;
      if (value == null || Number.isNaN(Number(value))) {
        el.classList.add("is-loading");
        el.replaceChildren();
        const pulse = document.createElement("span");
        pulse.className = "sfc-center-stat__pulse";
        pulse.setAttribute("aria-hidden", "true");
        el.append(pulse);
        return;
      }
      el.classList.remove("is-loading");
      el.textContent = String(value);
    }
    function refreshCenterStatsPanel() {
      setCenterStat(centerStatOrdersEl, centerStatOrders);
    }
    function setCenterStatusEl(el, message, { error = false, loading = false } = {}) {
      if (!el) return;
      if (!message && !loading) {
        el.hidden = true;
        el.textContent = "";
        el.classList.remove("inline-error", "is-loading");
        return;
      }
      el.hidden = false;
      el.classList.toggle("inline-error", error);
      el.classList.toggle("is-loading", loading);
      if (loading) {
        el.replaceChildren();
        const spinner = document.createElement("span");
        spinner.className = "sfc-center-inline-spinner";
        spinner.setAttribute("aria-hidden", "true");
        const label = document.createElement("span");
        label.textContent = message || "Loading\u2026";
        el.append(spinner, label);
        return;
      }
      el.textContent = message;
    }
    function centerOrderStatusLabel(order) {
      return (order == null ? void 0 : order.status) || "\u2014";
    }
    function centerOrderRoute(order) {
      const dest = (order == null ? void 0 : order.countryName) || (order == null ? void 0 : order.country) || "";
      return dest ? `China \u2192 ${dest}` : "China \u2192 \u2014";
    }
    function centerOrderUpdated(order) {
      const raw = (order == null ? void 0 : order.addTime) || (order == null ? void 0 : order.sendTime) || "";
      if (!raw) return "\u2014";
      return String(raw).slice(0, 16);
    }
    function setCenterOrdersStatus(message, { error = false, loading = false } = {}) {
      setCenterStatusEl(centerOrdersStatusEl, message, { error, loading });
    }
    function updateCenterOrdersPager() {
      const totalPages = Math.max(
        1,
        Math.ceil(centerOrdersTotal / CENTER_ORDERS_PAGE_SIZE) || 1
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
      if (!(orders == null ? void 0 : orders.length)) {
        if (centerOrdersTableWrap) centerOrdersTableWrap.hidden = true;
        if (centerOrdersEmptyEl) {
          centerOrdersEmptyEl.hidden = false;
          centerOrdersEmptyEl.append(
            element("p", "", "No shipments yet"),
            element(
              "p",
              "sfc-center-placeholder",
              "Place an order from the home page after checking rates."
            )
          );
        }
        return;
      }
      if (centerOrdersTableWrap) centerOrdersTableWrap.hidden = false;
      orders.forEach((order) => {
        const tr = document.createElement("tr");
        [
          order.orderCode || "\u2014",
          centerOrderRoute(order),
          centerOrderStatusLabel(order),
          centerOrderUpdated(order)
        ].forEach((text) => {
          const td = document.createElement("td");
          td.textContent = text;
          tr.append(td);
        });
        centerOrdersTbody.append(tr);
      });
    }
    async function loadCenterOrders({ page = 1 } = {}) {
      if (!isShippingCenter || !centerOrdersTbody) return;
      if (root.dataset.customerLoggedIn !== "true") {
        setCenterOrdersStatus("Sign in to view your orders.", { error: true });
        return;
      }
      if (centerOrdersTableWrap) centerOrdersTableWrap.hidden = true;
      if (centerOrdersFooter) centerOrdersFooter.hidden = true;
      if (centerOrdersEmptyEl) {
        clear(centerOrdersEmptyEl);
        centerOrdersEmptyEl.hidden = true;
      }
      clear(centerOrdersTbody);
      setCenterOrdersStatus("Loading orders\u2026", { loading: true });
      try {
        const data = await fetchOrders({
          page,
          pageSize: CENTER_ORDERS_PAGE_SIZE,
          baseUrl: apiBase
        });
        if (!(data == null ? void 0 : data.ok)) {
          if ((data == null ? void 0 : data.code) === "LOGIN_REQUIRED" || (data == null ? void 0 : data.code) === "BINDING_REQUIRED") {
            setCenterOrdersStatus(
              data.message || "Sign in and link your SFC account to view orders.",
              { error: true }
            );
          } else {
            setCenterOrdersStatus((data == null ? void 0 : data.message) || "Could not load orders.", {
              error: true
            });
          }
          if (centerOrdersFooter) centerOrdersFooter.hidden = true;
          return;
        }
        centerOrdersPage = data.page || page;
        centerOrdersHaveNext = Boolean(data.haveNext);
        centerOrdersTotal = typeof data.total === "number" ? data.total : (data.orders || []).length;
        centerStatOrders = centerOrdersTotal;
        renderCenterOrdersRows(data.orders || []);
        updateCenterOrdersPager();
        refreshCenterStatsPanel();
        if (centerOrdersTotal > 0) {
          setCenterOrdersStatus(`${centerOrdersTotal} shipment(s)`);
        } else {
          setCenterOrdersStatus("");
        }
      } catch (e) {
        setCenterOrdersStatus("Could not load orders. Please try again.", { error: true });
        if (centerOrdersFooter) centerOrdersFooter.hidden = true;
      }
    }
    centerOrdersRefreshBtn == null ? void 0 : centerOrdersRefreshBtn.addEventListener("click", () => {
      loadCenterOrders({ page: 1 });
    });
    centerOrdersPrevBtn == null ? void 0 : centerOrdersPrevBtn.addEventListener("click", () => {
      if (centerOrdersPage <= 1) return;
      loadCenterOrders({ page: centerOrdersPage - 1 });
    });
    centerOrdersNextBtn == null ? void 0 : centerOrdersNextBtn.addEventListener("click", () => {
      if (!centerOrdersHaveNext) return;
      loadCenterOrders({ page: centerOrdersPage + 1 });
    });
    (_f = root.querySelector("[data-account-menu-orders]")) == null ? void 0 : _f.addEventListener("click", () => {
      setAccountMenuOpen(false);
    });
    root.querySelectorAll("[data-order-detail-close]").forEach((btn) => {
      btn.addEventListener("click", () => closeOrderDetailDialog());
    });
    orderDetailDialog == null ? void 0 : orderDetailDialog.addEventListener("click", (event) => {
      if (event.target === orderDetailDialog) closeOrderDetailDialog();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && (orderDetailDialog == null ? void 0 : orderDetailDialog.open)) {
        closeOrderDetailDialog();
      }
    });
    if (root.dataset.customerLoggedIn === "true") {
      linkAccount({ baseUrl: apiBase }).then(() => {
        refreshAccountBalance();
        loadOrders({ page: 1 });
        loadCenterOrders({ page: 1 });
      }).catch(() => {
        refreshAccountBalance();
        loadOrders({ page: 1 });
        loadCenterOrders({ page: 1 });
      });
    } else {
      refreshAccountBalance();
    }
    resumePendingOrderAfterLogin();
    function clampDecimalInput(input, { decimals = 2, round = false } = {}) {
      var _a2;
      if (!input) return;
      const raw = String((_a2 = input.value) != null ? _a2 : "");
      if (raw === "" || raw === "-" || raw === ".") return;
      if (raw.includes(".")) {
        const [intPart, decPart = ""] = raw.split(".");
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
    function clampIntegerInput(input, { round = false } = {}) {
      var _a2;
      if (!input) return;
      const raw = String((_a2 = input.value) != null ? _a2 : "");
      if (raw === "" || raw === "-") return;
      if (raw.includes(".")) {
        input.value = raw.split(".")[0];
      }
      if (!round) return;
      const n = Number(input.value);
      if (!Number.isFinite(n)) return;
      input.value = String(Math.round(n));
    }
    function packageField(form, name) {
      return (form == null ? void 0 : form.querySelector(`[name="${name}"]`)) || null;
    }
    function bindPackageFieldClamps(form) {
      if (!form) return;
      const weightInput = packageField(form, "weight");
      const dimInputs = ["length", "width", "height"].map((name) => packageField(form, name)).filter((el) => el && typeof el.addEventListener === "function");
      weightInput == null ? void 0 : weightInput.addEventListener(
        "input",
        () => clampDecimalInput(weightInput, { decimals: 2 })
      );
      weightInput == null ? void 0 : weightInput.addEventListener(
        "change",
        () => clampDecimalInput(weightInput, { decimals: 2, round: true })
      );
      weightInput == null ? void 0 : weightInput.addEventListener(
        "blur",
        () => clampDecimalInput(weightInput, { decimals: 2, round: true })
      );
      dimInputs.forEach((input) => {
        input.addEventListener("input", () => clampIntegerInput(input));
        input.addEventListener(
          "change",
          () => clampIntegerInput(input, { round: true })
        );
        input.addEventListener(
          "blur",
          () => clampIntegerInput(input, { round: true })
        );
      });
    }
    function serializeRateForm(form) {
      const values = Object.fromEntries(new FormData(form));
      const mode = String(values.firstMileMode || "pickup").toLowerCase();
      const weightEl = packageField(form, "weight");
      const lengthEl = packageField(form, "length");
      const widthEl = packageField(form, "width");
      const heightEl = packageField(form, "height");
      clampDecimalInput(weightEl, { decimals: 2, round: true });
      clampIntegerInput(lengthEl, { round: true });
      clampIntegerInput(widthEl, { round: true });
      clampIntegerInput(heightEl, { round: true });
      return {
        firstMileMode: mode === "pickup" ? "pickup" : "dropoff",
        pickupProvince: String(values.pickupProvince || "").trim(),
        country: String(values.country || "").trim().toUpperCase(),
        state: String(values.state || "").trim(),
        city: String(values.city || "").trim(),
        zipCode: String(values.zipCode || "").trim().toUpperCase(),
        weight: Math.round(Number(weightEl == null ? void 0 : weightEl.value) * 100) / 100,
        length: Math.round(Number(lengthEl == null ? void 0 : lengthEl.value)),
        width: Math.round(Number(widthEl == null ? void 0 : widthEl.value)),
        height: Math.round(Number(heightEl == null ? void 0 : heightEl.value))
      };
    }
    const {
      renderLoading: renderRateLoading,
      renderRates,
      renderState: renderRateState
    } = createRateUi({
      root,
      results: rateResults,
      getParcel: () => lastParcel || currentParcel() || {},
      onStartOrder: openOrderPanel
    });
    bindPackageFieldClamps(rateForm);
    orderForm == null ? void 0 : orderForm.addEventListener("submit", async (event) => {
      var _a2, _b2, _c2, _d2, _e2, _f2, _g, _h, _i;
      event.preventDefault();
      if (root.dataset.customerLoggedIn !== "true") {
        goToShopifyLogin();
        return;
      }
      if (!orderForm.reportValidity()) {
        (_a2 = orderForm.querySelector(":invalid")) == null ? void 0 : _a2.focus();
        return;
      }
      const cargoValidation = validateCargoDeclaration(collectCargoDeclaration());
      if (!cargoValidation.valid) {
        setCargoStatus(cargoValidation.message, { error: true });
        (_b2 = orderForm.querySelector("[data-cargo-gate]")) == null ? void 0 : _b2.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        return;
      }
      const parcel = currentParcel();
      if ((parcel == null ? void 0 : parcel.firstMileMode) === "pickup") {
        const contact = String(
          ((_c2 = orderForm.querySelector("[data-order-pickup-contact]")) == null ? void 0 : _c2.value) || ""
        ).trim();
        const phoneInput = orderForm.querySelector("[data-order-pickup-phone]");
        const phoneNormalized = normalizeChinaMobile(phoneInput == null ? void 0 : phoneInput.value);
        const address = String(
          ((_d2 = orderForm.querySelector("[data-order-pickup-address]")) == null ? void 0 : _d2.value) || ""
        ).trim();
        if (!contact || !address) {
          setOrderSubmitStatus(
            "Enter pickup contact, phone, and address for China collection.",
            { error: true }
          );
          return;
        }
        if (!phoneNormalized) {
          setOrderSubmitStatus(
            "Enter a valid China mobile number (11 digits, starts with 1).",
            { error: true }
          );
          phoneInput == null ? void 0 : phoneInput.focus();
          return;
        }
        if (phoneInput) phoneInput.value = phoneNormalized;
      }
      const shippingMethod = String(
        ((_e2 = orderForm.elements.shippingMethod) == null ? void 0 : _e2.value) || ""
      ).trim();
      const country = String(
        ((_f2 = orderForm.elements.country) == null ? void 0 : _f2.value) || (parcel == null ? void 0 : parcel.country) || ""
      ).trim().toUpperCase();
      if (!shippingMethod || !country) {
        setOrderSubmitStatus(
          "Missing channel or country. Check rates again and pick a service.",
          { error: true }
        );
        return;
      }
      const items = collectOrderItems();
      if (!items.length) {
        setOrderSubmitStatus("Add at least one customs item for this parcel.", {
          error: true
        });
        return;
      }
      for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const desc = String(item.descriptionEn || "").trim();
        const qty = Number(item.quantity);
        const unitValue = Number(item.declaredValue);
        const unitWeight = Number(item.detailWeight);
        if (!desc) {
          setOrderSubmitStatus(`Item ${i + 1}: enter an English description.`, {
            error: true
          });
          return;
        }
        if (!Number.isFinite(qty) || qty < 1) {
          setOrderSubmitStatus(`Item ${i + 1}: quantity must be at least 1.`, {
            error: true
          });
          return;
        }
        if (!Number.isFinite(unitValue) || unitValue <= 0) {
          setOrderSubmitStatus(
            `Item ${i + 1}: unit value must be greater than 0.`,
            { error: true }
          );
          return;
        }
        if (!Number.isFinite(unitWeight) || unitWeight <= 0) {
          setOrderSubmitStatus(
            `Item ${i + 1}: unit weight (kg) is required.`,
            { error: true }
          );
          return;
        }
      }
      const values = Object.fromEntries(new FormData(orderForm));
      const fields = { ...values };
      delete fields.shippingMethod;
      delete fields.country;
      delete fields.pickupContact;
      delete fields.pickupPhone;
      delete fields.pickupAddress;
      Object.keys(fields).forEach((key) => {
        if (key.startsWith("item_")) delete fields[key];
      });
      ORDER_ITEM_FIELD_KEYS.forEach((key) => {
        delete fields[key];
      });
      delete fields.worth;
      delete fields.total_export_declare;
      const pickupContact = String(
        ((_g = orderForm.querySelector("[data-order-pickup-contact]")) == null ? void 0 : _g.value) || ""
      ).trim();
      const pickupPhone = normalizeChinaMobile(
        (_h = orderForm.querySelector("[data-order-pickup-phone]")) == null ? void 0 : _h.value
      ) || "";
      const pickupAddress = String(
        ((_i = orderForm.querySelector("[data-order-pickup-address]")) == null ? void 0 : _i.value) || ""
      ).trim();
      const pickup = (parcel == null ? void 0 : parcel.firstMileMode) === "pickup" ? {
        mode: "pickup",
        contact: pickupContact,
        phone: pickupPhone,
        countryCode: "86",
        address: pickupAddress,
        province: parcel.pickupProvince || "",
        firstMileAmount: Number((activeOrderRate == null ? void 0 : activeOrderRate.firstMileAmount) || 0)
      } : { mode: "dropoff" };
      const submit = orderForm.querySelector("[data-order-submit]");
      const submitHtml = submit == null ? void 0 : submit.innerHTML;
      if (submit) {
        submit.disabled = true;
        submit.classList.add("is-busy");
        submit.innerHTML = '<span class="button__spinner" aria-hidden="true"></span> Running safety checks\u2026';
      }
      setOrderSubmitStatus("Confirming account approval and cargo eligibility\u2026");
      setCargoStatus("Checking this shipment with SFC\u2026");
      hideOrderSuccessGuide();
      try {
        const accountCompliance = await fetchCompliance({ baseUrl: apiBase });
        if (!(accountCompliance == null ? void 0 : accountCompliance.ok) || !isAccountApproved(accountCompliance)) {
          pendingOrderAfterCompliance = activeOrderRate;
          renderComplianceUi((accountCompliance == null ? void 0 : accountCompliance.ok) ? accountCompliance : {});
          openComplianceDialog();
          setOrderSubmitStatus(
            (accountCompliance == null ? void 0 : accountCompliance.message) || "SFC account approval is required before creating an order.",
            { error: true }
          );
          return;
        }
        const cargoCheck = await checkCargoCompliance(
          {
            shippingMethod,
            country,
            items,
            parcel: parcel || {},
            declaration: cargoValidation.declaration
          },
          { baseUrl: apiBase }
        );
        if (!cargoDecisionAllowsOrder(cargoCheck)) {
          const decision = String((cargoCheck == null ? void 0 : cargoCheck.decision) || "").toUpperCase();
          const fallback = decision === "MANUAL_REVIEW" ? "This shipment has been routed to manual review. Do not send the parcel until SFC approves it." : decision === "BLOCK" ? "The selected service cannot accept this cargo." : "SFC could not confirm cargo eligibility. No order was created.";
          setCargoStatus((cargoCheck == null ? void 0 : cargoCheck.message) || fallback, { error: true });
          setOrderSubmitStatus((cargoCheck == null ? void 0 : cargoCheck.message) || fallback, { error: true });
          return;
        }
        setCargoStatus("Cargo screening passed for the selected service.");
        if (submit) {
          submit.innerHTML = '<span class="button__spinner" aria-hidden="true"></span> Creating order\u2026';
        }
        setOrderSubmitStatus("Submitting the approved shipment to SFC\u2026");
        const data = await createSfcOrder(
          {
            shippingMethod,
            country,
            fields,
            items,
            parcel: parcel || {},
            pickup,
            cargoDeclaration: cargoValidation.declaration,
            cargoReviewId: cargoCheck.reviewId || ""
          },
          { baseUrl: apiBase }
        );
        if (data == null ? void 0 : data.ok) {
          setOrderSubmitStatus("");
          showOrderSuccessGuide(data, parcel);
          loadOrders({ page: 1, append: false });
          return;
        }
        if ((data == null ? void 0 : data.code) === "LOGIN_REQUIRED" || (data == null ? void 0 : data.code) === "BINDING_REQUIRED") {
          goToShopifyLogin();
          return;
        }
        if (String((data == null ? void 0 : data.code) || "").startsWith("ACCOUNT_REVIEW_")) {
          pendingOrderAfterCompliance = activeOrderRate;
          openComplianceDialog();
        }
        hideOrderSuccessGuide();
        setOrderSubmitStatus(
          (data == null ? void 0 : data.message) || "Unable to create the order. Please check the fields.",
          { error: true }
        );
      } catch (e) {
        hideOrderSuccessGuide();
        setOrderSubmitStatus(
          "Safety checks are unavailable. No order was created. Try again later.",
          { error: true }
        );
        setCargoStatus("Safety checks are unavailable. Shipping remains locked.", {
          error: true
        });
      } finally {
        if (submit && submitHtml != null) {
          submit.disabled = false;
          submit.classList.remove("is-busy");
          submit.innerHTML = submitHtml;
        }
      }
    });
    rateForm == null ? void 0 : rateForm.addEventListener("submit", async (event) => {
      var _a2, _b2;
      event.preventDefault();
      closeOrderPanel();
      const requestGeneration = ++rateRequestGeneration;
      const input = serializeRateForm(rateForm);
      const validation = validateRateInput({
        ...input,
        postalCode: input.zipCode
      });
      if (!validation.valid) {
        renderRateState("Check the shipment details", validation.message, {
          error: true
        });
        if (input.firstMileMode === "pickup" && !input.pickupProvince) {
          (_a2 = rateForm.querySelector("[data-pickup-province]")) == null ? void 0 : _a2.focus();
        } else {
          (_b2 = rateForm.querySelector(":invalid")) == null ? void 0 : _b2.focus();
        }
        return;
      }
      const submit = rateForm.querySelector('[type="submit"]');
      const submitHtml = submit.innerHTML;
      submit.disabled = true;
      submit.classList.add("is-busy");
      submit.innerHTML = '<span class="button__spinner" aria-hidden="true"></span> Checking rates\u2026';
      renderRateLoading();
      try {
        const response = await queryRates(input, { baseUrl: apiBase });
        if (requestGeneration !== rateRequestGeneration) return;
        if (response.ok) {
          lastParcel = input;
          renderRates(response);
          return;
        }
        renderRateState(
          response.code === "RATE_LIMIT_REACHED" || response.code === "RATE_LIMITED" ? "Too many quote requests" : "A live quote is not available",
          response.message || "Please try again or contact the SFC team.",
          { error: true }
        );
      } catch (e) {
        if (requestGeneration !== rateRequestGeneration) return;
        renderRateState(
          "SFC freight quotes are unavailable",
          "Please try again or contact the SFC team.",
          { error: true }
        );
      } finally {
        if (requestGeneration === rateRequestGeneration) {
          submit.disabled = false;
          submit.classList.remove("is-busy");
          submit.innerHTML = submitHtml;
        }
      }
    });
    function renderTrackingLoading() {
      trackingWidgetContainer.innerHTML = `
      <div class="tracking-widget-state" role="status">
        <span class="tracking-widget-spinner" aria-hidden="true"></span>
        <h3>Loading live tracking</h3>
        <p>Checking SFC tracking securely\u2026</p>
      </div>
    `;
    }
    function renderTrackingValidationError() {
      trackingWidgetContainer.innerHTML = renderTrackingFailure(
        "INTERNAL_ERROR",
        "Enter 5\u201350 letters, numbers or hyphens without spaces."
      );
    }
    async function submitTrackingLookup() {
      var _a2;
      const requestGeneration = ++trackingRequestGeneration;
      const value = trackingInput.value.trim();
      if (trackingProviderName) trackingProviderName.textContent = "SFC";
      if (!isValidTrackingNumber(value)) {
        renderTrackingValidationError();
        trackingInput.focus();
        return;
      }
      const submit = trackingForm.querySelector('[type="submit"]');
      submit.disabled = true;
      renderTrackingLoading();
      try {
        const response = await queryTracking(value, { baseUrl: apiBase });
        if (requestGeneration !== trackingRequestGeneration) return;
        if (response.ok) {
          trackingWidgetContainer.innerHTML = renderSfcTracking(
            response.result
          );
        } else if (response.code === "LOGIN_REQUIRED" || response.code === "BINDING_REQUIRED") {
          trackingWidgetContainer.innerHTML = renderTrackingFailure(
            response.code,
            response.message || (response.code === "LOGIN_REQUIRED" ? "Sign in with Shopify to track your own shipments." : "Link your SFC account before tracking shipments.")
          );
          const loginBtn = document.createElement("button");
          loginBtn.type = "button";
          loginBtn.className = "button button--primary";
          loginBtn.textContent = response.code === "LOGIN_REQUIRED" ? "Sign in" : "Link SFC account";
          loginBtn.addEventListener("click", () => goToShopifyLogin());
          (_a2 = trackingWidgetContainer.querySelector(".tracking-widget-state")) == null ? void 0 : _a2.append(loginBtn);
        } else {
          trackingWidgetContainer.innerHTML = renderTrackingFailure(
            response.code,
            response.message
          );
        }
        focusResult(trackingWidgetContainer);
      } catch (e) {
        if (requestGeneration !== trackingRequestGeneration) return;
        trackingWidgetContainer.innerHTML = renderTrackingFailure(
          "INTERNAL_ERROR"
        );
        focusResult(trackingWidgetContainer);
      } finally {
        if (requestGeneration === trackingRequestGeneration) {
          submit.disabled = false;
        }
      }
    }
    trackingForm == null ? void 0 : trackingForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitTrackingLookup();
    });
    trackingWidgetContainer == null ? void 0 : trackingWidgetContainer.addEventListener("click", (event) => {
      if (event.target.closest('[data-action="retry-tracking"]')) {
        submitTrackingLookup();
      }
    });
    for (const link of root.querySelectorAll("[data-sfc-registration]")) {
      link.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("sfc:registration-click", {
          detail: { source: "storefront_sfc_tools" }
        }));
      });
    }
    const backTopBtn = root.querySelector("[data-sfc-back-top]");
    if (backTopBtn) {
      const syncBackTop = () => {
        const show = window.scrollY > 420;
        backTopBtn.classList.toggle("is-visible", show);
        backTopBtn.hidden = !show;
      };
      syncBackTop();
      window.addEventListener("scroll", syncBackTop, { passive: true });
      backTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      });
    }
    if (currentYear) currentYear.textContent = String((/* @__PURE__ */ new Date()).getFullYear());
  }
  function initAll(scope) {
    var _a, _b;
    if ((_a = scope.matches) == null ? void 0 : _a.call(scope, "[data-sfc-tools-root]")) initSfcTools(scope);
    (_b = scope.querySelectorAll) == null ? void 0 : _b.call(scope, "[data-sfc-tools-root]").forEach(initSfcTools);
  }

  // extensions/storefront-tools/src/index.js
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initAll(document));
  } else {
    initAll(document);
  }
  document.addEventListener("shopify:section:load", (event) => initAll(event.target));
  document.addEventListener("shopify:block:load", (event) => initAll(event.target));
})();

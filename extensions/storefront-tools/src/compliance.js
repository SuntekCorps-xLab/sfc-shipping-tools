/**
 * Compliance helpers shared by the storefront UI and tests.
 *
 * These checks improve the user experience only. The SFC backend must repeat
 * every account and cargo check before it calls the order-creation API.
 */
'use strict';

export const REVIEW_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  NEEDS_MORE_INFO: 'NEEDS_MORE_INFO',
  REJECTED: 'REJECTED',
  APPROVED_GENERAL: 'APPROVED_GENERAL',
  APPROVED_DG: 'APPROVED_DG',
  SUSPENDED: 'SUSPENDED',
  EXPIRED: 'EXPIRED',
});

export const CARGO_FLAG_KEYS = Object.freeze([
  'battery',
  'liquid',
  'powder',
  'aerosol',
  'magnetic',
  'chemical',
  'food',
  'medicine',
  'cosmetics',
  'otherRestricted',
]);

export const MAX_COMPLIANCE_FILE_BYTES = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
]);

const STATUS_ALIASES = new Map([
  ['0', REVIEW_STATUS.DRAFT],
  ['1', REVIEW_STATUS.APPROVED_GENERAL],
  ['2', REVIEW_STATUS.REJECTED],
  ['3', REVIEW_STATUS.PENDING_REVIEW],
  ['4', REVIEW_STATUS.NEEDS_MORE_INFO],
  ['APPROVED', REVIEW_STATUS.APPROVED_GENERAL],
  ['GENERAL_APPROVED', REVIEW_STATUS.APPROVED_GENERAL],
  ['DG_APPROVED', REVIEW_STATUS.APPROVED_DG],
  ['PENDING', REVIEW_STATUS.PENDING_REVIEW],
]);

export function normalizeReviewStatus(data = {}) {
  const raw = String(
    data.reviewStatus ?? data.complianceStatus ?? data.auditStatus ?? '',
  )
    .trim()
    .toUpperCase();
  if (!raw) return REVIEW_STATUS.DRAFT;
  return STATUS_ALIASES.get(raw) || raw;
}

export function isAccountApproved(data = {}) {
  const status = normalizeReviewStatus(data);
  const approved =
    status === REVIEW_STATUS.APPROVED_GENERAL ||
    status === REVIEW_STATUS.APPROVED_DG;
  if (approved) return true;

  const hasExplicitStatus = [
    data.reviewStatus,
    data.complianceStatus,
    data.auditStatus,
  ].some((value) => value != null && String(value).trim() !== '');

  // `canPlaceOrders` is supported for backends that have not adopted the
  // state enum yet. An explicit non-approved state always wins so a stale
  // boolean cannot accidentally override SUSPENDED, EXPIRED, or REJECTED.
  return !hasExplicitStatus && data.canPlaceOrders === true;
}

export function complianceStatusView(data = {}) {
  const status = normalizeReviewStatus(data);
  const views = {
    [REVIEW_STATUS.DRAFT]: {
      label: data.ready ? 'Ready to submit' : 'Information required',
      tone: data.ready ? 'ready' : 'neutral',
      message: data.ready
        ? 'Your profile is complete. Submit it for SFC review before shipping.'
        : 'Complete the profile and required documents before submitting for review.',
    },
    [REVIEW_STATUS.PENDING_REVIEW]: {
      label: 'Under review',
      tone: 'pending',
      message: 'SFC is reviewing your account. Orders remain locked until approval.',
    },
    [REVIEW_STATUS.NEEDS_MORE_INFO]: {
      label: 'More information needed',
      tone: 'warning',
      message:
        data.reviewMessage ||
        'SFC needs additional or corrected information. Update the requested items and resubmit.',
    },
    [REVIEW_STATUS.REJECTED]: {
      label: 'Not approved',
      tone: 'danger',
      message:
        data.reviewMessage ||
        'This account is not approved for shipping. Contact SFC support for next steps.',
    },
    [REVIEW_STATUS.APPROVED_GENERAL]: {
      label: 'Approved for general cargo',
      tone: 'approved',
      message: 'Account review is complete. General cargo may proceed to per-shipment screening.',
    },
    [REVIEW_STATUS.APPROVED_DG]: {
      label: 'Approved for regulated cargo review',
      tone: 'approved',
      message: 'Account review is complete. Regulated cargo still requires shipment-level approval.',
    },
    [REVIEW_STATUS.SUSPENDED]: {
      label: 'Shipping suspended',
      tone: 'danger',
      message:
        data.reviewMessage ||
        'New shipments are disabled. Historical orders and tracking remain available.',
    },
    [REVIEW_STATUS.EXPIRED]: {
      label: 'Verification expired',
      tone: 'warning',
      message: 'Update your documents and submit the account for review again.',
    },
  };
  return {
    status,
    ...(views[status] || {
      label: 'Review unavailable',
      tone: 'danger',
      message: 'SFC returned an unknown review state. Shipping remains locked for safety.',
    }),
  };
}

export function validateComplianceFile(file, {maxBytes = MAX_COMPLIANCE_FILE_BYTES} = {}) {
  if (!file) return {valid: false, message: 'Choose a document to upload.'};
  if (!ALLOWED_FILE_TYPES.has(String(file.type || '').toLowerCase())) {
    return {valid: false, message: 'Use a JPG, PNG, or PDF document.'};
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return {valid: false, message: 'The selected document is empty.'};
  }
  if (file.size > maxBytes) {
    return {valid: false, message: 'Each document must be 10 MB or smaller.'};
  }
  return {valid: true};
}

export function normalizeCargoDeclaration(input = {}) {
  const flags = {};
  CARGO_FLAG_KEYS.forEach((key) => {
    flags[key] = Boolean(input.flags?.[key] ?? input[key]);
  });
  return {
    flags,
    noneOfThese: Boolean(input.noneOfThese),
    description: String(input.description ?? '').trim(),
    sdsReference: String(input.sdsReference ?? '').trim(),
    unNumber: String(input.unNumber ?? '').trim().toUpperCase(),
    dangerousGoodsClass: String(input.dangerousGoodsClass ?? '').trim(),
    declarationAccepted: Boolean(input.declarationAccepted),
  };
}

export function validateCargoDeclaration(input = {}) {
  const declaration = normalizeCargoDeclaration(input);
  const selectedFlags = CARGO_FLAG_KEYS.filter((key) => declaration.flags[key]);

  if (declaration.noneOfThese && selectedFlags.length) {
    return {
      valid: false,
      message: 'Choose either “none of these” or the applicable cargo flags, not both.',
      declaration,
    };
  }
  if (!declaration.noneOfThese && !selectedFlags.length) {
    return {
      valid: false,
      message: 'Confirm that none apply, or select every cargo characteristic that applies.',
      declaration,
    };
  }
  if (selectedFlags.length && declaration.description.length < 3) {
    return {
      valid: false,
      message: 'Describe the regulated or restricted cargo for SFC review.',
      declaration,
    };
  }
  if (!declaration.declarationAccepted) {
    return {
      valid: false,
      message: 'Confirm that the cargo declaration is complete and accurate.',
      declaration,
    };
  }
  return {
    valid: true,
    declaration,
    decisionHint: selectedFlags.length ? 'MANUAL_REVIEW' : 'ALLOW',
  };
}

export function cargoDecisionAllowsOrder(result = {}) {
  return (
    result.ok === true &&
    String(result.decision || '').toUpperCase() === 'ALLOW' &&
    String(result.reviewId || '').trim().length > 0
  );
}

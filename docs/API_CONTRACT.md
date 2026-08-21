# Storefront App Proxy API contract

This document defines the public contract expected by the theme extension. It does not describe SFC's private upstream API.

All routes are relative to the Shopify App Proxy base path, normally `/apps/sfc-tools`.

## Common controls

The backend must verify the Shopify App Proxy signature before handling any route. Protected routes must also require a signed-in Shopify customer and resolve the customer-to-SFC-account mapping on the server.

Never accept an SFC account ID, customer ID, price tier, approval state, or ownership claim from the browser as authoritative.

Recommended JSON envelope:

```json
{
  "ok": false,
  "code": "STABLE_MACHINE_CODE",
  "message": "Safe message for the customer",
  "requestId": "opaque-correlation-id"
}
```

Use generic public errors. Keep upstream payloads, stack traces, credentials, document paths, and policy reasons out of storefront responses.

## Public and authenticated routes

| Route | Authentication | Purpose |
| --- | --- | --- |
| `POST /rates` | Policy-dependent | Public list prices or authenticated account prices |
| `POST /tracking` | Required for account-bound data | Tracking authorized to the resolved SFC account |
| `POST /account-link` | Shopify customer required | Resolve or begin an approved account-link flow |
| `GET /balance` | Required | Account balance |
| `GET /orders` | Required | Paginated orders owned by the account |
| `POST /order-fields` | Required | Channel-specific order requirements |
| `GET /compliance` | Required | Profile completeness and review state |
| `POST /compliance-account-class` | Required | Set personal or enterprise profile type |
| `POST /compliance-profile` | Required | Save verification profile fields |
| `POST /compliance-upload` | Required | Upload a private verification document |
| `POST /compliance-submit` | Required | Submit a complete profile for review |
| `POST /cargo-compliance` | Required | Evaluate one shipment declaration |
| `POST /create-order` | Required | Create an order after repeating every gate |
| `POST /domestic-tracking` | Required | Bind a domestic tracking number to an owned order |
| `POST /label` | Required | Return a label for an owned order |

## Account review

`POST /account-link` must derive the Shopify customer from the verified App
Proxy request. The request body is intentionally empty. Do not link an SFC
account merely because an email string supplied by the browser matches; use a
verified ownership or approved invitation flow and record the linkage event.

`GET /compliance` should return:

```json
{
  "ok": true,
  "ready": true,
  "reviewStatus": "PENDING_REVIEW",
  "canPlaceOrders": false,
  "reviewMessage": "Optional customer-safe guidance"
}
```

Supported states:

- `DRAFT`
- `PENDING_REVIEW`
- `NEEDS_MORE_INFO`
- `REJECTED`
- `APPROVED_GENERAL`
- `APPROVED_DG`
- `SUSPENDED`
- `EXPIRED`

Unknown states must fail closed. `ready` only means the profile can be submitted; it must never authorize order creation.

## Cargo screening

`POST /cargo-compliance` receives the selected service, destination, parcel summary, customs items, and the customer declaration. A successful response is one of:

```json
{"ok": true, "decision": "ALLOW", "reviewId": "opaque-id"}
```

```json
{"ok": true, "decision": "MANUAL_REVIEW", "reviewId": "opaque-id", "message": "Await SFC approval before shipping."}
```

```json
{"ok": true, "decision": "BLOCK", "message": "This service cannot accept the declared cargo."}
```

Only an explicit `ok: true` plus `decision: ALLOW` and a non-empty `reviewId` may proceed in the UI. Timeouts, malformed responses, and unknown decisions must block creation.

The backend must not treat a prior `reviewId` as permanent authorization. `POST /create-order` must repeat or atomically consume the cargo decision and verify that the screened payload has not changed.

## Stable error codes

At minimum, keep the following stable for clients:

- `LOGIN_REQUIRED`
- `BINDING_REQUIRED`
- `ACCOUNT_REVIEW_REQUIRED`
- `ACCOUNT_REVIEW_PENDING`
- `ACCOUNT_REVIEW_REJECTED`
- `ACCOUNT_SUSPENDED`
- `CARGO_DECLARATION_REQUIRED`
- `CARGO_COMPLIANCE_REVIEW_REQUIRED`
- `DANGEROUS_GOODS_NOT_ALLOWED`
- `PROHIBITED_ITEM`
- `CHANNEL_RESTRICTED`
- `RATE_LIMITED`

## File handling

The browser allows JPG, PNG, and PDF up to 10 MB for usability. The server must independently enforce size, validate magic bytes rather than extensions alone, scan for malware, randomize stored names, keep files private, check ownership on retrieval, encrypt at rest, log access, and apply a retention/deletion policy.

## Order creation invariants

Before the upstream SFC create-order call, the backend must confirm in one protected operation:

1. Valid App Proxy signature and current signed-in customer.
2. Active customer-to-SFC mapping.
3. Account state permits shipping.
4. Customer owns the selected price/channel entitlement.
5. Cargo declaration is complete and the selected channel returns `ALLOW`.
6. Address, customs, value, weight, and channel fields are valid.
7. Idempotency prevents duplicate orders after retries.

Log the policy decision, rule/version identifier, actor, request ID, and timestamps without logging sensitive documents or secrets.

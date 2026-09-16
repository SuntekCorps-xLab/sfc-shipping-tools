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
| `GET /compliance-file` | Required + ownership-checked | Retrieve an uploaded verification document |
| `POST /compliance-submit` | Required | Submit a complete profile for review |
| `POST /cargo-compliance` | Required | Evaluate one shipment declaration |
| `POST /create-order` | Required | Create an order after repeating every gate |
| `POST /domestic-tracking` | Required | Bind a domestic tracking number to an owned order |
| `POST /label` | Required | Return a label for an owned order |
| `POST /event` | Optional | Best-effort storefront analytics; ignored when disabled |

## Route reference

Request and response shapes for each route, derived from what the storefront
client actually sends and reads. All responses use the common envelope from
[Common controls](#common-controls): a failure is `{"ok": false, "code", "message"}`
with a stable `code` from [Stable error codes](#stable-error-codes). Optional
fields may be omitted or `null`; the client renders them defensively.
`tests/e2e/storefront.spec.js` encodes executable examples for `/rates`,
`/balance`, and `/account-link`.

Routes already specified elsewhere are cross-referenced rather than repeated:
`GET /compliance` (Account review), `POST /cargo-compliance` (Cargo screening),
`GET /compliance-file` (File handling), `POST /event` (Analytics).

### POST /rates

Request:

```json
{
  "country": "US",
  "state": "CA",
  "city": "Los Angeles",
  "zipCode": "90001",
  "weight": 2,
  "length": 20,
  "width": 15,
  "height": 10
}
```

The client uppercases `country` and `zipCode`; `weight` is kg and each dimension
is cm, sent as numbers.

Success:

```json
{
  "ok": true,
  "rates": [
    {
      "serviceCode": "SFC-FAST",
      "serviceName": "SFC Fast",
      "amount": 120,
      "currency": "RMB",
      "transitTime": "5-8 days",
      "amountUsd": 16.8
    }
  ]
}
```

`amount` may be `null` when a price is unavailable; the UI then hides the order
CTA for that rate. `serviceName`, `transitTime`, and `amountUsd` are optional —
`amountUsd` drives an approximate USD display only and is never authoritative.

### POST /tracking

Request:

```json
{ "trackingNumber": "SF123456789" }
```

Success — the tracking payload is nested under `result`, not at the top level:

```json
{
  "ok": true,
  "result": {
    "status": "In transit",
    "trackingNumber": "SF123456789",
    "orderCode": "SFC-ORDER-1",
    "shippingChannel": "SFC Fast",
    "destination": "United States",
    "latestUpdate": "2026-09-01 10:00",
    "hasEvents": true,
    "events": [
      { "time": "2026-09-01 10:00", "description": "Departed facility", "location": "Shenzhen" }
    ]
  }
}
```

The client renders `response.result`. Within `result`, `orderCode`,
`shippingChannel`, `destination`, `latestUpdate`, and each event's `location`
are optional. `LOGIN_REQUIRED` and `BINDING_REQUIRED` failures drive a sign-in /
link prompt.

### POST /account-link

Request: `{}` (intentionally empty). Success:

```json
{ "ok": true }
```

The client only checks `ok`. See [Account review](#account-review) for the
linking rules.

### GET /balance

No request body. Success:

```json
{
  "ok": true,
  "balance": 100,
  "currency": "RMB",
  "balanceUsd": 14.0,
  "userCode": "SFC12345"
}
```

`balance` must be numeric — the client renders `Number(balance).toFixed(2)`, so
a non-numeric or missing value shows `NaN`. `balanceUsd` and `userCode` are
optional. A `BINDING_REQUIRED` failure is handled specially to show a linking
state rather than an error.

### GET /orders

Query string: `?page=1&pageSize=20`. Success:

```json
{
  "ok": true,
  "page": 1,
  "haveNext": true,
  "total": 42,
  "orders": [
    {
      "orderCode": "SFC-ORDER-1",
      "sfcOrderCode": "SFC-ORDER-1",
      "customerOrderNo": "CUST-1",
      "domesticTrackingNo": "",
      "shippingMethod": "SFC Fast",
      "country": "US",
      "countryName": "United States",
      "addTime": "2026-09-01 10:00",
      "status": "Shipped",
      "trackingNumber": "SF123456789"
    }
  ]
}
```

`page`, `haveNext`, and `total` drive pagination and the result count. Within
each order, only `orderCode` is relied on directly; the remaining fields are
optional and rendered defensively.

### POST /order-fields

Request:

```json
{ "shippingMethod": "SFC-FAST", "country": "US" }
```

Success:

```json
{
  "ok": true,
  "hasConfigure": true,
  "fields": [
    {
      "key": "recipientName",
      "group": "recipient",
      "label": "Recipient name",
      "required": true,
      "visible": true,
      "inputType": "text"
    }
  ],
  "stateList": [{ "state": "California", "state_code": "CA" }],
  "cityList": [{ "city": "Los Angeles", "city_code": "LAX" }],
  "defaultShipper": { "recipientName": "Acme Co", "phone": "+1 555 0100" }
}
```

`fields` must be an array; each entry uses `key`, `group`, `label`, `required`,
`visible`, and `inputType`. If `ok` is false or `fields` is missing, the client
falls back to a built-in standard form. `hasConfigure: false` means the channel
has no special field rules. `stateList` (`{state, state_code}`) and `cityList`
(`{city, city_code}`) optionally populate the recipient state / city dropdowns,
and `defaultShipper` is an optional map of field key to value used to prefill the
shipper fields; all three are optional. This route returns field definitions for
the client to render — it does not save any shipment data.

### POST /compliance-account-class

Request:

```json
{ "accountClass": "personal" }
```

`accountClass` is `personal` or `enterprise`. Success: `{ "ok": true }` with an
optional `message`.

### POST /compliance-profile

Request:

```json
{ "trueName": "", "company": "", "creditId": "", "cardId": "" }
```

The client trims each field and sends empty strings as-is; the server decides
completeness. Success: `{ "ok": true }` with an optional `message`.

### POST /compliance-upload

`multipart/form-data` with two parts: `kind` (string) and `file` (binary).
Success: `{ "ok": true }` with an optional `message`. See
[File handling](#file-handling) for the server-side validation rules.

### POST /compliance-submit

Request: `{}`. Success: `{ "ok": true }` together with the compliance state
fields described in [Account review](#account-review).

### POST /create-order

Request: the full order payload assembled by the client (shipping method,
destination, parcel, customs items, declarations, and channel-specific fields).
Success:

```json
{
  "ok": true,
  "orderCode": "SFC-ORDER-1",
  "customerOrderNo": "CUST-1",
  "trackingNumber": "SF123456789"
}
```

`customerOrderNo` and `trackingNumber` are optional. The server must repeat
every gate in [Order creation invariants](#order-creation-invariants); failures
use the common envelope with a stable `code`.

### POST /domestic-tracking

Request:

```json
{ "orderCode": "SFC-ORDER-1", "domesticTrackingNo": "SF987654321" }
```

Success:

```json
{ "ok": true, "domesticTrackingNo": "SF987654321" }
```

The client uses the returned `domesticTrackingNo` when present and otherwise
falls back to the value it sent.

### POST /label

Request:

```json
{ "orderCode": "SFC-ORDER-1" }
```

Success:

```json
{
  "ok": true,
  "labelData": "<base64-encoded PDF>",
  "fileName": "SFC-ORDER-1-label.pdf",
  "orderCode": "SFC-ORDER-1"
}
```

`labelData` is a base64-encoded PDF. `fileName` and `orderCode` are optional;
the client falls back to `<orderCode>-label.pdf`. When a label is not ready yet,
return `ok: false` with a customer-safe `message`.

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

`GET /compliance-file?file=<handle>` is the retrieval entry point the storefront uses to preview an uploaded document (rendered as an `<a href>` / `<img src>`). The `file` value must be an opaque, server-issued handle, never a storage path or client-controlled filename; treat any path-like or traversal value as invalid. On every request the server must verify the App Proxy signature, resolve the current signed-in customer, and confirm that customer owns the referenced document before returning bytes. A missing, unknown, or not-owned handle must fail closed with a generic error and no document content.

## Analytics

`POST /event` is an optional, best-effort analytics sink. The storefront only calls it when analytics is explicitly enabled (`data-analytics="on"` on the root node or `SFC_ANALYTICS`); it is off by default, and client-side failures are silently ignored. It is not part of any authorization, account-review, or cargo-screening decision, and the backend must never treat an `/event` payload as trusted input.

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

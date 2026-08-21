# Deployment checklist

Use a Shopify development store and non-production SFC credentials until acceptance testing is complete.

## Before deployment

- Create local configuration from the tracked `*.example.toml` files.
- Store Shopify and SFC secrets outside Git.
- Configure HTTPS, App Proxy signature validation, session storage, and least-privilege access.
- Implement the full contract in `API_CONTRACT.md`.
- Configure private document storage, malware scanning, retention, and reviewer permissions.
- Configure server rate limits for both anonymous and authenticated traffic.
- Run `npm ci` and `npm run check`.
- Run a secret scanner against the complete Git history.

## Acceptance cases

- Anonymous user cannot access private prices, balance, orders, labels, or documents.
- One customer cannot query another customer's tracking, orders, or labels.
- Complete but unreviewed profiles cannot create orders.
- Pending, rejected, suspended, expired, and unknown states cannot create orders.
- General cargo with a valid declaration can proceed only after a server `ALLOW`.
- Flagged cargo is routed to review or blocked according to server policy.
- A changed shipment invalidates any earlier cargo decision.
- Backend timeout or malformed policy response creates no order.
- Duplicate submissions do not create duplicate upstream orders.
- Logs contain request IDs and decisions but no credentials or identity documents.

The repository browser suite verifies public-rate rendering, client-side
tracking validation, and the pending-review order lock. A production release
must additionally run the acceptance cases above against a Shopify development
store and a non-production backend.

## Release procedure

1. Merge only after CI passes and security-sensitive changes receive review.
2. Deploy the app backend before a storefront bundle that depends on new routes.
3. Deploy the theme app extension to a development theme.
4. Complete the acceptance cases above.
5. Promote using Shopify's normal app/theme release process.
6. Monitor authentication failures, policy errors, order failures, latency, and abuse signals.
7. Keep a tested rollback version for both backend and extension.

Production resource identifiers and operational runbooks belong in a private operations repository, not here.

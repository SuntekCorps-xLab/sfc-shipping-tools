# Account verification and shipment safety

This project uses two separate gates. Both are required for order creation.

## Gate 1: customer account review

The customer signs in through Shopify Customer Accounts, links an SFC identity, selects a personal or enterprise profile, supplies required fields and private documents, and submits the profile to SFC.

Profile completeness is not approval. The backend owns the review state, and the storefront only displays it.

| State | New orders | Customer action |
| --- | --- | --- |
| `DRAFT` | Blocked | Complete profile and documents |
| `PENDING_REVIEW` | Blocked | Wait for review |
| `NEEDS_MORE_INFO` | Blocked | Correct and resubmit |
| `REJECTED` | Blocked | Contact SFC if appropriate |
| `APPROVED_GENERAL` | Cargo screening required | Declare each shipment |
| `APPROVED_DG` | Cargo screening required | Declare each shipment; approval is still route-specific |
| `SUSPENDED` | Blocked | Contact SFC |
| `EXPIRED` | Blocked | Renew documents and resubmit |

Unknown or unavailable states are blocked.

Recommended reviewer controls include separation of duties, least-privilege roles, immutable audit events, reason codes, re-review dates, document expiry, sanctions/watchlist procedures where legally required, and an appeal or correction path.

## Gate 2: per-shipment cargo screening

Every shipment requires an explicit declaration. The customer must either select all applicable cargo characteristics or attest that none apply. Flagged examples include batteries, liquids, powders, aerosols, magnets, chemicals, food, medicines, cosmetics, and other regulated goods.

The declaration is input to policy; it is not a guarantee of acceptance. The server evaluates the actual destination, channel, customs items, package data, account authorization, and current carrier restrictions.

Decisions:

- `ALLOW`: the exact screened payload may proceed.
- `MANUAL_REVIEW`: no order is created until a reviewer approves it.
- `BLOCK`: the selected service cannot accept it.
- Timeout, error, or unknown: fail closed.

## Required production controls

- Repeat all gates on the server during order creation.
- Bind cargo decisions to a hash of the screened shipment payload and expire them.
- Prevent changes after approval or require re-screening after any change.
- Support route-specific policies and version every rule decision.
- Do not claim that account approval authorizes all dangerous goods.
- Keep identity files in private object storage; do not expose raw storage paths.
- Enforce malware scanning, access logs, retention, correction, and deletion workflows.
- Provide trained human review for ambiguous, regulated, dangerous, sanctioned, or high-risk cases.
- Retain evidence and decision history according to applicable law and contractual requirements.

This repository supplies client-side workflow and validation only. It is not a substitute for legal advice, carrier acceptance rules, dangerous-goods training, sanctions controls, or backend enforcement.

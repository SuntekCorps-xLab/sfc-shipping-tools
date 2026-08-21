# Security policy

## Supported version

Security fixes are applied to the latest commit on `main`. Older forks and
deployed theme assets are not automatically updated.

## Report a vulnerability

Do not open a public issue for vulnerabilities, leaked credentials, customer
data exposure, authorization bypasses, dangerous-goods screening bypasses, or
App Proxy signature failures.

Use GitHub's **Security > Report a vulnerability** workflow. If private
reporting is unavailable, contact SFC through the official support channel
listed on `sendfromchina.com` and include the repository name, affected
version, reproduction steps, and impact. Do not include real customer identity
documents or production tokens in the report.

## Security boundary

This repository contains a storefront client and Shopify application shell.
It does not contain the hosted SFC business backend. A production backend must:

- verify every Shopify App Proxy signature and trusted customer identifier;
- enforce account approval at `create-order`, not only in the browser;
- repeat shipment-level cargo screening and bind the result to the order;
- validate uploaded content by size, signature, MIME type, malware scan, and
  authenticated ownership;
- store identity documents outside public theme assets with encryption,
  access logs, retention limits, and deletion controls;
- never log full tokens, identity numbers, document URLs, or cargo documents.

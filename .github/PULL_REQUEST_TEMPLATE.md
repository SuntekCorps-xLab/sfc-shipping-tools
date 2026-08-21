## Summary

Describe the customer-visible change and why it is needed.

## Security and data impact

- [ ] No credentials, production identifiers, customer data, or identity documents are included.
- [ ] App Proxy identity and tenant ownership remain server-enforced.
- [ ] Account-review and cargo-screening paths still fail closed.
- [ ] New or changed API fields are documented in `docs/API_CONTRACT.md`.

## Verification

- [ ] `npm run check`
- [ ] `npm audit --audit-level=high`
- [ ] Browser tests cover the changed customer flow, or the PR explains why not.

# Contributing

Thank you for improving SFC Shipping Tools.

## Development workflow

1. Fork the repository and create a focused branch.
2. Copy `.env.example` to `.env` and use development-only values.
3. Copy `shopify.app.example.toml` and `shopify.theme.example.toml` only when
   Shopify CLI development is required.
4. Install with `npm ci` and run `npx playwright install chromium` once.
5. Run `npm run check` before opening a pull request.

Never commit an SFC credential, Shopify App secret, Admin API token, customer
document, production store configuration, or real tracking/order data.

## Pull requests

- Explain the user-visible behavior and security impact.
- Add tests for new API helpers, compliance states, and validation rules.
- Add or update Playwright coverage for customer-visible workflows.
- Keep the hosted-backend boundary explicit; browser checks are never a
  replacement for server authorization.
- Do not weaken fail-closed behavior for account or cargo screening.

By submitting a contribution, you agree that it is licensed under Apache-2.0.

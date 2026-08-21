# Storefront source

Edit modules here, then:

```bash
npm run build:storefront
```

| File | Role |
|------|------|
| `api.js` | App Proxy client (`/apps/sfc-tools/*`) |
| `compliance.js` | Account-review and shipment-declaration state helpers |
| `rates.js` | Validation, first-mile estimate, tracking HTML |
| `dom.js` | Shared safe DOM construction helpers |
| `rate-ui.js` | Rate-result rendering and interactions |
| `orders.js` | Label PDF helpers |
| `analytics.js` | Optional events (off unless `data-analytics="on"`) |
| `select.js` | Custom select UI |
| `main.js` | Page bootstrap / DOM wiring |
| `index.js` | Bundle entry |

Theme loads the built `../assets/sfc-tools.js` only.

Client checks are for user experience. The backend must repeat authorization,
account approval, cargo eligibility, ownership, and input validation before
calling any upstream SFC operation.

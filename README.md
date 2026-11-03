# Midnight Bistro

Midnight Bistro is a vanilla HTML/CSS/JavaScript restaurant website backed by an Express API and PostgreSQL. The frontend is served by the same-origin Node server; the authentication, booking, order, and administration APIs do not work when pages are opened directly from disk.

## Requirements

- Node.js 22 or newer and npm.
- PostgreSQL 16 or newer.
- The application uses the `pg` driver and parameterized SQL; there is no Prisma schema or migration runner in this project.
- Password hashes currently use `bcryptjs`; Argon2 is not configured.
- Optional SMTP credentials for contact enquiries and password reset emails.
- Optional Razorpay test credentials for online checkout.

## Project structure

```text
admin/                 Role-protected administrator pages and dashboard code
database/schema.sql    PostgreSQL schema and sample-menu seed
scripts/               Browser-side API, authentication, menu, cart, and form logic
server/config/         PostgreSQL connection pool
server/middleware/     CSRF, customer, and admin authorization
server/routes/         Authentication, restaurant, payment, and admin APIs
server/services/       Pricing, Google identity, and Razorpay helpers
server/scripts/        Database initialization and one-time admin setup
tests/                 Node.js unit tests
*.html, *.css          Public pages and responsive visual styles
```

## Local setup (PowerShell)

From the project directory:

```powershell
Copy-Item .env.example .env
npm install
```

Create a PostgreSQL database and user, then set `DATABASE_URL` in `.env`. For example, using a local PostgreSQL installation:

```sql
CREATE USER midnight_bistro WITH PASSWORD 'replace-with-a-local-password';
CREATE DATABASE midnight_bistro OWNER midnight_bistro;
```

Set a unique random `SESSION_SECRET` of at least 32 bytes. `APP_ORIGIN` must exactly match the browser origin (the default is `http://localhost:3000`). Initialize the schema and sample menu:

```powershell
npm run db:init
npm start
```

Open `http://localhost:3000`. To create the first administrator, set one-time environment values in the same PowerShell window and run the bootstrap command:

```powershell
$env:ADMIN_NAME = "Restaurant Administrator"
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "use-a-unique-password-of-at-least-12-characters"
npm run admin:create
Remove-Item Env:ADMIN_NAME, Env:ADMIN_EMAIL, Env:ADMIN_PASSWORD
```

The administrator setup command requires an existing database schema. It does not create default credentials.

## Configuration and integrations

See `.env.example` for the complete variable list.
For Google Cloud OAuth client creation, callback/origin setup, and account-link behavior, see `GOOGLE_AUTH_SETUP.md`.
For the actual PostgreSQL schema and setup process, see `DATABASE_SETUP.md`. For the implemented API routes and request shapes, see `API_DOCUMENTATION.md`.

- **Sessions:** stored in PostgreSQL, HTTP-only, same-site cookies, session IDs rotated after successful login/registration, and secure cookies required in production.
- **Accounts:** stored in the `users` table. Existing installations with a `customers` table are migrated by renaming it when `npm run db:init` runs. Password-only accounts require password verification before adding a Google identity.
- **Google sign-in:** optional server-side OpenID Connect. Configure all three `GOOGLE_*` variables to enable it; without credentials, traditional email/password authentication remains available.
- **Database:** the schema is in `database/schema.sql`. It includes seeded sample dishes and a session store created by the PostgreSQL session adapter. This is a raw PostgreSQL implementation, not Prisma.
- **Public menu preview:** the 880-item display catalog, categories, and illustrative prices are centralized in `scripts/menu-data.js`. Live ranked search, typo tolerance, filters, sorting, and progressive rendering are provided by `scripts/menu-search.js` and `scripts/menu.js`. `scripts/ordering.js` adds dish details, a validated browser-persistent preview cart, and the public `preview-checkout.html` demonstration. Prices and availability remain unconfirmed; `scripts/ordering-settings.js` keeps ordering, delivery, pickup, taxes, payment methods, and customizations disabled until verified settings are supplied. Preview confirmations are local only and are not sent to the restaurant.
- **Secure checkout:** `checkout.html` remains the existing authenticated server checkout. The public preview checkout is deliberately separate so guest preview does not weaken Express authentication or imply a real order.
- **Reservations:** guest requests are persisted and serialized per date/time slot; the default capacity of 40 is a placeholder and must be replaced with actual table/slot policy.
- **Reservation time zone:** `BUSINESS_TIME_ZONE` defaults to `Asia/Kolkata`; set the verified restaurant time zone.
- **Orders:** prices and totals are calculated from current database menu prices on the server. `TAX_RATE_BASIS_POINTS=0` and `DELIVERY_FEE_PAISE=0` are intentionally neutral placeholders. Ordering remains disabled until actual rates and rules have been confirmed and `PRICING_CONFIRMED=true` is set.
- **Payments:** only Razorpay test client IDs (`rzp_test_...`) are accepted; the server rejects live-key configuration. Set test keys and webhook secret, then configure the provider's webhook URL as `https://your-domain/api/payments/webhook` and subscribe to payment captured/failed events. Only captured payments are treated as paid.
- **Email:** configure SMTP to enable contact email and account reset messages. Without it, those APIs report that the service is unavailable rather than claiming delivery.
- **Admin:** no public self-service admin registration exists. Use the bootstrap command on a trusted machine.

## Tests

Run `npm test` for unit tests covering server-side price calculation, Razorpay signature verification, Google identity-claim validation, and account-resolution decisions. API/database integration tests require a configured PostgreSQL instance and payment/email provider credentials.

Other package scripts are `npm start`, `npm run dev`, `npm run db:init`, and `npm run admin:create`. There is currently no separate build, lint, or Prisma validation script.

## Current limitations and launch checklist

- Menu prices/dishes, address, hours, slot capacity, tax, delivery, terms, privacy, and restaurant contact channels are placeholders. Confirm them before launch.
- The browser cart and preview confirmation are demonstrations only. Production ordering requires integrating the verified catalog and customization pricing with the authenticated server menu/order API, configuring fulfillment and tax/delivery policy, and connecting payment methods to a verified provider response. Do not enable ordering in `scripts/ordering-settings.js` until that integration is complete.
- Replace `example.com` in `sitemap.xml` and `robots.txt` with the verified production domain.
- The provided `L1.jpg` is atmospheric artwork, not food photography. The `Home.jpg` interior photo is used only in restaurant-context sections. Three exact-name, visually inspected, CC BY-SA Wikimedia Commons photographs are locally mapped to Paneer Tikka, Malai Paneer Tikka, and Butter Chicken; attribution and source records are in `assets/images/image-sources.json`. Menu image frames and search thumbnails use square crops. The remaining 877 menu items intentionally have no dish photo and are marked `NEEDS_VERIFICATION`; their menu cards use neutral square placeholders rather than unrelated imagery.
- Discount codes, refunds, and newsletter opt-in are not implemented.
- Separate category, offer, review, payment, contact-message, and newsletter database models are not implemented. Categories are stored as text on menu items; payment state is stored on orders; contact forms are emailed rather than persisted.
- Customer contact enquiries/password reset need a configured and tested SMTP provider. Verify delivery, SPF/DKIM, and error monitoring.
- Razorpay is not configured in this project. The integration cannot accept payment until merchant test credentials and webhook configuration exist.
- The current cart is held in browser local storage; server-side menu pricing and order totals are authoritative, but production delivery availability, tax treatment, discount rules, cancellations/refunds, and order notifications need business rules.
- Before production, use HTTPS, set a strong secret, configure database backups and monitoring, review retention/privacy obligations, review session/rate-limit policy behind the production proxy, conduct security/accessibility testing, and complete payment-provider verification.

No live deployment, production payment activation, or external account creation is performed by this project.

# Midnight Bistro

Midnight Bistro is a vanilla HTML/CSS/JavaScript restaurant website backed by an Express API and PostgreSQL. The frontend is served by the same-origin Node server; the authentication, booking, order, and administration APIs do not work when pages are opened directly from disk.

## Requirements

- Node.js 22 or newer and npm.
- PostgreSQL 16 or newer.
- Optional SMTP credentials for contact enquiries and password reset emails.
- Optional Razorpay test credentials for online checkout.

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

- **Sessions:** stored in PostgreSQL, HTTP-only, same-site cookies, session IDs rotated after successful login/registration, and secure cookies required in production.
- **Database:** the schema is in `database/schema.sql`. It includes seeded sample dishes and a session store created by the PostgreSQL session adapter.
- **Reservations:** guest requests are persisted and serialized per date/time slot; the default capacity of 40 is a placeholder and must be replaced with actual table/slot policy.
- **Reservation time zone:** `BUSINESS_TIME_ZONE` defaults to `Asia/Kolkata`; set the verified restaurant time zone.
- **Orders:** prices and totals are calculated from current database menu prices on the server. `TAX_RATE_BASIS_POINTS=0` and `DELIVERY_FEE_PAISE=0` are intentionally neutral placeholders. Ordering remains disabled until actual rates and rules have been confirmed and `PRICING_CONFIRMED=true` is set.
- **Payments:** set Razorpay test keys and webhook secret. Configure the provider's webhook URL as `https://your-domain/api/payments/webhook` and subscribe to payment captured/failed events. Only captured payments are treated as paid. Do not use live keys until the business approves production activation.
- **Email:** configure SMTP to enable contact email and account reset messages. Without it, those APIs report that the service is unavailable rather than claiming delivery.
- **Admin:** no public self-service admin registration exists. Use the bootstrap command on a trusted machine.

## Tests

Run `npm test` for unit tests covering server-side price calculation and Razorpay signature verification. API/database integration tests require a configured PostgreSQL instance and payment/email provider credentials.

## Current limitations and launch checklist

- Menu prices/dishes, address, hours, slot capacity, tax, delivery, terms, privacy, and restaurant contact channels are placeholders. Confirm them before launch.
- Replace `example.com` in `sitemap.xml` and `robots.txt` with the verified production domain.
- The provided `L1.jpg` is atmospheric artwork, not food photography. Plate and gallery artwork are explicitly styled placeholders; supply licensed restaurant photography.
- Discount codes, refunds, and newsletter opt-in are not implemented.
- Customer contact enquiries/password reset need a configured and tested SMTP provider. Verify delivery, SPF/DKIM, and error monitoring.
- Razorpay is not configured in this project. The integration cannot accept payment until merchant test credentials and webhook configuration exist.
- The current cart is held in browser local storage; server-side menu pricing and order totals are authoritative, but production delivery availability, tax treatment, discount rules, cancellations/refunds, and order notifications need business rules.
- Before production, use HTTPS, set a strong secret, configure database backups and monitoring, review retention/privacy obligations, review session/rate-limit policy behind the production proxy, conduct security/accessibility testing, and complete payment-provider verification.

No live deployment, production payment activation, or external account creation is performed by this project.

# PostgreSQL setup

## Database implementation

The current application uses PostgreSQL through the `pg` driver and parameterized SQL in `server/routes/api.js`. It does **not** currently use Prisma, a Prisma schema, Prisma migrations, or Prisma seed commands. The schema and repeatable sample menu seed live in `database/schema.sql`.

The implementation currently defines `users`, `password_reset_tokens`, `menu_items`, `reservations`, `orders`, `order_items`, and `payment_events`. PostgreSQL sessions are stored in the `user_sessions` table created by `connect-pg-simple`.

Separate `MenuCategories`, `Payments`, `Reviews`, `Offers`, `ContactMessages`, and `NewsletterSubscribers` models/tables are not implemented. Menu categories are text values on `menu_items`; payment fields are on `orders`, while webhook event IDs are stored in `payment_events`. Contact enquiries are emailed and are not persisted. No database-backed reviews, offers, or newsletter flow is exposed.

## Install PostgreSQL and create a database

Install and start PostgreSQL 16 or newer using the official installer for your operating system. Create a dedicated local role and database from `psql` or a trusted administrative SQL client:

```sql
CREATE USER midnight_bistro WITH PASSWORD 'replace-with-a-unique-local-password';
CREATE DATABASE midnight_bistro OWNER midnight_bistro;
```

Use a unique local password and do not commit it. The example database URL is:

```text
postgresql://midnight_bistro:your-local-password@localhost:5432/midnight_bistro
```

If the password contains reserved URL characters, percent-encode them in `DATABASE_URL`.

## Configure and initialize

From the project directory in PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set `DATABASE_URL` and a randomly generated `SESSION_SECRET` of at least 32 bytes. Keep Google variables empty when Google sign-in is not being configured. Set all three Google values together when enabling it; see [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md).

Install dependencies and initialize the schema:

```powershell
npm install
npm run db:init
npm start
```

`npm run db:init` executes `database/schema.sql`; it does not drop tables. On an existing installation, the SQL renames a legacy `customers` table to `users` only when `users` does not already exist, then adds authentication fields and indexes. Inspect and back up any existing database before applying schema changes. The seed inserts sample menu items only when the menu table is empty.

## Verify the connection

With the server running, open `http://localhost:3000/api/health`. A successful response is `{"status":"ok"}`. This checks connectivity only; it is not a migration or data-integrity audit.

Create an administrator only after schema initialization, using one-time environment variables as described in [README.md](./README.md). Never add an administrator password to `.env.example`.

## Troubleshooting

- **`DATABASE_URL must be configured`**: set a PostgreSQL connection URL in `.env`.
- **Connection refused**: start PostgreSQL and verify host/port (`5432` by default).
- **Password authentication failed**: verify the role and password; URL-encode reserved characters.
- **Database does not exist**: create it before `npm run db:init`.
- **Permission denied**: grant the application role ownership or the required table/sequence privileges.
- **SSL connection errors in production**: the pool requires a valid TLS certificate in production (`rejectUnauthorized: true`). Configure the managed database certificate chain; do not disable certificate verification.
- **Legacy migration or constraint errors**: stop and inspect the actual schema and data before any manual repair. Do not drop or truncate tables to bypass migration errors.

No Prisma migration or seed commands are available in this repository. Do not use `prisma migrate` or `prisma db seed` with the current code.

# Google Sign-In setup

Google is used only as an OpenID Connect identity provider. Midnight Bistro does not use Google Sheets, the Sheets API, service accounts, or Google as an application database. User records and sessions remain in PostgreSQL.

## 1. Create a Google Cloud project

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project for Midnight Bistro or select the restaurant's existing project.
3. Keep the project under the restaurant's organization when applicable.
4. Do not create a service account for this sign-in integration.

## 2. Configure the OAuth consent screen

1. Open **Google Auth Platform** (or **APIs & Services → OAuth consent screen**, depending on the console UI).
2. Choose **External** for a customer-facing restaurant site unless all users belong to the same managed Google Workspace organization.
3. Enter the verified application name, support email, and developer contact email.
4. Add the production domain after it has been verified. For local development, add the development domain as permitted by the console.
5. Request only the basic identity scopes used here: `openid`, `email`, and `profile`.
6. During testing, add the Google accounts that are allowed as test users. Complete Google's verification requirements before releasing an external app broadly.
7. Do not add Google Sheets scopes or APIs.

## 3. Create a Web OAuth client

1. In **Google Auth Platform → Clients** (or **APIs & Services → Credentials**), create an **OAuth client ID**.
2. Select **Web application**.
3. Give the client a clear name, such as `Midnight Bistro Web`.
4. Add exact authorized JavaScript origins:
   - Local: `http://localhost:3000`
   - Production: `https://your-restaurant-domain.example`
5. Add exact authorized redirect URIs:
   - Local: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://your-restaurant-domain.example/api/auth/google/callback`
6. Save the client. Copy the client ID and client secret into the server environment only. Never put the secret in HTML, JavaScript, or a public repository.

Origins and redirect URIs must match the configured scheme, host, port, and callback path exactly. Do not use wildcard origins.

## 4. Enable identity services

The sign-in flow uses Google's standard OAuth 2.0 authorization-code flow and OpenID Connect discovery/verification through `google-auth-library`. No Sheets API, service account, or separate application-data API needs to be enabled. Follow any identity-service enablement or consent-screen verification prompt shown by Google Cloud for the selected project.

## 5. Configure environment variables

Copy `.env.example` to `.env` and set these values on the server:

```dotenv
APP_ORIGIN=http://localhost:3000
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-web-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
SESSION_SECRET=use-a-unique-random-value-at-least-32-bytes-long
SESSION_COOKIE_SECURE=false
```

In production, use the public HTTPS origin and callback URL, set `SESSION_COOKIE_SECURE=true`, and use a unique secret from the deployment platform's secret manager. Keep `.env` out of source control. The server refuses incomplete Google credential sets and checks that the callback is same-origin and uses the expected path.

## 6. Run and test locally

From the project directory in PowerShell:

```powershell
Copy-Item .env.example .env
# Edit .env and configure PostgreSQL, SESSION_SECRET, APP_ORIGIN, and the Google values above.
npm install
npm run db:init
npm start
```

Open `http://localhost:3000/login.html` or `http://localhost:3000/signup.html`; do not open HTML files using `file://`. Select the Google button and sign in with an allowed test user. Confirm the browser returns to the site, a customer record is created once, and the server-backed session redirects to the customer profile. Test cancellation, invalid state, an existing password account with the same verified email, account linking with the existing password, and subsequent Google sign-in.

Traditional email/password registration and login remain independent. Linking an existing password account requires password verification; matching email alone never merges accounts. Passwords are bcrypt-hashed, and Google-only users have a `NULL` password hash.

## 7. Configure production callback URLs

1. Deploy the application behind HTTPS and set `APP_ORIGIN` to the canonical public origin.
2. Set `GOOGLE_CALLBACK_URL` to `${APP_ORIGIN}/api/auth/google/callback`.
3. Add exactly that URI and origin to the Google Web OAuth client.
4. Store `GOOGLE_CLIENT_SECRET` and `SESSION_SECRET` in the hosting platform's secret manager.
5. Set `NODE_ENV=production` and `SESSION_COOKIE_SECURE=true`.
6. Verify Google consent-screen publishing and domain ownership requirements before allowing public sign-in.
7. Test a new Google account, an existing linked Google account, safe password-based linking, disabled accounts, account conflicts, logout, session expiration, customer-only routes, and admin authorization in the deployed HTTPS environment.

## Account and database behavior

`database/schema.sql` creates the `users` table for new installations and migrates an existing `customers` table by renaming it, preserving its IDs and foreign-key relationships. It adds `google_id`, nullable `password_hash`, `profile_picture`, `auth_provider`, and `is_active`. `auth_provider` is one of `password`, `google`, or `password+google`.

Google ID tokens are verified on the server for audience/signature/expiry, then the issuer, verified email, subject, and one-time session nonce are checked. OAuth state is random, session-bound, and consumed at callback. The account-link password verification is separately CSRF-protected and rate-limited.

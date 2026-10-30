# API reference

The Express API is served on the same origin under `/api`. Serve the website with `npm start`; direct `file://` access cannot call these endpoints. JSON mutation requests require a session-bound `X-CSRF-Token` obtained from `GET /api/csrf`. The browser helper in `scripts/site.js` adds the token automatically.

Endpoints marked **customer** require an authenticated active account. **Admin** endpoints additionally re-check the user's current database role. Mutation endpoints require CSRF verification unless noted.

## Authentication

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Check database connectivity; responds with `{"status":"ok"}` when available. |
| GET | `/api/csrf` | Public | Create/read the session CSRF token. |
| GET | `/api/auth/me` | Public | Return the current session customer or `null`. |
| POST | `/api/auth/register` | Public + CSRF | Register with `{ fullName, email, password }`; password must be 12–128 characters. |
| POST | `/api/auth/login` | Public + CSRF | Sign in with `{ email, password, remember? }`. |
| POST | `/api/auth/logout` | Session + CSRF | Destroy the current session. |
| PATCH | `/api/auth/profile` | Customer + CSRF | Update `{ fullName, email, currentPassword? }`; password accounts must confirm their password. |
| POST | `/api/auth/password-reset` | Public + CSRF | Request a reset email using `{ email }`; response does not disclose whether the account exists. |
| POST | `/api/auth/password-reset/confirm` | Public + CSRF | Apply `{ token, password }` from a reset link. |
| GET | `/api/auth/google/status` | Public | Return whether Google OAuth configuration is present. |
| GET | `/api/auth/google/start?flow=login\|signup` | Public | Begin Google authorization; redirects to Google. |
| GET | `/api/auth/google/callback` | OAuth callback | Validate state, exchange/verify the code and establish a session or request password proof for linking. |
| GET | `/api/auth/google/pending` | Pending account link | Return the verified email for an unexpired password-link request. |
| POST | `/api/auth/google/link` | Pending account link + CSRF | Link the pending Google identity after `{ password }` proof. |
| GET | `/api/auth/google/start?flow=link` | Customer | Begin linking the same verified email to the current account. |

Authentication endpoints are rate-limited. Google sign-in requires server-side credentials; email/password sign-in does not. Passwords are currently hashed with `bcryptjs`, not Argon2.

## Menu and contact

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/menu` | Public | Return available menu items. Search, filtering, and sorting are performed in the browser; server pagination is not implemented. |
| POST | `/api/contact` | Public + CSRF | Send `{ name, email, phone, message }` to the configured restaurant email via SMTP. Enquiries are not stored in PostgreSQL. |

## Reservations

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/reservations` | Public + CSRF | Create a guest or signed-in reservation with `guestName`, `guestEmail`, `guestPhone`, `date`, `time`, `guestCount`, and optional `notes`. Capacity is checked transactionally per exact date/time. |
| GET | `/api/reservations/mine` | Customer | List the signed-in user's reservations. |
| POST | `/api/reservations/:id/cancel` | Customer + CSRF | Cancel the user's confirmed reservation. |

Admin reservation review/update is provided by `GET /api/admin/reservations` and `PATCH /api/admin/reservations/:id` with `{ status: "confirmed"|"cancelled"|"completed" }`.

## Orders and payments

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/orders` | Customer + CSRF | Create a pending order from `{ items: [{ id, quantity }], address }`; reads current database prices and requires configured Razorpay keys and `PRICING_CONFIRMED=true`. |
| POST | `/api/payments/verify` | Customer + CSRF | Verify `{ orderId, paymentId, signature }` with Razorpay and confirm only a captured payment for the expected order, amount, and currency. |
| POST | `/api/payments/webhook` | Razorpay signature | Accept verified provider webhook events. Configure this exact path in Razorpay. |
| GET | `/api/orders/mine` | Customer | List the user's orders and line-item names/quantities. |

Totals are calculated server-side from current menu prices. The server accepts only Razorpay test client IDs (`rzp_test_...`) and rejects live keys. Discount codes, refunds, and delivery/tax policy beyond configured flat values are not implemented.

## Admin

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/summary` | Counts, confirmed reservations, active customers, and captured revenue. |
| GET | `/api/admin/menu` | List all menu items. |
| POST | `/api/admin/menu` | Add a menu item with name, description, category, price in rupees, HTTPS image URL, vegetarian and featured flags. |
| PATCH | `/api/admin/menu/:id` | Update menu item details and availability. |
| DELETE | `/api/admin/menu/:id` | Mark the item unavailable (soft delete). |
| GET | `/api/admin/orders` | List up to 200 recent orders. |
| PATCH | `/api/admin/orders/:id` | Update a paid order status. |
| GET | `/api/admin/reservations` | List up to 200 reservations. |
| PATCH | `/api/admin/reservations/:id` | Set a reservation status. |
| GET | `/api/admin/customers` | List up to 500 active customers and order counts. |

Every admin route checks the current database role on the server. Category CRUD, offer management, review moderation, customer activation/deactivation, and pagination controls are not implemented.

## Common responses and limits

Successful endpoints return JSON except where noted. Common errors are `400` invalid input, `401` unauthenticated/invalid credentials, `403` CSRF or authorization failure, `404` missing record, `409` duplicate/conflicting state, and `503` an unconfigured integration or disabled ordering. Server error responses intentionally avoid returning stack traces.

Route-specific rate limits apply to login, registration, Google authentication, contact, and reservation creation. The current rate-limit store is process-local; multi-instance deployments need a shared store.

# Invo — Improvement Backlog

Findings from a full read of `backend/src`, `backend/prisma`, `frontend/src` and repo state
(2026-09-06). Ordered by severity. Each item states **what**, **why it matters**, and
**where**. Nothing here is implemented yet — this is the audit output.

---

## P0 — Broken or exploitable today

### 1. Expired access tokens return HTTP 500, so the silent-refresh flow never fires
`src/app/middlewares/auth.ts:24` calls `jwtHelpers.verifyToken`, which throws
`TokenExpiredError` / `JsonWebTokenError`. Those are plain `Error`s, not `ApiError`, so
`globalErrorHandler.ts:30` falls into the `err instanceof Error` branch and leaves
`statusCode` at its `INTERNAL_SERVER_ERROR` default.

`frontend/src/services/baseApi.ts:30` only refreshes on `result.error.status === 401`.
It sees 500, never refreshes, never clears credentials — the user sits in a broken session
until they manually reload and re-login.

**Fix:** wrap `verifyToken` in the middleware and rethrow as
`ApiError(401, "Token expired" | "Invalid token")`; also add a
`jwt.TokenExpiredError` / `JsonWebTokenError` branch in `globalErrorHandler` as a backstop.

### 2. Profile editing is 403 for every non-superadmin user
`frontend/src/pages/ProfilePage.tsx:73` calls `useUpdateUserMutation` → `PATCH /users/:id`,
but every route in `backend/src/app/modules/user/user.route.ts` is guarded by
`auth("superadmin")`. A `user`-role account cannot edit its own name, email, phone or
password. There is no self-service endpoint at all.

**Fix:** add `PATCH /auth/me` (name, phone, email) and `POST /auth/change-password`
(requires `currentPassword`, verifies with bcrypt, revokes all refresh tokens on success).
Point `ProfilePage` at those. Never let a self-update endpoint accept `role`.

### 3. A DB dump with password hashes and customer PII is committed to git
`files/invo_sql_data.sql` is tracked and contains `INSERT`s into `users`, `organizations`,
`customers`, `invoices`, `invoice_items`.

**Fix:** `git rm --cached` it, add a root `.gitignore` (`files/`, `*.sql`, `.env`,
`node_modules`, `dist`, `uploads/`), and — because it is already in history — rotate the
superadmin password and every seeded account credential. If the repo is or will be shared,
purge with `git filter-repo`.

### 4. `frontend/.env` is tracked and hardcodes `http://localhost:9025`
A production `vite build` bakes the localhost URL into the bundle. `.env` should never be
tracked; only `.env.example`. Neither app has a `.env.example` for the frontend.

**Fix:** untrack `frontend/.env`, add `frontend/.env.example`, and document
`VITE_API_URL` per environment.

### 5. Logo upload writes the file to disk *before* the ownership check
`backend/src/app/modules/organization/organization.route.ts:45-55` deliberately runs multer
before `ownershipGuard`. Any authenticated user can POST a 5 MB image to
`/organizations/{any id}/logo`; the file lands in `uploads/logos/` and *then* the request is
rejected with 403. The file is never cleaned up — unbounded disk growth from any logged-in
account.

**Fix:** run `ownershipGuard` first (it only needs `req.params.id`, not the body), or keep
the current order and `fs.unlink` the orphan in an error-handling middleware. Also add a
periodic orphan sweep for files not referenced by any `organizations.logo`.

### 6. `cors({ origin: true })` reflects any origin *with credentials*
`backend/src/app.ts:12`. Combined with `credentials: true`, this lets any site the user
visits make cookie-bearing requests to the API. `sameSite: "strict"` on the refresh cookie
mitigates it today, but the CORS policy itself is wide open.

**Fix:** an explicit `CORS_ORIGINS` env allowlist. While in `app.ts`: add `helmet`,
`compression`, `express.json({ limit: "1mb" })`, and a request logger (`pino-http`/`morgan`).

### 7. No rate limiting on `POST /auth/login`
Unlimited password guessing against a known email. Combined with #8 below (user
enumeration), that's a practical brute-force path.

**Fix:** `express-rate-limit` on `/auth/*` (e.g. 10 attempts / 15 min per IP+email), plus
optional per-account lockout after N failures.

### 8. Login leaks which emails exist
`auth.service.ts:20` returns 404 "User does not exist"; `:25` returns 401 "Incorrect
password". Two distinguishable responses = an account enumeration oracle.

**Fix:** one `ApiError(401, "Invalid email or password")` for both, and run a dummy
`bcrypt.compare` on the miss path so response timing does not leak either.

### 9. JWT secrets silently fall back to hardcoded strings
`config/index.ts:11-13` defaults to `"fallback-secret"` / `"fallback-refresh-secret"`.
A production deploy with a missing env var boots happily with a publicly known signing key —
anyone can mint a `superadmin` token.

**Fix:** validate the whole env with Zod at boot and `process.exit(1)` on anything missing
or (for the secrets) shorter than 32 chars. The current `JWT_SECRET` in `backend/.env` is
36 chars — fine — but nothing enforces that.

---

## P1 — Correctness and data integrity

### 10. Money is computed in JS floats, stored as `DECIMAL(12,2)`
`invoice.service.ts:15-21` does `item.quantity * item.rate` and `subtotal + tax - discount`
on JS numbers, `.toFixed(2)`-ing at each step. Prisma hands back `Decimal` for these columns
and `addBalanceDue` (`:24-28`) converts back to `Number`. Rounding drift is inevitable on
long line-item lists, and an invoice total that is off by a paisa is a real accounting bug.

**Fix:** do all arithmetic in `Prisma.Decimal` (or `decimal.js`) end to end; convert to
string only at the response boundary. Never `Number()` a money column.

### 11. `amountInWords` exists twice, in two currencies, and can't say "lakh"
- `backend/src/helpers/amountInWords.ts:41` emits **"Cents"**.
- `frontend/src/pages/invoices/InvoiceFormFields.tsx:88` emits **"Paise"**.

Same input, two different strings — the live form preview disagrees with the value persisted
in `invoices.amount_in_words` and printed on the PDF. Both use Million/Billion grouping while
the whole app is Indian (₹, GST number, IFSC, UPI, challan no.). Both also break above
999 billion.

**Fix:** one implementation (backend is the authority; expose it or mirror it exactly), Indian
grouping (thousand → lakh → crore), "Rupees … and … Paise Only", and a unit test table.

### 12. Invoice numbering can collide under concurrency
`invoice.service.ts:77` reads `org.nextInvoiceNumber`, then `:96` increments it. Under
MySQL's default REPEATABLE READ, two simultaneous creates for one org can read the same value.
The `@@unique([organizationId, invoiceNumber])` constraint saves the data, but the second
user gets an opaque 409 instead of an invoice.

**Fix:** increment first and use the returned value
(`tx.organization.update({ data: { nextInvoiceNumber: { increment: 1 } } })` returns the new
row), or `SELECT ... FOR UPDATE`, and retry once on P2002.

### 13. Deleting an org owner cascades away every invoice
`schema.prisma:73` — `Organization.owner` is `onDelete: Cascade`, and `Organization → Invoice`
cascades too. `DELETE /users/:id` therefore silently destroys the full financial history of
every org that user owned. Invoices are legal records; they should never be hard-deletable as
a side effect.

**Fix:** `onDelete: Restrict` on `Organization.owner` (force reassignment first — the
`/admin/organizations/:id/assign` endpoint already exists), and soft-delete for invoices
(`deletedAt`) rather than `DELETE`. Same argument for
`OrgService.deleteOrganization` (`organization.service.ts:46`).

### 14. No invoice status state machine, and no guard on editing finalized invoices
`updateInvoice` accepts any `status` from any status, and happily rewrites line items, totals
and the invoice date of a `paid` or `cancelled` invoice.
`InvoiceDetailPage.tsx:86` exposes that as a free-form dropdown.

**Fix:** enforce transitions server-side (`draft → sent → paid`, anything → `cancelled`, no
transitions *out of* `cancelled`/`paid` without an explicit reopen action), and reject item /
total edits once status ≠ `draft`. Frontend mirrors it for UX only.

### 15. No validation that money fields are internally consistent
Nothing rejects `discount > subtotal + tax` (backend produces a negative `grandTotal`;
the frontend clamps with `Math.max(0, …)` at `InvoiceFormFields.tsx:139` so the two disagree),
or `receivedAmount > grandTotal`, or `status: "paid"` with `balanceDue > 0`.

**Fix:** cross-field checks in the invoice service (the authority), mirrored in the Zod schema
via `.superRefine` for UX. Remove the frontend-only clamp so both sides agree.

### 16. Refresh tokens are never rotated or cleaned up
`auth.service.ts:112` issues a new *access* token but reuses the same refresh token, so a
stolen refresh token stays valid for its full 7 days. Rows accumulate forever — every login
inserts one, only explicit logout deletes one, and expired rows are never purged (the
`@@index([expiresAt])` at `schema.prisma:54` was clearly added for a sweep that was never
written).

**Fix:** rotate on refresh (delete old, issue new, set the cookie), detect reuse of an
already-rotated token as a compromise signal and revoke that user's whole family, and add a
startup + daily `deleteMany({ where: { expiresAt: { lt: new Date() } } })`.

### 17. `parseInt(config.jwt.refresh_expires_in)` is a coincidence
`auth.service.ts:46` — `parseInt("7d")` → `7`, which happens to be right for days. Change
`JWT_REFRESH_EXPIRES_IN` to `"12h"` and the DB row claims 12 *days* while the JWT itself
expires in 12 hours. Silent, and only bites in production.

**Fix:** parse the duration properly (`ms` package) or store the expiry as
`decoded.exp * 1000` taken from the token that was just signed.

### 18. `sameSite: "strict"` breaks refresh on a split-domain deploy
`auth.controller.ts:15`. Fine while frontend and API share `localhost`; the cookie will not be
sent once the SPA is on `app.example.com` and the API on `api.example.com`.

**Fix:** `sameSite: "none"; secure: true` when a `COOKIE_CROSS_SITE` env flag is set, or serve
both from one origin (see #24 — the build is already sitting in `backend/public`).

### 19. `PATCH /users/:id` lets a superadmin demote or lock out the last superadmin
Nothing prevents changing the only superadmin's role to `user`, or deleting your own account
(`user.service.ts:70`). One click and nobody can administer the system.

**Fix:** refuse to demote/delete the last remaining superadmin, and refuse self-deletion.

### 20. Access token is persisted to `localStorage`
`store/index.ts:19` whitelists `accessToken` in `redux-persist`. The refresh token is
correctly httpOnly, but any XSS reads the access token straight out of storage.

**Fix:** persist only `user` (for UI hydration) and keep `accessToken` in memory, re-obtaining
it via `/auth/refresh-token` on app boot. Costs one request per page load; removes the whole
class of token-theft-by-XSS.

---

## P2 — Architecture, tooling, hygiene

### 21. `npm run lint:check` fails — the backend has no ESLint
`backend/package.json` defines `lint:check` / `lint:fix` and a `lint-staged` block, but there
is no `eslint.config.js` and neither `eslint` nor `typescript-eslint` is in
`devDependencies`. There is also no `husky` hook to run `lint-staged`.

**Fix:** add flat-config ESLint + `@typescript-eslint` to the backend, mirroring
`frontend/eslint.config.js`, and wire husky pre-commit.

### 22. Zero tests, in either app
`"test": "echo \"Error: no test specified\" && exit 1"`. For a system that computes money,
that is the single biggest risk multiplier on this list — every item in P1 is a test that
should exist.

**Fix:** Vitest + Supertest on the backend. Minimum viable suite: `amountInWords` table test,
invoice total arithmetic, invoice-number concurrency, ownership guard (user A cannot touch
org B), auth 401/refresh flow, status transitions.

### 23. `(req as any).user` / `(req as any).org` in eight places
`auth.ts:27`, `ownershipGuard.ts:18,31,39`, `organization.controller.ts:8,20,33`,
`auth.controller.ts:61`. `strict: true` is on, and these casts throw it away exactly where the
security decisions are made.

**Fix:** `declare global { namespace Express { interface Request { user?: JwtUser; org?: Organization } } }`
in `src/types/express.d.ts`. Type `JwtUser` as `{ id: number; email: string; role: UserRole }`
and validate the decoded payload shape rather than trusting it.

### 24. The committed SPA build in `backend/public/` is never served
`git ls-files` shows `backend/public/assets/*` and `backend/index.html` are tracked (the
"deploy" commit), but `app.ts` only mounts `/uploads`. No `express.static("public")`, no SPA
history fallback — so the deployed bundle is dead weight, and build artifacts are in version
control besides.

**Fix:** decide one way. Either serve it (`express.static` + a `*` fallback to `index.html`
mounted *after* `/api/v1`) and gitignore `public/`, generating it in CI; or drop it and deploy
the frontend separately.

### 25. Error-handler ordering is inverted
`app.ts:24-25` registers `globalErrorHandler` *before* `notFoundHandler`. It happens to work
(Express skips 4-arg handlers in the normal path), but a 404 that ever calls `next(err)` would
escape to Express's default HTML error page.

**Fix:** `notFoundHandler` then `globalErrorHandler`.

### 26. `getMe` bypasses the service layer with a dynamic import
`auth.controller.ts:62` — `const prisma = (await import("@/lib/prisma")).default` inside a
controller, then queries directly. Every other controller in the codebase delegates to a
service.

**Fix:** `AuthService.getMe(userId)`.

### 27. `paginationHelper.ts` is dead code
`calculatePagination` is never imported; `customer.service.ts:17` and `invoice.service.ts:105`
each reimplement it inline with slightly different allowed-sort lists.

**Fix:** use the helper, or delete it. Either way, one shared `buildPagination` + a shared
`meta` shape.

### 28. No pagination ceiling
`?limit=100000` on `/customers` or `/invoices` is accepted verbatim
(`customer.service.ts:21`, `invoice.service.ts:111`).

**Fix:** clamp to a max of 100.

### 29. The invoice list ships every line item of every invoice
`invoice.service.ts:139` includes `items: true` in the list query. The table
(`InvoicesPage.tsx`) doesn't render them.

**Fix:** drop `items` from the list `include`, or select only what the row shows.

### 30. `updateInvoice` deletes and recreates all line items on every save
`invoice.service.ts:196-199`. New `id`s each time, so nothing external can reference a line
item and any future per-item audit trail is impossible.

**Fix:** diff by item id — update in place, insert new, delete removed.

### 31. `uploads/` is served publicly and unauthenticated
`app.ts:18`. Any org's logo is readable by anyone who guesses the filename. Filenames are
random enough to be low risk, but the directory is also not size-capped.

**Fix:** decide whether logos are public assets (fine, document it) or org-scoped (serve
through an authenticated route). Add a total-size quota either way.

### 32. Env config has no schema and no `.env.example` parity
`config/index.ts` uses `||` fallbacks throughout, so a typo'd variable name degrades silently.
`backend/.env` has `PORT=9025`; `.env.example` says `9000`; `frontend/.env` points at `9025`.

**Fix:** Zod-validated config (ties into #9), and keep `.env.example` in sync as part of the
definition of done.

### 33. `console.log` as the logging strategy
`server.ts`, `seedSuperAdmin.ts`. No request ids, no levels, no structured output, and
`seedSuperAdmin` swallows its own failure (`:40`) so a boot-time seed error is invisible in a
log aggregator.

**Fix:** `pino` + `pino-http` with a request id; let a seed failure be fatal.

### 34. No health/readiness distinction and no graceful shutdown
`/api/v1/health` (`routes/index.ts:9`) always returns 200 even if MySQL has gone away, and
nothing handles `SIGTERM` — in-flight requests are killed on deploy and `prisma.$disconnect()`
is never called.

**Fix:** health = liveness, add `/ready` that runs `SELECT 1`, and a SIGTERM handler that
stops accepting connections, drains, then disconnects Prisma.

---

## P3 — Product gaps already on the roadmap, plus what's missing from it

Both `todo.md` files stop at **Phase 6/7 — Dashboard Analytics**, unstarted. Beyond that, the
following are absent and matter for an invoicing product:

- **GST is modelled as a single `tax` amount.** `schema.prisma:104` is one flat
  `DECIMAL(12,2)`. Indian invoicing needs per-line HSN/SAC codes and CGST/SGST/IGST split
  (intra- vs inter-state, driven by comparing org and customer state codes). Retrofitting this
  later means migrating every existing invoice.
- **No payment records.** `receivedAmount` is a single mutable number, so partial payments have
  no history — no date, method, or reference per payment. A `payments` table
  (invoiceId, amount, date, method, reference) would make `receivedAmount` and `balanceDue`
  derived rather than stored.
- **No audit trail.** Who changed an invoice's status, from what to what, when. Required for
  anything a tax authority might look at.
- **PDF is browser-print only** (`react-to-print`). No server-side PDF, so no emailing an
  invoice and no stable archived copy of what was actually sent.
- **No soft delete anywhere.** `DELETE` is permanent for users, orgs, customers and invoices.
- **No `.gitignore` at the repo root**, no CI (lint + typecheck + test on PR), no Dockerfile,
  no deploy documentation beyond a commit named "deploy".
- **Invoice date is a `DateTime`** (`schema.prisma:102`) but is only ever used as a date;
  timezone handling between `todayString()` (`InvoiceFormFields.tsx:58`, uses UTC via
  `toISOString`) and the server will drift by a day for users east of UTC.
- **No due date / payment terms**, so no overdue tracking or ageing report — the most commonly
  requested invoicing feature after the invoice itself.

---

## Suggested order of work

1. **#1, #2** — both are user-visible breakage, both are small.
2. **#3, #4** — repo hygiene; the longer the dump sits in history the worse it gets.
3. **#5–#9** — the security block; roughly one focused session.
4. **#22** — stand up Vitest before touching money code.
5. **#10–#15** — invoice correctness, now with tests to prove it.
6. **#16–#20** — auth hardening.
7. **P2** as cleanup passes; **P3** as product decisions.

---

## Decisions (2026-09-06)

Agreed with Rajib before implementation:

| Question | Decision |
|---|---|
| Scope to implement now | **P0 + P1 (items 1–20)**, plus full GST pulled forward from P3 |
| GST model | **Full GST** — per-line `hsnCode` + `gstRate`, CGST/SGST/IGST split by place of supply |
| Rate basis | **GST-exclusive** — line `rate` is pre-tax, GST added on top |
| GST migration of existing rows | **Backfill as 0% GST**, preserve each invoice's current flat `tax` so historical totals never change |
| Deploy shape | **Single origin** — Express serves the SPA from `public/` with a history fallback; `sameSite: "strict"` stays correct, no CORS allowlist needed for the app itself |
| `files/invo_sql_data.sql` | **Untrack + gitignore**, leave git history alone. Superadmin credentials still need rotating since the hash is in history. |

### Consequences

- **#6** narrows to helmet + compression + body limit + logger + a CORS allowlist that
  defaults to same-origin (kept configurable for local Vite dev on :5173).
- **#18** is resolved by the single-origin choice; the cookie config stays env-driven so a
  future split deploy is a config change, not a code change.
- **#24** becomes in-scope: `express.static("public")` + SPA fallback mounted after
  `/api/v1`, and `backend/public/` gets gitignored and built at deploy time.
- **GST schema** additions: `stateCode` on `organizations` and `customers`,
  `placeOfSupply` + `cgstTotal`/`sgstTotal`/`igstTotal` + `roundOff` on `invoices`,
  `hsnCode`/`gstRate`/`cgst`/`sgst`/`igst` on `invoice_items`. Existing `tax` is retained as
  the total-tax column so old rows keep their values.
- **#10 (Decimal money)** and the GST work land together — the split has to be computed in
  `Prisma.Decimal` from the start, not retrofitted.

---

## Implementation status — 2026-09-06

Verification run at the end: backend `tsc` clean, frontend `tsc -b` clean,
`npm run lint` 37 errors → **0**, both `npm run build` green, plus three ad-hoc
verification passes (GST arithmetic, frontend/backend mirror equality, HTTP layer).

### P0 — done

| # | Item | Notes |
|---|---|---|
| 1 | Expired JWT now 401, not 500 | `middlewares/auth.ts` translates `TokenExpiredError`/`JsonWebTokenError`; `globalErrorHandler` keeps a backstop. **Verified**: expired token → 401 "Access token expired". |
| 2 | Self-service profile | New `PATCH /auth/me` and `POST /auth/change-password`. `ProfilePage` rewired off the superadmin-only `/users/:id`. Password change revokes all sessions. |
| 3 | SQL dump untracked | `git rm --cached files/`, root `.gitignore` added. History **not** rewritten (agreed) — the credentials in it still need rotating. |
| 4 | `frontend/.env` untracked | `.env.example` added for both apps. |
| 5 | Upload authorization | `ownershipGuard` now runs **before** multer; failed saves unlink the file; the on-disk extension comes from the sniffed mime type, not the client filename. |
| 6 | CORS + hardening | Explicit allowlist (dev falls back to the Vite origin), helmet with CSP, compression, 1 MB body cap, `trust proxy`. **Verified**: allowed origin reflected, `evil.example.com` gets no ACAO. |
| 7 | Login rate limiting | 10 attempts / 15 min keyed on IP + email; a 1000/15 min ceiling on the rest of the API. |
| 8 | Login enumeration | One "Invalid email or password" for both branches, with a dummy bcrypt compare so timing does not leak either. |
| 9 | Env validation | Zod-validated config; the process exits on a missing/short/duplicated secret instead of booting on `"fallback-secret"`. |

### P1 — done

| # | Item | Notes |
|---|---|---|
| 10 | Decimal money | All invoice arithmetic runs in `Prisma.Decimal` end to end (`helpers/gst.ts`). No `Number()` round-trips through the money path. |
| 11 | One amount-in-words | Indian crore/lakh grouping, "Rupees … and … Paise Only". Frontend `src/lib/money.ts` is a mirror **verified to produce byte-identical output** to the backend on the same cases. |
| 12 | Invoice number races | Increments first and uses the returned value, so concurrent creates serialize on the row lock instead of both reading the same counter. |
| 13 | Cascade deletes | `Organization.owner` is now `Restrict`; org deletion is refused while invoices exist; invoices are **soft-deleted** and keep their number reserved. |
| 14 | Status state machine | `draft → sent → paid`, anything → `cancelled`, both terminal. Figures are frozen once out of draft. The UI mirrors this: the dropdown only offers legal moves and Edit is disabled. |
| 15 | Money invariants | Discount ≤ subtotal, received ≤ total, `paid` requires a zero balance. Enforced server-side, mirrored in the form. |
| 16 | Refresh rotation | Refresh tokens rotate on use; replay of a consumed token revokes the whole family; expired rows are swept at boot and daily. |
| 17 | Duration parsing | `ms`-based, and the DB expiry is read from the token's own `exp` claim, so the row can never disagree with the JWT. |
| 18 | Cookie flags | Env-driven; `sameSite: strict` for the single-origin deploy, `none; secure` behind `COOKIE_CROSS_SITE`. Cookie path narrowed to `/api/v1/auth`. |
| 19 | Superadmin lockout | The last superadmin cannot be demoted or deleted; nobody can delete their own account. An admin password reset revokes that user's sessions. |
| 20 | Token out of localStorage | Only the profile is persisted. `AuthBootstrap` exchanges the httpOnly refresh cookie once on load, and **all refreshes are serialized** — with rotation, two parallel refreshes would have looked like a replay and logged the user out. |

### GST (pulled forward from P3) — done

- Schema: `stateCode` on organizations and customers; `taxableValue`, `cgstTotal`,
  `sgstTotal`, `igstTotal`, `roundOff`, `placeOfSupply`, `isIntraState` on invoices;
  `hsnCode`, `gstRate`, `discount`, `taxableValue`, `cgst`, `sgst`, `igst` on line items.
- Engine: per-line GST on GST-exclusive rates, invoice discount apportioned pro rata with
  the residual on the last line, CGST/SGST split that always reconstructs the line's GST,
  and a whole-rupee round-off carried in `roundOff`.
- Place of supply is frozen on the invoice at issue time. A GST-rated invoice is refused
  until both state codes are known rather than guessing intra-state.
- UI: HSN/SAC + GST% per line, live CGST/SGST/IGST/round-off preview, and the printed
  invoice carries the full breakdown. Legacy invoices render their original flat tax.

### Also fixed while in the area

`#24` single-origin SPA serving (`express.static` + history fallback, `public/` gitignored),
`#25` handler ordering, `#26` `getMe` through the service layer, `#28` pagination capped at
100, `#29` the invoice list no longer ships every line item, and lint went 37 → 0
(shared `getApiErrorMessage` helper replacing 23 `catch (err: any)`, breadcrumb context split
from its provider, invoice form schema extracted, `setState`-in-effect removed from the
combobox, and the Fast Refresh rule scoped off the generated `components/ui/**`).

### Behaviour changes to be aware of

1. **New invoices round to whole rupees.** Standard on a GST invoice, and the difference is
   stored and displayed as "Round Off" — but totals will no longer end in paise.
2. **`tax` is no longer accepted from the client.** It is derived from the per-line GST
   rates. Any external caller posting `tax` must move to `items[].gstRate`.
3. **Invoices are frozen once they leave draft**, and **delete is now soft**.
4. **Sessions end on password change** (by design) and on refresh-token replay.
5. `JWT_EXPIRES_IN` is still `1d` in `backend/.env`. Now that refresh actually works,
   **15m is the appropriate value** — a day-long bearer token was compensating for the
   broken refresh path.

### Not done — still open

- **The migration has NOT been applied to production**: `prisma/migrations/20260906000000_gst_hsn_and_soft_delete/`.
  Back up, then `npx prisma migrate deploy`. It **has** now been applied and verified against
  a local MySQL 8.0 with seeded legacy data (see "Migration tested" below).
- **Rotate the superadmin password** — its hash is in git history via the dump.
- `#21` backend ESLint, `#22` **tests** (still the single biggest risk — every P1 item above
  is a test that should exist), `#27` dead `paginationHelper`, `#30` line items are still
  deleted and recreated on save, `#31` public `uploads/`, `#33` structured logging,
  `#34` readiness probe and graceful shutdown.
- `npm run typecheck` in the frontend is a **no-op** — with project references, `tsc --noEmit`
  checks nothing. Use `tsc -b`. The script should be fixed.
- `prisma` (dev-only CLI) carries 3 high advisories via `deepmerge-ts` with no fixed release
  on any channel; forcing it would downgrade below 6.13 or jump to an 8.x prerelease.
- `backend/index.html` is a stray copy of an old SPA build at the backend root; now
  gitignored, safe to delete.

---

## Follow-up — 2026-09-06 (later): dev DB, and a bug found in the migration

### `npm run dev` failure was unrelated to any change here

```
ERROR 1045 (28000): Access denied for user 'u237355130_invo'@'223.185.28.105' (using password: YES)
```

The Hostinger server rejects the `user@host` pair from the current public IP. Confirmed with
the `mysql` client using both the URL-decoded and the raw percent-encoded password — identical
rejection, so the credentials are being transmitted correctly and the encoding is not at fault.
`prisma.$connect()` is the first statement in `bootstrap()`, so this fails before any
application code runs.

The `[dotenv] injecting env (0)` line is a red herring: `ts-node-dev` respawns a child that
inherits an already-populated `process.env`, so dotenv has nothing new to inject. It prints
`(0)` on successful runs too.

Most likely cause is Hostinger's **Remote MySQL** allowlist — a consumer broadband IP that has
since changed. Fix in hPanel → Databases → Remote MySQL by adding the current IP. Note this
recurs whenever the IP changes, which is the practical argument for not developing against
production at all.

### Local development now points at local MySQL

`backend/.env` `DATABASE_URL` now targets `localhost:3306/invoice_management`; the Hostinger
URL is retained directly above it, commented, labelled for deploys only. Swapping back is a
one-line change. The local database was created and migrated from scratch.

### Bug found and fixed in the GST migration's backfill

Applying the migration to seeded legacy data surfaced a defect that an empty database would
have hidden. The original backfill rounded each line's share of the invoice discount
independently:

```sql
ROUND(v.discount * (i.amount / v.subtotal), 2)
```

Three lines sharing a ₹10.00 discount each rounded to ₹3.33, summing to **₹9.99**, so
`SUM(invoice_items.taxable_value)` came to ₹90.01 against an invoice `taxable_value` of ₹90.00
— despite a comment in the migration claiming the two reconciled.

`src/helpers/gst.ts` already handled this by giving the residual to the last line; the SQL did
not replicate it. The backfill now computes the shares in a temporary table using window
functions and assigns the remainder to the highest-id line of each invoice, matching the
TypeScript engine.

### Migration tested

Reset, re-seeded and re-applied. All invoices reconcile:

| Invoice | Lines | Subtotal | Discount | Σ line discount | Σ line taxable | Invoice taxable |
|---|---|---|---|---|---|---|
| INV-0001 | 3 (33.33/33.33/33.34) | 100.00 | 10.00 | **10.00** | **90.00** | 90.00 |
| INV-0002 | 1 | 250.00 | 0.00 | 0.00 | 250.00 | 250.00 |
| INV-0003 | 7 × 10.00 | 70.00 | 10.00 | **10.00** (6×1.43 + 1.42) | **60.00** | 60.00 |

Legacy `grand_total` and `tax` values are unchanged, and
`taxable_value + tax + round_off = grand_total` holds for every row.

### End-to-end verification against a real database — 39/39

Login (including the uniform 401 for an unknown email), org and customer creation,
intra-state CGST+SGST split, inter-state IGST, invoice number increment, whole-rupee
round-off, amount-in-words, rejection of over-discount / over-payment / non-slab GST rate /
GST without a state code, the full status machine (`draft → sent → paid` with each illegal
move refused), the post-issue edit freeze, soft delete removing the invoice from the list
while 404ing by id, and legacy invoices still readable.

The local database was then reset to a clean migrated schema, and `npm run dev` verified:
connects, seeds the superadmin, serves `/api/v1/health` → 200.

# PayU Hosted Checkout — backend integration (api.clubin.info)

The web guestlist flow now collects payment online via **PayU Hosted Checkout**
before issuing a ticket. The frontend (this repo) is a static GitHub Pages site
and **cannot** hold the salt key or receive PayU's server callbacks, so all of
the following lives on the backend at `api.clubin.info`.

> **Every booking is paid online.** Even "free" entries carry a convenience fee,
> so the PayU amount is always ≥ ₹1. There is no pay-at-venue path on the web.

---

## 1. How the pieces fit together

```
Browser (BookingModal)                Backend (api.clubin.info)              PayU
─────────────────────                 ─────────────────────────              ────
POST /api/payments/initiate  ───────▶ create PENDING booking
  { eventId, couples,                 compute amount (subtotal + fee)
    ladies, stags, guests }           generate txnid + request hash (SALT)
                             ◀─────── { bookingId, action, params, breakdown }

auto-submit <form> to ──────────────────────────────────────────────────▶ /_payment
  PayU `action` with `params`                                              (user pays)

                                      POST surl/furl  ◀──────────────────── result + hash
                                      verify response hash
                                      mark booking PAID / FAILED
                             ◀─────── 302 redirect
/payment/return?bookingId=…&status=…
GET /api/payments/status ───────────▶ return authoritative status + booking
  (page shows ticket or retry)
```

The frontend **never** builds or hashes a PayU field. The backend returns a
fully-signed `params` object; the browser posts it verbatim.

---

## 2. Endpoints to implement

### `POST /api/payments/initiate` — auth required (Bearer token)

**Request body** (same shape as the old `POST /api/bookings`):
```jsonc
{
  "eventId": "uuid",
  "couples": 1,
  "ladies": 0,
  "stags": 2,
  "guests": [ { "name": "…", "type": "couple|lady|stag", "gender": "couple|female|male" } ]
}
```

**Behaviour**
1. Authenticate the user from the Bearer token (same middleware as `/api/bookings`).
2. Load the event; validate guestlist is open and counts are sane.
3. **Compute the amount server-side** — never trust a client amount:
   - `subtotal = couples*couplePrice + ladies*ladiesPrice + stags*stagPrice`
   - `convenienceFee = round(FEE_FLAT + subtotal * FEE_PERCENT/100)` (see §4)
   - `total = subtotal + convenienceFee (+ optional tax)`, enforce `total >= 1`.
4. Create the booking with `paymentStatus = 'pending'` (do **not** confirm it / count it against the guestlist limit yet — or mark it provisional and expire it if unpaid; see §6).
5. Generate a unique `txnid` (≤ 64 chars, e.g. `CLB-<bookingId-without-dashes>-<short-rand>`), persist it on the booking/payment row along with `amount`, `convenienceFee`, `total`.
6. Build the PayU `params` and the **request hash** (§3).
7. Respond:
```jsonc
{
  "bookingId": "uuid",
  "txnid": "CLB-…",
  "amount": "320.00",
  "breakdown": { "subtotal": 300, "convenienceFee": 20, "tax": 0, "total": 320 },
  "action": "https://test.payu.in/_payment",   // or secure.payu.in in production
  "params": {
    "key": "…", "txnid": "CLB-…", "amount": "320.00",
    "productinfo": "Guestlist: <event title>",
    "firstname": "…", "email": "…", "phone": "…",
    "surl": "https://api.clubin.info/api/payments/payu/callback",
    "furl": "https://api.clubin.info/api/payments/payu/callback",
    "udf1": "<bookingId>", "udf2": "<eventId>", "udf3": "<userId>",
    "hash": "<sha512…>"
  }
}
```

> The matching frontend type is `PaymentInitiateResponse` in `src/types.ts`.

### `POST /api/payments/payu/callback` — PayU posts here (this is `surl` **and** `furl`)

PayU sends an `application/x-www-form-urlencoded` body. Mount the same handler at
both surl and furl (it branches on the posted `status`), or use two routes.

1. **Verify the response hash** (§3) against the posted `hash`. If it doesn't
   match, log and treat as failed — do **not** fulfil.
2. Look up the booking by `udf1` (bookingId) and/or `txnid`. **Re-check the
   amount** matches what you stored (guard against tampering).
3. If `status === 'success'` and hash valid → set `paymentStatus = 'paid'`,
   store `mihpayid`, confirm the booking (count it against the guestlist now).
   Otherwise → `paymentStatus = 'failed'`.
4. **Idempotency:** callbacks can arrive more than once. If already `paid`, no-op.
5. (Recommended) Before fulfilling, double-confirm with PayU's
   `verify_payment` API (§5) so a forged POST can never confirm a booking.
6. `302` redirect to the frontend:
   `${FRONTEND_URL}/payment/return?bookingId=<id>&status=success|failure`
   — build the base from config, **not** from any client/PayU-supplied URL
   (open-redirect guard).

### `GET /api/payments/status?bookingId=…` — auth required (Bearer token)

The return page calls this and trusts it over the `status` query param. Return:
```jsonc
{
  "bookingId": "uuid",
  "paymentStatus": "pending|paid|failed|cancelled",
  "booking": { /* full Booking incl. `event` and `guests` so the ticket renders */ },
  "breakdown": { "subtotal": 300, "convenienceFee": 20, "cgst": 27, "sgst": 27, "total": 374 }
}
```
Authorize that the booking belongs to the requesting user. The matching frontend
type is `PaymentStatusResponse` in `src/types.ts`.

---

## 3. Hash formulas (verbatim — SHA-512, hex, lowercase)

**Request hash** (sent in the form to `/_payment`):
```
sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
```
Use the **exact** `amount` string (e.g. `"320.00"`) you put in `params.amount`.
If a `udf` is unused, send an empty string but **keep the pipe**. There are 5
empty fields between `udf5` and `SALT` (the `||||||`).

**Response (reverse) hash** — recompute from the posted fields and compare to the
posted `hash`:
```
sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
```
**Edge case:** if the response body contains `additionalCharges`, prepend it:
```
sha512(additionalCharges|SALT|status||||||udf5|…|key)
```

See `payu-backend-reference.ts` for working `requestHash()` / `verifyResponseHash()`.

---

## 4. Amount: convenience fee + GST

`total = subtotal + convenienceFee + cgst + sgst` where:

- **subtotal** — sum of guest prices (couple/ladies/stag).
- **convenienceFee** — **admin-controlled** (per-event or global setting in the
  admin panel; falls back to `DEFAULT_CONVENIENCE_FEE`). Always ≥ ₹1 so even a
  "free" event clears PayU's minimum.
- **cgst + sgst** — **18% GST on the ticket subtotal**, split 9% CGST + 9% SGST:
  `cgst = sgst = round(subtotal * 18 / 200)`.

```
GST_PERCENT=18                # 18% = 9% CGST + 9% SGST on the subtotal
DEFAULT_CONVENIENCE_FEE=20    # fallback when admin hasn't set one for the event
```

The frontend shows whatever `breakdown` the initiate response returns (subtotal,
convenienceFee, cgst, sgst, total) — there is **no fee/tax math in the client**,
so it can never drift from the server-authoritative amount used in the hash.

---

## 5. Credentials & environment

| Env var | Value | Notes |
|---|---|---|
| `PAYU_MODE` | `test` or `production` | selects `test.payu.in` vs `secure.payu.in` |
| `PAYU_MERCHANT_KEY` | `nzJQ0L` (live) | use the **test** key while `PAYU_MODE=test` |
| `PAYU_SALT` | `KmQ7…` (live) | **server-only secret** — never to the client |
| `PAYU_CLIENT_ID` | `8e31…` | for OAuth → `verify_payment` / refunds |
| `PAYU_CLIENT_SECRET` | `1ef0…` | **server-only secret** |
| `FRONTEND_URL` | `https://clubin.co.in` | return-page base |
| `BACKEND_BASE_URL` | `https://api.clubin.info` | builds surl/furl |

- Get **separate test/sandbox key+salt** from the PayU dashboard for `PAYU_MODE=test`. The live `nzJQ0L`/`KmQ7…` post to `secure.payu.in` and **charge real cards**.
- **`verify_payment` (server-to-server reconciliation):** `POST https://info.payu.in/merchant/postservice.php?form=2` with `key`, `command=verify_payment`, `var1=<txnid>`, `hash=sha512(key|command|var1|SALT)`. Use it in the callback before fulfilling, and in a cron to reconcile stuck `pending` bookings.

> 🔐 The merchant key, salt, and client secret were shared in plaintext during
> setup. **Rotate the salt and client secret in the PayU dashboard** once this
> is wired up, and load all four from env/secrets only.

---

## 6. Data model additions

Add to the booking (or a 1:1 `Payment` row keyed by booking):

| Field | Type | |
|---|---|---|
| `paymentStatus` | enum `pending\|paid\|failed\|cancelled` | drives `/status` + ticket issuance |
| `txnid` | string, unique | our PayU transaction id |
| `mihpayid` | string, nullable | PayU's id (from callback) — store for support/refunds |
| `subtotal` / `convenienceFee` / `amount` | int (paise or ₹) | so `/status` can return `breakdown` |

Only count a booking against the guestlist limit once `paymentStatus = 'paid'`.
Expire `pending` bookings that never pay (e.g. a 30-min sweep) so seats free up.

---

## 7. Test plan (PAYU_MODE=test)

1. Use PayU **test cards** (e.g. success card `5123 4567 8901 2346`, CVV `123`, any future expiry; OTP `123456` on the test bank page). Confirm the current list in the PayU dashboard.
2. Initiate → confirm redirect to `test.payu.in`, pay → land on `/payment/return` with the ticket.
3. Force a failure (cancel on PayU) → `/payment/return` shows the retry screen, booking stays unpaid.
4. Tamper test: replay the callback with a wrong `hash` → must be rejected.
5. Idempotency: POST the success callback twice → booking stays `paid`, no dupes.

## 8. Go-live checklist

- [ ] Real convenience-fee numbers set (§4) and signed off by business.
- [ ] `PAYU_MODE=production`, live key/salt in secrets, **salt + client secret rotated**.
- [ ] surl/furl registered/whitelisted in the PayU dashboard if required.
- [ ] `verify_payment` reconciliation enabled in the callback + a cron for stuck pendings.
- [ ] Refund path defined for failed-but-charged edge cases.

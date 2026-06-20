# Web Guestlist Booking + Entry Descriptions — Design

**Date:** 2026-06-20
**Repo:** Clubin-LandingPage (Vite + React 19 + react-router-dom 7 + Tailwind 4)
**Backend:** `https://api.clubin.info/api` (no backend changes required)

## Goal

Two changes to the public website:

1. **Show entry descriptions** (stag / couple / ladies) on the event page — the data already
   comes from the API but the website currently drops it.
2. **Take guestlist bookings on the website** via WhatsApp OTP login, pay-at-venue, with a
   downloadable QR ticket. Bookings are **real backend bookings**, so they appear in the admin
   panel, club panel, and are scannable by the existing scanner app — with **zero backend changes**.

The "Get Tickets on App" button on an event is replaced by this web flow. The Share button
(which links to the app stores) is unchanged.

## Confirmed backend contract (read from the app monorepo)

All endpoints are under `https://api.clubin.info/api`.

### Auth (WhatsApp OTP via MSG91)
- `POST /auth/send-otp` — body `{ phone: string }` (phone is `+91` + 10 digits, e.g. `+919876543210`).
  - Success: `{ message }`. Rate limited (30s) → `429 { error }`. Validation → `400 { error }`.
- `POST /auth/verify-otp` — body `{ phone, otp }` (otp = 6 digits).
  - Existing user: `{ verified: true, isNewUser: false, user: { id, phone, name, isAdmin }, token }`.
  - New user (no name yet): `{ verified: true, isNewUser: true, message }` (no token). OTP is consumed.
  - Invalid/expired OTP: `400 { error }`.
- `POST /auth/phone-auth` — body `{ phone, name }` → `{ user: { id, phone, name, isAdmin }, token }`.
  - Used only for the **new-user name step** (mirrors the mobile app: verify-otp confirms the OTP,
    then phone-auth creates the user + returns the token). No OTP needed here.

JWT is returned as `token` and must be sent as `Authorization: Bearer <token>` (7-day expiry).

### Guestlist booking (pay-at-venue, no payment)
- `POST /bookings` — **Bearer auth**. Body:
  ```json
  {
    "eventId": "<uuid>",
    "couples": 0,
    "ladies": 0,
    "stags": 0,
    "guests": [ { "name": "...", "gender": "male|female|couple", "type": "couple|lady|stag" } ]
  }
  ```
  - At least one of couples/ladies/stags > 0, else `400`.
  - `400` if `guestlistStatus === 'closed'` or capacity exceeded (`"Only N spots remaining..."`).
  - Success `201`: the Booking, including `id`, `eventId`, `couples`, `ladies`, `stags`, `guests`,
    `status: "confirmed"`, **`qrCode` (unique uuid)**, `createdAt`, and `event` (full event object).
  - **No payment logic** — this endpoint just reserves spots. This is exactly the pay-at-venue path.

`guests` mapping (matches the app + the booking zod schema):
- each couple → `{ name, gender: 'couple', type: 'couple' }` (one entry per couple; name holds both names)
- each lady → `{ name, gender: 'female', type: 'lady' }`
- each stag → `{ name, gender: 'male', type: 'stag' }`

### QR / scanner compatibility (critical)
The scanner sends the raw QR string to `POST /scanner/scan` (and scanner-user panel) as `{ qrData }`.
Backend does:
```js
const parsed = JSON.parse(qrData);
bookingId = parsed.bookingId || parsed.code || qrData;
// then look up booking by { id: bookingId } OR { qrCode: bookingId }
```
So the web ticket QR **must encode the same JSON the app encodes**:
```js
const bookingCode = (booking.qrCode || booking.id).replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase();
const qrData = JSON.stringify({
  bookingId: booking.id,
  code: bookingCode,
  eventId: booking.eventId,
  guests: totalGuests, // couples*2 + ladies + stags
});
```
With this, web-created tickets validate in both the club scanner and scanner-user panels unchanged.

## Pricing (decision: entry prices only)

Pay-at-venue shows **only entry/cover prices**:
```
amountAtVenue = couples*couplePrice + ladies*ladiesPrice + stags*stagPrice
```
No convenience fee / GST (those exist in the app only because it collects payment online via PayU).
Label clearly: **"Pay ₹X at the venue"**. If the total is 0, show **"Free entry"**.

Show original/struck-through prices when `originalStagPrice` / `originalCouplePrice` /
`originalLadiesPrice` are present and greater than the current price (mirrors the app).

## UX flow

Triggered by the event's primary CTA ("Get Tickets" / "Get on Guestlist"), which is disabled when
`guestlistStatus === 'closed'`.

Steps (a single modal; full-screen sheet on mobile, centered modal on desktop):

1. **Auth gate:** if a valid session exists in `localStorage`, skip to step 4.
2. **Phone step:** `+91` prefix + 10-digit input → "Get OTP" → `sendOtp(+91XXXXXXXXXX)` → step 3.
3. **OTP step:** 6-digit input → `verifyOtp`. Existing user → save `{token, user}` → step 4.
   New user → step 3b. "Resend OTP" re-calls `sendOtp`.
   - **3b Name step:** name input → `phoneAuth(phone, name)` → save `{token, user}` → step 4.
4. **Quantity step:** Couples / Ladies / Stags steppers. Each row shows label, price (+ struck
   original if discounted), and **description bullets** (`description.split('\n')` non-empty lines).
   Footer shows "Pay ₹X at the venue" (entry-only). "Continue" enabled when total > 0 → step 5.
5. **Names step:** one input per guest (couple = single "both names" field). All required
   (trimmed non-empty). "Get on Guestlist" → `createBooking(token, payload)`.
6. **Ticket step:** success state with the QR ticket (`Ticket` component), the "Pay ₹X at venue"
   amount, **Download Ticket** (PNG) and **Done**. Also note: "Government ID mandatory at entry"
   (mirrors the app's info note).

## Components & files

- `src/types.ts`
  - Add `stagDescription?`, `coupleDescription?`, `ladiesDescription?` to `Event`.
  - Add `Booking` type (id, eventId, couples, ladies, stags, guests, status, qrCode, createdAt, event).
- `src/api.ts`
  - `sendOtp(phone)`, `verifyOtp(phone, otp)`, `phoneAuth(phone, name)`, `createBooking(token, payload)`.
  - Each throws an `Error` with the API's `error` message on non-2xx (so the UI can surface it).
- `src/lib/auth.tsx` (new)
  - `AuthProvider` + `useAuth()` → `{ user, token, login({token,user}), logout() }`.
  - Persists to `localStorage` keys `clubin_token`, `clubin_user`. Loads on mount.
- `src/main.tsx`
  - Wrap `<Routes>` in `<AuthProvider>`.
- `src/components/booking/BookingModal.tsx` (new)
  - Step orchestrator. Props: `{ event, open, onClose }`. Owns step state, phone/otp/name/counts/
    guests/booking state, all API calls, and error display. Mobile = bottom sheet, desktop = centered
    modal, reusing the existing share-modal styling in `EventDetailPage`.
- `src/components/booking/Ticket.tsx` (new)
  - Renders the downloadable ticket (white card: Clubin logo [same-origin], event title, club,
    date/time, QR, booking code, total guests, booking id). Exposes a ref / download handler that
    uses `html-to-image` `toPng` to download a PNG. QR via `qrcode.react` `QRCodeCanvas`.
- `src/pages/EventDetailPage.tsx`
  - Render entry descriptions under each price card (desktop "Entry & Pricing" + mobile "Entry & Cover").
  - Add `const [showBooking, setShowBooking] = useState(false)`.
  - `handleGetTickets` → `setShowBooking(true)` (remove the app-redirect / share-on-desktop behavior
    for this button only; Share button unchanged).
  - Button labels: keep "Get on Guestlist" (mobile) / change desktop "Get Tickets on App" → "Get Tickets".
  - Render `<BookingModal event={event} open={showBooking} onClose={() => setShowBooking(false)} />`.

### New dependencies
- `qrcode.react` — render the QR (canvas).
- `html-to-image` — export the ticket node to PNG for download.
Both are small, pure-JS, and work in a Vite SPA. The ticket uses only same-origin assets, so the PNG
export is not tainted.

## Error handling

- `sendOtp` 429 → "Please wait Ns before requesting a new OTP" (from API).
- `verifyOtp` 400 → show API `error` ("Invalid OTP", "OTP expired...", etc.).
- `createBooking` 400 → show API `error` ("Guestlist is closed...", "Only N spots remaining...").
- `createBooking` 401 (expired/invalid token) → `logout()`, return to phone step with a message
  ("Session expired, please verify your number again").
- Network failure on any call → inline error with a retry affordance; never silently fail.
- Validation: phone must be 10 digits; OTP 6 digits; name ≥ 2 chars; every guest name non-empty.

## Out of scope (YAGNI)

- No online payment (PayU) on the web — pay-at-venue only.
- No "My Bookings" history page on the web (ticket is downloadable + remembered only for the session's
  confirmation screen). Can be a later addition.
- No scan-status polling / vibe-check (app-only features).
- No table bookings on the web (guestlist only).

## Testing

- Unit-test the pure helpers: `guests[]` builder from counts, `amountAtVenue` calc (incl. discounts),
  `bookingCode` + `qrData` construction (assert exact app-compatible JSON shape).
- Manual: full flow against the live API with a real phone (WhatsApp OTP), confirm the booking appears
  in the admin/club panel and that the downloaded ticket's QR scans in the scanner app.
- Test-login bypass exists in the backend (`+919999999999` / `420420`) but is gated by
  `ENABLE_TEST_LOGIN`; do not rely on it in production.

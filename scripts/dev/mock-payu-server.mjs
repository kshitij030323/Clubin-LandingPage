// Local DEV-ONLY mock of the PayU payment backend + a fake hosted-checkout page.
//
// It lets you click the entire web pay flow (Review & Pay → "PayU" → ticket)
// before the real api.clubin.info endpoints exist. It is NOT the production
// backend — see docs/payments/ for the real implementation.
//
// Run:  node scripts/dev/mock-payu-server.mjs
// Then set .env.local → VITE_PAYMENTS_API_BASE=http://localhost:5174/api and
// restart `npm run dev`. The frontend (api.ts) only honours that override in dev.

import http from 'node:http';
import crypto from 'node:crypto';

const PORT = 5174;
const FRONTEND = 'http://localhost:5173';
const REAL_API = 'https://api.clubin.info/api';

// Mirror the reference backend's default fee (docs/payments §4).
// In production the convenience fee is admin-controlled; this is a placeholder.
const FEE_FLAT = 20;
// 18% GST on the ticket subtotal, split CGST 9% + SGST 9%.
const GST_RATE = 0.18;

// ── Real-PayU mode ──────────────────────────────────────────────
// If PAYU_KEY + PAYU_SALT are provided in the launch env, this mock signs a
// genuine PayU request and the frontend redirects to PayU's *real* hosted
// checkout. Secrets are read from env only — never hardcoded/committed.
// Without them, it falls back to the local fake-checkout page.
const PAYU_KEY = process.env.PAYU_KEY;
const PAYU_SALT = process.env.PAYU_SALT;
const PAYU_MODE = process.env.PAYU_MODE ?? 'production'; // these creds only work on prod
const PAYU_BASE = PAYU_MODE === 'production' ? 'https://secure.payu.in' : 'https://test.payu.in';
// Safety cap: when set (e.g. PAYU_TEST_AMOUNT=1), every real request is ₹1 so an
// accidental completed payment costs ₹1, not the full booking amount.
const TEST_AMOUNT = process.env.PAYU_TEST_AMOUNT ? Number(process.env.PAYU_TEST_AMOUNT) : null;
// PayU posts the result here after payment (must be a domain on your PayU account).
const SURL = process.env.PAYU_SURL ?? 'https://clubin.co.in/payment/return';
const REAL_PAYU = Boolean(PAYU_KEY && PAYU_SALT);

const sha512 = (s) => crypto.createHash('sha512').update(s).digest('hex');
function payuRequestHash(p) {
    return sha512([
        p.key, p.txnid, p.amount, p.productinfo, p.firstname, p.email,
        p.udf1 ?? '', p.udf2 ?? '', p.udf3 ?? '', p.udf4 ?? '', p.udf5 ?? '',
        '', '', '', '', '', PAYU_SALT,
    ].join('|'));
}
// Reverse hash PayU sends back on surl/furl:
// sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
function payuResponseHashValid(b) {
    const parts = [
        PAYU_SALT, b.status ?? '', '', '', '', '', '',
        b.udf5 ?? '', b.udf4 ?? '', b.udf3 ?? '', b.udf2 ?? '', b.udf1 ?? '',
        b.email ?? '', b.firstname ?? '', b.productinfo ?? '', b.amount ?? '', b.txnid ?? '', b.key ?? '',
    ];
    if (b.additionalCharges) parts.unshift(b.additionalCharges);
    return sha512(parts.join('|')) === (b.hash ?? '').toLowerCase();
}

/** @type {Map<string, any>} bookingId -> { eventId, counts, guests, breakdown, status, event }} */
const bookings = new Map();

const cors = (res) => {
    res.setHeader('Access-Control-Allow-Origin', FRONTEND);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};
const json = (res, code, body) => {
    cors(res);
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
};
const readBody = (req) => new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => resolve(data));
});

async function fetchEvent(id) {
    try {
        const r = await fetch(`${REAL_API}/events/${id}`);
        if (r.ok) return await r.json();
    } catch { /* ignore — fall back to a stub */ }
    return { id, title: 'Test Event', club: 'Test Club', date: new Date().toISOString(), startTime: '21:00' };
}

// After a verified payment, create the booking on the REAL backend so it shows
// up in the guestlist (this is what the production callback must do).
async function createRealBooking(token, rec) {
    const r = await fetch(`${REAL_API}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
            eventId: rec.eventId, couples: rec.couples, ladies: rec.ladies, stags: rec.stags, guests: rec.guests,
        }),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) throw new Error((data && (data.error || data.message)) || `createBooking failed (HTTP ${r.status})`);
    return data;
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }

    // ── POST /api/payments/initiate ──────────────────────────────
    if (req.method === 'POST' && url.pathname === '/api/payments/initiate') {
        const payload = JSON.parse((await readBody(req)) || '{}');
        // The user's real JWT — used after payment to create the booking on the
        // real backend so it lands in the guestlist (mirrors the prod callback).
        const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
        const { eventId, couples = 0, ladies = 0, stags = 0, guests = [] } = payload;
        const event = await fetchEvent(eventId);
        const subtotal =
            couples * (event.couplePrice ?? 0) +
            ladies * (event.ladiesPrice ?? 0) +
            stags * (event.stagPrice ?? 0);
        const convenienceFee = 0; // removed for now — GST only (revisit later)
        const cgst = Math.round((subtotal * GST_RATE) / 2);
        const sgst = Math.round((subtotal * GST_RATE) / 2);
        // Use the ₹1 safety cap (if set) for the real-PayU test, else the real total.
        const total = TEST_AMOUNT != null ? TEST_AMOUNT : Math.max(1, subtotal + convenienceFee + cgst + sgst);
        const breakdown = TEST_AMOUNT != null
            ? { subtotal: 0, convenienceFee: TEST_AMOUNT, cgst: 0, sgst: 0, total: TEST_AMOUNT }
            : { subtotal, convenienceFee, cgst, sgst, total };
        const amount = total.toFixed(2);

        const bookingId = crypto.randomUUID();
        const txnid = `CLB-${REAL_PAYU ? 'TEST' : 'MOCK'}-${bookingId.replace(/-/g, '').slice(0, 18)}`;
        bookings.set(bookingId, { eventId, couples, ladies, stags, guests, breakdown, status: 'pending', event, token });

        if (REAL_PAYU) {
            // Sign a genuine PayU request → frontend posts it to the REAL hosted checkout.
            const base = {
                key: PAYU_KEY, txnid, amount,
                productinfo: `Guestlist: ${event.title}`.slice(0, 100),
                firstname: 'Guest', email: 'guest@clubin.co.in', phone: '9999999999',
                surl: SURL, furl: SURL,
                udf1: bookingId,
            };
            const params = { ...base, hash: payuRequestHash(base) };
            console.log(`[mock-payu] REAL initiate → ${PAYU_BASE}/_payment  booking ${bookingId}  ₹${amount}`);
            return json(res, 200, { bookingId, txnid, amount, breakdown, action: `${PAYU_BASE}/_payment`, params });
        }

        console.log(`[mock-payu] FAKE initiate → booking ${bookingId}  ₹${amount}`);
        return json(res, 200, {
            bookingId,
            txnid,
            amount,
            breakdown,
            action: `http://localhost:${PORT}/mock-payu?bookingId=${bookingId}`,
            params: { key: 'MOCK', txnid, amount, udf1: bookingId },
        });
    }

    // ── GET /api/payments/status?bookingId= ──────────────────────
    if (req.method === 'GET' && url.pathname === '/api/payments/status') {
        const bookingId = url.searchParams.get('bookingId');
        const b = bookings.get(bookingId);
        if (!b) return json(res, 404, { error: 'Booking not found' });
        // Prefer the REAL booking (real id + QR that the venue scanner recognises);
        // fall back to a synthesized one if the real-create hasn't happened.
        const booking = b.realBooking
            ? { ...b.realBooking, event: b.realBooking.event ?? b.event }
            : {
                id: bookingId,
                eventId: b.eventId,
                couples: b.couples, ladies: b.ladies, stags: b.stags,
                guests: b.guests,
                status: b.status === 'paid' ? 'confirmed' : b.status,
                qrCode: bookingId,
                createdAt: new Date().toISOString(),
                event: b.event,
            };
        return json(res, 200, { bookingId, paymentStatus: b.status, breakdown: b.breakdown, booking });
    }

    // ── POST /payu/callback ← REAL PayU posts the result here (surl/furl) ──
    if (req.method === 'POST' && url.pathname === '/payu/callback') {
        const b = Object.fromEntries(new URLSearchParams(await readBody(req)));
        const bookingId = b.udf1;
        const hashOk = payuResponseHashValid(b);
        const paid = hashOk && b.status === 'success';
        const rec = bookings.get(bookingId);
        if (rec) {
            rec.status = paid ? 'paid' : 'failed';
            // On verified success, write the booking to the real backend → guestlist.
            if (paid && rec.token && !rec.realBooking) {
                try {
                    rec.realBooking = await createRealBooking(rec.token, rec);
                    console.log(`[mock-payu] ✓ real booking created on api.clubin.info → id=${rec.realBooking?.id} qr=${rec.realBooking?.qrCode} (now in guestlist)`);
                } catch (e) {
                    console.log(`[mock-payu] ⚠ FAILED to create real booking: ${e.message}`);
                }
            }
        }
        console.log(`[mock-payu] callback booking=${bookingId} payu_status=${b.status} hashOk=${hashOk} → ${rec?.status ?? '(unknown booking)'}`);
        res.writeHead(302, { Location: `${FRONTEND}/payment/return?bookingId=${bookingId ?? ''}&status=${paid ? 'success' : 'failure'}` });
        return res.end();
    }

    // ── POST /mock-payu  → fake hosted-checkout page ─────────────
    if (req.method === 'POST' && url.pathname === '/mock-payu') {
        const bookingId = url.searchParams.get('bookingId');
        const b = bookings.get(bookingId);
        const amount = b ? b.breakdown.total : 0;
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mock PayU Checkout</title><style>
body{font-family:system-ui;background:#0a0a0a;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
.card{background:#120f1d;border:1px solid #7c3aed33;border-radius:16px;padding:28px;max-width:380px;width:90%;text-align:center}
h1{font-size:18px;margin:0 0 4px}.amt{font-size:34px;font-weight:800;color:#c4b5fd;margin:10px 0 4px}
.tag{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#888;margin-bottom:18px}
button{width:100%;padding:14px;border:0;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-top:10px}
.ok{background:#22c55e;color:#06240f}.no{background:#ffffff14;color:#fff}
</style></head><body><div class="card">
<div class="tag">⚠ Mock PayU — dev only</div>
<h1>Pay for your guestlist</h1>
<div class="amt">₹${amount}</div>
<form method="GET" action="/mock-payu/complete">
  <input type="hidden" name="bookingId" value="${bookingId ?? ''}">
  <button class="ok" name="result" value="success">Simulate successful payment</button>
  <button class="no" name="result" value="failure">Simulate failure / cancel</button>
</form></div></body></html>`);
    }

    // ── GET /mock-payu/complete → mark + redirect like a real callback ──
    if (req.method === 'GET' && url.pathname === '/mock-payu/complete') {
        const bookingId = url.searchParams.get('bookingId');
        const result = url.searchParams.get('result');
        const b = bookings.get(bookingId);
        if (b) b.status = result === 'success' ? 'paid' : 'failed';
        console.log(`[mock-payu] callback → booking ${bookingId} = ${b?.status}`);
        res.writeHead(302, { Location: `${FRONTEND}/payment/return?bookingId=${bookingId}&status=${result}` });
        return res.end();
    }

    cors(res);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => console.log(`[mock-payu] listening on http://localhost:${PORT} (dev mock — not production)`));

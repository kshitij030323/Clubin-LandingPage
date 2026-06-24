/**
 * PayU Hosted Checkout — backend reference implementation.
 *
 * ⚠️ This file lives in docs/ and is NOT part of the frontend build. It is a
 * ready-to-adapt reference for the api.clubin.info backend. Copy it there,
 * wire the `db` calls to your real ORM, and mount the router.
 *
 * Pairs with: docs/payments/payu-backend-integration.md
 * Frontend contract: src/types.ts (PaymentInitiateResponse, PaymentStatusResponse)
 *
 * Deps: express, and Node's built-in `crypto`. To verify payments server-side
 * you'll also want a fetch (Node 18+ has global fetch).
 */

import crypto from 'node:crypto';
import express, { type Request, type Response } from 'express';

// ───────────────────────── config (from env) ─────────────────────────

const PAYU_MODE = process.env.PAYU_MODE ?? 'test'; // 'test' | 'production'
const PAYU_MERCHANT_KEY = required('PAYU_MERCHANT_KEY');
const PAYU_SALT = required('PAYU_SALT'); // server-only secret — never sent to the client
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'https://clubin.co.in';
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? 'https://api.clubin.info';

// 18% GST on the ticket subtotal, split CGST 9% + SGST 9%.
const GST_PERCENT = Number(process.env.GST_PERCENT ?? 18);
// Convenience fee is admin-controlled (per event / global setting). This is the
// fallback when none is configured.
const DEFAULT_CONVENIENCE_FEE = Number(process.env.DEFAULT_CONVENIENCE_FEE ?? 20);

const PAYU_BASE = PAYU_MODE === 'production' ? 'https://secure.payu.in' : 'https://test.payu.in';
const PAYU_ACTION = `${PAYU_BASE}/_payment`;
const PAYU_VERIFY_URL = 'https://info.payu.in/merchant/postservice.php?form=2';
const CALLBACK_URL = `${BACKEND_BASE_URL}/api/payments/payu/callback`;

function required(name: string): string {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required env var ${name}`);
    return v;
}

// ───────────────────────── hashing ─────────────────────────

const sha512 = (s: string) => crypto.createHash('sha512').update(s).digest('hex');

/**
 * Request hash:
 * sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 * Note the 5 empty fields (the `||||||`) between udf5 and the salt.
 */
function requestHash(p: {
    key: string; txnid: string; amount: string; productinfo: string;
    firstname: string; email: string;
    udf1?: string; udf2?: string; udf3?: string; udf4?: string; udf5?: string;
}): string {
    const seq = [
        p.key, p.txnid, p.amount, p.productinfo, p.firstname, p.email,
        p.udf1 ?? '', p.udf2 ?? '', p.udf3 ?? '', p.udf4 ?? '', p.udf5 ?? '',
        '', '', '', '', '', // 5 empty udf6–udf10 placeholders
        PAYU_SALT,
    ].join('|');
    return sha512(seq);
}

/**
 * Verify PayU's response hash (reverse order):
 * sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 * If the body contains `additionalCharges`, it is prepended to the sequence.
 */
function verifyResponseHash(b: Record<string, string>): boolean {
    const parts = [
        PAYU_SALT, b.status ?? '',
        '', '', '', '', '', // 5 empty placeholders
        b.udf5 ?? '', b.udf4 ?? '', b.udf3 ?? '', b.udf2 ?? '', b.udf1 ?? '',
        b.email ?? '', b.firstname ?? '', b.productinfo ?? '', b.amount ?? '',
        b.txnid ?? '', b.key ?? '',
    ];
    if (b.additionalCharges) parts.unshift(b.additionalCharges);
    const expected = sha512(parts.join('|'));
    // Constant-time compare to avoid timing leaks.
    const a = Buffer.from(expected);
    const c = Buffer.from((b.hash ?? '').toLowerCase());
    return a.length === c.length && crypto.timingSafeEqual(a, c);
}

// ───────────────────────── amount / fee ─────────────────────────

function computeBreakdown(subtotal: number, convenienceFee: number) {
    // 18% GST on the ticket subtotal, split half CGST / half SGST.
    const cgst = Math.round((subtotal * GST_PERCENT) / 200);
    const sgst = Math.round((subtotal * GST_PERCENT) / 200);
    const total = Math.max(1, subtotal + convenienceFee + cgst + sgst); // PayU minimum ₹1
    return { subtotal, convenienceFee, cgst, sgst, total };
}

// Derive PayU-required fields from a phone-only user (no email collected on web).
function payerFields(user: { name: string; phone: string; email?: string | null }) {
    const firstname = (user.name?.trim().split(/\s+/)[0] || 'Guest').slice(0, 60);
    const digits = (user.phone || '').replace(/\D/g, '');
    const phone = digits.slice(-10) || digits;
    // ⚠️ PayU needs an email. Prefer a real one; fall back to a derived placeholder.
    const email = user.email?.trim() || `${phone || 'guest'}@guests.clubin.co.in`;
    return { firstname, email, phone };
}

// ───────────────────────── DB seam (wire to your ORM) ─────────────────────────
//
// Replace this with your real data layer. These are the only persistence
// operations the endpoints need.
declare const db: {
    getEvent(id: string): Promise<{
        id: string; title: string; guestlistStatus: string;
        couplePrice: number; ladiesPrice: number; stagPrice: number;
        convenienceFee?: number | null; // admin-controlled; falls back to DEFAULT_CONVENIENCE_FEE
    } | null>;
    createPendingBooking(input: {
        userId: string; eventId: string; couples: number; ladies: number; stags: number;
        guests: unknown[]; txnid: string; subtotal: number; convenienceFee: number; amount: number;
    }): Promise<{ id: string }>;
    getBookingByTxnidOrId(opts: { txnid?: string; id?: string }): Promise<{
        id: string; userId: string; eventId: string; amount: number; paymentStatus: string;
    } | null>;
    markPaid(bookingId: string, mihpayid: string): Promise<void>;
    markFailed(bookingId: string): Promise<void>;
    getBookingForUser(bookingId: string, userId: string): Promise<{
        id: string; paymentStatus: 'pending' | 'paid' | 'failed' | 'cancelled';
        subtotal: number; convenienceFee: number; amount: number;
        booking: unknown; // full booking incl. event + guests for the ticket
    } | null>;
};

// Your existing Bearer-auth middleware that sets req.user = { id, name, phone, email? }.
declare function requireAuth(req: Request, res: Response, next: () => void): void;
type AuthedRequest = Request & { user: { id: string; name: string; phone: string; email?: string | null } };

// ───────────────────────── routes ─────────────────────────

export const paymentsRouter = express.Router();

/** POST /api/payments/initiate */
paymentsRouter.post('/initiate', requireAuth, async (req: Request, res: Response) => {
    const { user } = req as AuthedRequest;
    const { eventId, couples = 0, ladies = 0, stags = 0, guests = [] } = req.body ?? {};

    const event = await db.getEvent(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (!['open', 'closing'].includes(event.guestlistStatus)) {
        return res.status(409).json({ error: 'Guestlist is closed for this event' });
    }
    if (couples + ladies + stags <= 0) return res.status(400).json({ error: 'Select at least one guest' });

    const subtotal = couples * event.couplePrice + ladies * event.ladiesPrice + stags * event.stagPrice;
    const convenienceFee = event.convenienceFee ?? DEFAULT_CONVENIENCE_FEE; // admin-controlled
    const breakdown = computeBreakdown(subtotal, convenienceFee);
    const amount = breakdown.total.toFixed(2);

    // txnid must be unique and ≤ 64 chars.
    const txnid = `CLB-${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
    const booking = await db.createPendingBooking({
        userId: user.id, eventId, couples, ladies, stags, guests,
        txnid, subtotal, convenienceFee: breakdown.convenienceFee, amount: breakdown.total,
    });

    const { firstname, email, phone } = payerFields(user);
    const base = {
        key: PAYU_MERCHANT_KEY,
        txnid,
        amount,
        productinfo: `Guestlist: ${event.title}`.slice(0, 100),
        firstname,
        email,
        phone,
        surl: CALLBACK_URL,
        furl: CALLBACK_URL,
        udf1: booking.id,
        udf2: eventId,
        udf3: user.id,
    };
    const hash = requestHash(base);

    const response = {
        bookingId: booking.id,
        txnid,
        amount,
        breakdown,
        action: PAYU_ACTION,
        params: { ...base, hash }, // posted verbatim by the browser
    };
    return res.json(response);
});

/** POST /api/payments/payu/callback  (mounted as both surl and furl) */
paymentsRouter.post('/payu/callback', express.urlencoded({ extended: true }), async (req: Request, res: Response) => {
    const body = req.body as Record<string, string>;
    const bookingId = body.udf1;

    const fail = () => res.redirect(302, `${FRONTEND_URL}/payment/return?bookingId=${encodeURIComponent(bookingId ?? '')}&status=failure`);

    // 1. Verify the response hash. A bad hash = never trust this POST.
    if (!verifyResponseHash(body)) return fail();

    // 2. Match to our booking and re-check the amount.
    const booking = await db.getBookingByTxnidOrId({ txnid: body.txnid, id: bookingId });
    if (!booking) return fail();
    if (Number(body.amount) !== Number(booking.amount.toFixed?.(2) ?? booking.amount)) return fail();

    // 3. Idempotent success handling.
    if (booking.paymentStatus === 'paid') {
        return res.redirect(302, `${FRONTEND_URL}/payment/return?bookingId=${booking.id}&status=success`);
    }

    if (body.status === 'success') {
        // 4. (Recommended) Double-confirm with PayU before fulfilling.
        const confirmed = await verifyPaymentWithPayU(body.txnid);
        if (!confirmed) return fail();
        await db.markPaid(booking.id, body.mihpayid);
        return res.redirect(302, `${FRONTEND_URL}/payment/return?bookingId=${booking.id}&status=success`);
    }

    await db.markFailed(booking.id);
    return fail();
});

/** GET /api/payments/status?bookingId=… */
paymentsRouter.get('/status', requireAuth, async (req: Request, res: Response) => {
    const { user } = req as AuthedRequest;
    const bookingId = String(req.query.bookingId ?? '');
    if (!bookingId) return res.status(400).json({ error: 'bookingId required' });

    const row = await db.getBookingForUser(bookingId, user.id);
    if (!row) return res.status(404).json({ error: 'Booking not found' });

    return res.json({
        bookingId: row.id,
        paymentStatus: row.paymentStatus,
        booking: row.booking,
        breakdown: computeBreakdownFromRow(row),
    });
});

function computeBreakdownFromRow(row: { subtotal: number; convenienceFee: number; amount: number }) {
    const gst = Math.max(0, row.amount - row.subtotal - row.convenienceFee);
    const cgst = Math.round(gst / 2);
    return { subtotal: row.subtotal, convenienceFee: row.convenienceFee, cgst, sgst: gst - cgst, total: row.amount };
}

// ───────────────────────── verify_payment (server-to-server) ─────────────────────────

/**
 * Confirm a transaction directly with PayU so a forged callback can never
 * confirm a booking. hash = sha512(key|command|var1|SALT).
 */
async function verifyPaymentWithPayU(txnid: string): Promise<boolean> {
    const command = 'verify_payment';
    const hash = sha512(`${PAYU_MERCHANT_KEY}|${command}|${txnid}|${PAYU_SALT}`);
    const formBody = new URLSearchParams({ key: PAYU_MERCHANT_KEY, command, var1: txnid, hash });

    const resp = await fetch(PAYU_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString(),
    });
    if (!resp.ok) return false;
    const data = (await resp.json()) as { status?: number; transaction_details?: Record<string, { status?: string }> };
    const tx = data?.transaction_details?.[txnid];
    return tx?.status === 'success';
}

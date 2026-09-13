import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { threeWorkingDays } from '../../../lib/payments';

export const runtime = 'nodejs';

/**
 * Payment webhook → order ledger.
 *
 * The failure this exists to prevent: a customer pays, the notification lands
 * in an inbox nobody checks, and the order is gone. They waited three working
 * days for a thing we promised, got nothing, and have no way to reach us. That
 * is the single worst way to lose a first paying customer.
 *
 * IDEMPOTENCY. Providers retry on timeouts, on non-2xx responses, and sometimes
 * for no reason. The UNIQUE constraint on `provider_event_id` makes duplicates
 * impossible at the database level rather than hoping handler logic is right —
 * and crucially we return 2xx on the duplicate path, because a non-2xx tells
 * the provider to retry forever.
 */

interface OrderRow {
    provider_event_id: string;
    provider: string;
    amount_minor: number;
    currency: string;
    customer_email: string;
    chart_params: string;
    guna_total: number | null;
    due_at: string;
}

/**
 * Constant-time signature check.
 *
 * Razorpay and Stripe both sign the raw body with a shared secret. We verify
 * against the RAW bytes, never a re-serialised object — re-rendering JSON
 * changes whitespace and key order and silently breaks the comparison.
 */
function signatureValid(raw: string, header: string | null, secret: string): boolean {
    if (!header) return false;
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(header, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;

    // Read the raw body ONCE, before any parsing, so the signature is checked
    // against exactly the bytes that were signed.
    const raw = await request.text();

    if (!secret) {
        console.error('[webhook] PAYMENT_WEBHOOK_SECRET not set — refusing to process');
        return NextResponse.json({ ok: false }, { status: 503 });
    }

    const header =
        request.headers.get('x-razorpay-signature') ??
        request.headers.get('stripe-signature');

    if (!signatureValid(raw, header, secret)) {
        console.warn('[webhook] bad signature, rejecting');
        return NextResponse.json({ ok: false }, { status: 401 });
    }

    let payload: Record<string, unknown>;
    try {
        payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    const eventId =
        (payload.id as string | undefined) ??
        (payload.event_id as string | undefined);
    const notes = (payload.notes ?? {}) as Record<string, string>;

    if (!eventId || !notes.chart_params || !notes.email) {
        console.error('[webhook] payload missing event id, chart_params or email');
        // 400, not 500: the provider should not retry a malformed payload.
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    const row: OrderRow = {
        provider_event_id: eventId,
        provider: (payload.provider as string | undefined) ?? 'unknown',
        amount_minor: Number(payload.amount ?? 0),
        currency: (payload.currency as string | undefined) ?? 'INR',
        customer_email: notes.email,
        chart_params: notes.chart_params,
        guna_total: notes.guna_total ? Number(notes.guna_total) : null,
        due_at: threeWorkingDays().toISOString(),
    };

    if (!url || !key) {
        // No ledger configured. Log loudly and still return 2xx — a retry storm
        // would not create the table either.
        console.error('[webhook] NO LEDGER CONFIGURED, order recorded to log only', row);
        return NextResponse.json({ ok: true, recorded: 'log' });
    }

    const res = await fetch(`${url}/rest/v1/review_orders`, {
        method: 'POST',
        headers: {
            apikey: key,
            authorization: `Bearer ${key}`,
            'content-type': 'application/json',
            prefer: 'return=minimal',
        },
        body: JSON.stringify(row),
    });

    if (res.status === 409) {
        // Duplicate — the UNIQUE constraint did its job. This is SUCCESS, not
        // failure. Returning anything but 2xx here makes the provider retry
        // forever against a constraint that will always reject it.
        console.info('[webhook] duplicate event, already recorded:', eventId);
        return NextResponse.json({ ok: true, duplicate: true });
    }

    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        console.error('[webhook] ledger write failed', res.status, detail);
        // 500 so the provider DOES retry — this order is not recorded anywhere
        // yet and losing it is the exact failure mode we are preventing.
        return NextResponse.json({ ok: false }, { status: 500 });
    }

    console.info('[webhook] order recorded:', eventId, 'due', row.due_at);
    return NextResponse.json({ ok: true });
}

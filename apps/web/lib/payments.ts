/**
 * Payment configuration.
 *
 * The pay button sits behind an env flag so money can be switched off without a
 * deploy. That is the one lever you want in a hurry, and it is the difference
 * between a bad hour and a bad day.
 *
 * PRICE IS UNRESOLVED. It is deliberately read from the environment rather than
 * hardcoded, because nobody has named it yet — and an unnamed price makes the
 * willingness-to-pay result uninterpretable. Anchor it against what a family
 * pandit charges per consultation, since that is the substitute good.
 */

export interface PaymentConfig {
    /** Whether the pay button does anything. Default OFF. */
    live: boolean;
    /** Minor units, e.g. paise. Zero when unset. */
    amountMinor: number;
    currency: string;
    /** Hosted checkout link. No card data ever touches this app. */
    checkoutUrl: string | null;
}

export function paymentConfig(): PaymentConfig {
    const live = process.env.PAYMENTS_LIVE === 'true';
    const amountMinor = Number(process.env.REVIEW_PRICE_MINOR ?? 0);
    return {
        live: live && amountMinor > 0 && Boolean(process.env.CHECKOUT_URL),
        amountMinor,
        currency: process.env.REVIEW_CURRENCY ?? 'INR',
        checkoutUrl: process.env.CHECKOUT_URL ?? null,
    };
}

export function formatPrice(cfg: PaymentConfig): string | null {
    if (cfg.amountMinor <= 0) return null;
    const major = cfg.amountMinor / 100;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: cfg.currency,
        maximumFractionDigits: 0,
    }).format(major);
}

/**
 * The service promise, in one place.
 *
 * Printed on the page BEFORE the button, not after the first complaint. A
 * promise with no ledger behind it is a promise you cannot keep on purpose —
 * see api/payment-webhook.
 */
export const TURNAROUND = '3 working days';
export const REFUND = 'Full refund on request, no questions asked.';

/**
 * Three working days from now, skipping Saturday and Sunday.
 *
 * The page promises "3 working days", so this is the promise in code. Kept here
 * rather than in the webhook route so it can be tested — an SLA you cannot test
 * is an SLA you cannot keep on purpose.
 */
export function threeWorkingDays(from: Date = new Date()): Date {
    const d = new Date(from);
    let added = 0;
    while (added < 3) {
        d.setUTCDate(d.getUTCDate() + 1);
        const day = d.getUTCDay();
        if (day !== 0 && day !== 6) added++;
    }
    return d;
}

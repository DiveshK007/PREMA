import { describe, it, expect, afterEach } from 'vitest';
import { threeWorkingDays, paymentConfig, formatPrice } from '../lib/payments';

describe('the SLA is the promise, in code', () => {
    it('skips the weekend', () => {
        // Friday 11 September 2026 -> Wednesday 16th, not Monday 14th.
        const fri = new Date('2026-09-11T10:00:00Z');
        expect(threeWorkingDays(fri).toISOString().slice(0, 10)).toBe('2026-09-16');
    });

    it('never lands on a Saturday or Sunday', () => {
        for (let i = 0; i < 30; i++) {
            const start = new Date(Date.UTC(2026, 8, 1 + i, 9, 0));
            const due = threeWorkingDays(start).getUTCDay();
            expect(due).not.toBe(0);
            expect(due).not.toBe(6);
        }
    });

    it('is always at least three days out', () => {
        for (let i = 0; i < 30; i++) {
            const start = new Date(Date.UTC(2026, 8, 1 + i, 9, 0));
            const days = (threeWorkingDays(start).getTime() - start.getTime()) / 86400000;
            expect(days).toBeGreaterThanOrEqual(3);
            expect(days).toBeLessThanOrEqual(5); // at most, crossing one weekend
        }
    });
});

describe('payments are off unless every switch is set', () => {
    const saved = { ...process.env };
    afterEach(() => {
        process.env = { ...saved };
    });

    it('is off with nothing configured', () => {
        delete process.env.PAYMENTS_LIVE;
        delete process.env.REVIEW_PRICE_MINOR;
        delete process.env.CHECKOUT_URL;
        expect(paymentConfig().live).toBe(false);
    });

    it('stays off when the flag is on but no price is named', () => {
        process.env.PAYMENTS_LIVE = 'true';
        process.env.CHECKOUT_URL = 'https://pay.example/x';
        delete process.env.REVIEW_PRICE_MINOR;
        // An unnamed price makes the willingness-to-pay result uninterpretable,
        // so it must not be possible to take money without one.
        expect(paymentConfig().live).toBe(false);
    });

    it('stays off when the flag is on but there is no checkout link', () => {
        process.env.PAYMENTS_LIVE = 'true';
        process.env.REVIEW_PRICE_MINOR = '49900';
        delete process.env.CHECKOUT_URL;
        expect(paymentConfig().live).toBe(false);
    });

    it('goes live only when flag, price and link are all present', () => {
        process.env.PAYMENTS_LIVE = 'true';
        process.env.REVIEW_PRICE_MINOR = '49900';
        process.env.CHECKOUT_URL = 'https://pay.example/x';
        const cfg = paymentConfig();
        expect(cfg.live).toBe(true);
        expect(formatPrice(cfg)).toContain('499');
    });
});

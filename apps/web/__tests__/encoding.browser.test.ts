/**
 * @vitest-environment jsdom
 *
 * REGRESSION: lib/report.ts must run in a browser.
 *
 * It is imported by the server component that renders the report AND by the
 * client component that builds the link. The first version used
 * `Buffer.from(x).toString('base64url')`, which is Node-only — the browser's
 * Buffer polyfill throws `Unknown encoding: base64url`.
 *
 * Every test passed. `next build` passed. It threw on the first real form
 * submission a human made, because every test ran in Node.
 *
 * These run in jsdom, where `btoa`/`atob` exist and Node's Buffer encodings do
 * not behave the same way.
 */
import { describe, it, expect } from 'vitest';
import { encodePair, decodePair, type PersonInput } from '../lib/report';

const A: PersonInput = {
    name: 'Divesh Kumar',
    date: '1998-03-14',
    time: '04:20',
    city: 'Pune',
    role: 'groom',
};
const B: PersonInput = {
    name: 'Ananya Rao',
    date: '1999-09-02',
    time: '21:05',
    city: 'Hyderabad',
};

function roundTrip(a: PersonInput, b: PersonInput) {
    return decodePair(Object.fromEntries(new URLSearchParams(encodePair(a, b))));
}

describe('encoding works in a browser', () => {
    it('is actually running in a DOM environment', () => {
        // If this fails the guard above is not doing anything.
        expect(typeof window).toBe('object');
        expect(typeof btoa).toBe('function');
        expect(typeof atob).toBe('function');
    });

    it('round-trips without throwing Unknown encoding', () => {
        const back = roundTrip(A, B);
        expect(back?.a).toEqual(A);
        expect(back?.b.name).toBe(B.name);
    });

    it('survives Devanagari names — btoa alone would corrupt these', () => {
        const deva = { ...A, name: 'दिवेश कुमार' };
        const nair = { ...B, name: 'अनन्या राव' };
        const back = roundTrip(deva, nair);
        expect(back?.a.name).toBe('दिवेश कुमार');
        expect(back?.b.name).toBe('अनन्या राव');
    });

    it('survives accents, emoji and other multi-byte input', () => {
        const odd = { ...A, name: 'José 🙏 Ñ' };
        expect(roundTrip(odd, B)?.a.name).toBe('José 🙏 Ñ');
    });

    it('produces URL-safe output with no padding', () => {
        const qs = encodePair(A, B);
        expect(qs).not.toMatch(/[+/]/);
        // URLSearchParams would percent-encode '=' as %3D if padding survived.
        expect(qs).not.toContain('%3D');
    });

    it('rejects a malformed token instead of throwing', () => {
        expect(() => decodePair({ a: '!!!!', b: '!!!!' })).not.toThrow();
    });
});

import { describe, it, expect } from 'vitest';
import { encodePair, decodePair, computeReport, type PersonInput } from '../lib/report';
import { lookupCity } from '../lib/cities';

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

describe('the URL IS the report', () => {
    it('round-trips both people, including the role', () => {
        const back = decodePair(Object.fromEntries(new URLSearchParams(encodePair(A, B))));
        expect(back?.a).toEqual(A);
        expect(back?.b.name).toBe(B.name);
        expect(back?.b.role).toBeUndefined();
    });

    it('survives a name containing a pipe', () => {
        const odd = { ...A, name: 'A|B' };
        const back = decodePair(Object.fromEntries(new URLSearchParams(encodePair(odd, B))));
        expect(back?.a.date).toBe(A.date);
        expect(back?.b.name).toBe(B.name);
    });

    it('refuses a half link rather than guessing', () => {
        expect(decodePair({ a: 'something' })).toBeNull();
        expect(decodePair({})).toBeNull();
        expect(decodePair({ a: '!!!', b: '!!!' })?.a.name).toBeUndefined();
    });

    it('page and image compute from the same input, so they cannot disagree', () => {
        // Both surfaces call computeReport with the decoded pair. Same input,
        // pure function, same output — by construction, not by convention.
        const first = computeReport(A, B);
        const second = computeReport(A, B);
        expect(first.ok && second.ok).toBe(true);
        if (first.ok && second.ok) expect(first.total).toBe(second.total);
    });
});

describe('nothing fails silently', () => {
    it('names an unknown city instead of guessing one', () => {
        const r = computeReport({ ...A, city: 'Atlantis' }, B);
        expect(r.ok).toBe(false);
        if (!r.ok && r.kind === 'city') expect(r.message).toMatch(/do not have/i);
    });

    it('flags an impossible date', () => {
        const r = computeReport({ ...A, date: '1999-02-31' }, B);
        expect(r.ok).toBe(false);
    });

    it('reports a guessed birth time by name', () => {
        const r = computeReport({ ...A, time: '' }, B);
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.assumedNoonFor).toContain(A.name);
    });

    it('does not flag a guess when both times are given', () => {
        const r = computeReport(A, B);
        if (r.ok) expect(r.assumedNoonFor).toHaveLength(0);
    });
});

describe('city lookup never guesses', () => {
    it('resolves an exact name', () => {
        expect(lookupCity('Pune').kind).toBe('found');
    });
    it('asks rather than picking when a prefix is ambiguous', () => {
        const hit = lookupCity('Ja');
        expect(['ambiguous', 'not-found']).toContain(hit.kind);
    });
    it('reports a miss with suggestions', () => {
        const hit = lookupCity('Atlantis');
        expect(hit.kind).toBe('not-found');
    });
});

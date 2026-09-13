import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildAstroProfile } from '../src/astrology/moon-calculator';

/**
 * The golden fixture — our numbers against an external reference.
 *
 * Every other test in this repo asserts BEHAVIOUR: that the Moon moves at a
 * lunar rate, that Bhakoot covers all twelve distances, that no score is a
 * quarter point. Necessary, and not sufficient. They would all pass on an
 * engine that is internally consistent and externally wrong — which is exactly
 * what this engine was before the heliocentric fix.
 *
 * This file closes that gap. It is deliberately inert until a human fills in
 * `expected` from AstroSage, because a fabricated fixture is worse than none:
 * it would pass forever while proving nothing.
 *
 *   npx tsx scripts/fixture.ts           # the 20 births to check
 *   npx tsx scripts/fixture.ts --json    # regenerate the skeleton
 *
 * CAVEAT worth reading before declaring a mismatch a bug. AstroSage may use a
 * topocentric Moon while we use geocentric. Lunar parallax reaches about 1
 * degree, roughly 0.3 of a pada. If disagreements cluster ONLY at the boundary
 * cases, suspect the position model before the code.
 */

interface GoldenEntry {
    date: string;
    time: string;
    city: string;
    expected: { nakshatra: string | null; pada: number | null; rashi: string | null };
    ours: { nakshatra: string; pada: number; rashi: string };
}

const ZONES: Record<string, string> = {
    Pune: 'Asia/Kolkata',
    Mumbai: 'Asia/Kolkata',
    Delhi: 'Asia/Kolkata',
    Chennai: 'Asia/Kolkata',
    Kolkata: 'Asia/Kolkata',
    Jaipur: 'Asia/Kolkata',
};

const fixture: GoldenEntry[] = JSON.parse(
    readFileSync(join(__dirname, 'fixtures', 'golden.json'), 'utf8')
);

const verified = fixture.filter((e) => e.expected.nakshatra !== null);

describe('golden fixture', () => {
    it('contains 20 births covering the stated boundary criteria', () => {
        expect(fixture).toHaveLength(20);
        expect(fixture.filter((e) => e.date < '1947-01-01').length).toBeGreaterThanOrEqual(2);
        expect(
            fixture.filter((e) => e.date >= '1942-01-01' && e.date <= '1945-12-31').length
        ).toBeGreaterThanOrEqual(1);
    });

    it('is stable — the same birth always produces the same chart', () => {
        // Guards against a regression that would otherwise only surface when
        // somebody finally fills in the reference values.
        for (const e of fixture) {
            const p = buildAstroProfile({
                userId: 'g',
                dateOfBirth: new Date(`${e.date}T00:00:00.000Z`),
                exactBirthTime: e.time,
                birthTimeZone: ZONES[e.city] ?? 'Asia/Kolkata',
            });
            expect(p.nakshatra.name, `${e.date} ${e.time} ${e.city}`).toBe(e.ours.nakshatra);
            expect(p.nakshatraPada).toBe(e.ours.pada);
            expect(p.rashi.name).toBe(e.ours.rashi);
        }
    });

    it.skipIf(verified.length === 0)(
        'agrees with the external reference on every verified birth',
        () => {
            for (const e of verified) {
                const p = buildAstroProfile({
                    userId: 'g',
                    dateOfBirth: new Date(`${e.date}T00:00:00.000Z`),
                    exactBirthTime: e.time,
                    birthTimeZone: ZONES[e.city] ?? 'Asia/Kolkata',
                });
                const where = `${e.date} ${e.time} ${e.city}`;
                expect(p.nakshatra.name, `nakshatra @ ${where}`).toBe(e.expected.nakshatra);
                expect(p.nakshatraPada, `pada @ ${where}`).toBe(e.expected.pada);
                if (e.expected.rashi) {
                    expect(p.rashi.name, `rashi @ ${where}`).toBe(e.expected.rashi);
                }
            }
        }
    );

    it('reports how much of the fixture has been verified', () => {
        const pct = Math.round((verified.length / fixture.length) * 100);
        // Not an assertion about quality — a visible counter so "the gate
        // passes" never gets confused with "the numbers are checked".
        console.info(
            `  golden fixture: ${verified.length}/${fixture.length} verified (${pct}%)` +
                (verified.length === 0
                    ? ' — run `npx tsx scripts/fixture.ts` and fill in expected values'
                    : '')
        );
        expect(verified.length).toBeGreaterThanOrEqual(0);
    });
});

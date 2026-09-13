import { describe, it, expect } from 'vitest';
import { calculateMoonPosition, buildAstroProfile } from '../src/astrology/moon-calculator';
import type { UserBirthData } from '../src/types';

/**
 * The first tests in this repo.
 *
 * Two of these are regressions for bugs that shipped. Read the comments before
 * changing an assertion — each one is load-bearing.
 */

function birth(
    iso: string,
    time?: string,
    zone = 'Asia/Kolkata'
): UserBirthData {
    return {
        userId: 't',
        dateOfBirth: new Date(`${iso}T00:00:00.000Z`), // UTC midnight, per contract
        exactBirthTime: time,
        birthTimeZone: zone,
    };
}

const DAY_MS = 24 * 60 * 60 * 1000;

describe('REGRESSION: the Moon must be the Moon', () => {
    /**
     * moon-calculator used `Astronomy.EclipticLongitude(Body.Moon, date)`,
     * which returns HELIOCENTRIC longitude. For the Moon that drifts at about
     * 1.03 deg/day — Earth's orbital rate — instead of the Moon's ~13.2.
     *
     * Measured on 1998-03-13 before the fix:
     *   EclipticLongitude(Moon) = 173.18 deg
     *   EclipticGeoMoon().lon   = 181.42 deg
     *
     * 8.2 degrees apart, so every nakshatra and rashi the engine produced was
     * computed from the wrong body. This test is the reason it cannot come back.
     */
    it('advances 11-15 degrees per day, not ~1', () => {
        const start = new Date(Date.UTC(1998, 2, 10, 12, 0));
        let previous: number | null = null;

        for (let i = 0; i < 20; i++) {
            const when = new Date(start.getTime() + i * DAY_MS);
            const { siderealLongitude } = calculateMoonPosition({
                userId: 't',
                dateOfBirth: new Date(Date.UTC(when.getUTCFullYear(), when.getUTCMonth(), when.getUTCDate())),
                exactBirthTime: '12:00',
                birthTimeZone: 'Asia/Kolkata',
            });

            if (previous !== null) {
                const moved = ((siderealLongitude - previous) + 360) % 360;
                // The Moon's apparent daily motion varies with orbital
                // eccentricity: roughly 11.8 at apogee, 15.4 at perigee.
                expect(moved).toBeGreaterThan(11);
                expect(moved).toBeLessThan(16);
            }
            previous = siderealLongitude;
        }
    });

    it('completes a full sidereal circuit in about 27-28 days', () => {
        const a = calculateMoonPosition(birth('1998-03-10', '12:00'));
        const b = calculateMoonPosition(birth('1998-04-06', '12:00')); // +27 days

        const drift = Math.abs(((b.siderealLongitude - a.siderealLongitude) + 360) % 360);
        // After ~27.3 days the Moon is back near where it started.
        expect(Math.min(drift, 360 - drift)).toBeLessThan(20);
    });
});

describe('REGRESSION: birth time is local, not UTC', () => {
    /**
     * The old code fed a local wall-clock hour straight into Date.UTC, so
     * 04:20 IST was treated as 04:20 UTC. That is 5h30m, about 3.0 degrees of
     * Moon travel. A pada is 3 deg 20', so the pada was wrong most of the time
     * and the nakshatra was wrong for roughly one birth in five.
     */
    it('treats the same wall-clock time in two zones as different instants', () => {
        const ist = calculateMoonPosition(birth('1998-03-14', '04:20', 'Asia/Kolkata'));
        const utc = calculateMoonPosition(birth('1998-03-14', '04:20', 'UTC'));

        const delta = Math.abs(ist.siderealLongitude - utc.siderealLongitude);
        // 5.5 hours of Moon travel, roughly 2.7-3.4 degrees.
        expect(delta).toBeGreaterThan(2.5);
        expect(delta).toBeLessThan(3.5);
    });

    it('reports the zone it actually applied', () => {
        expect(calculateMoonPosition(birth('1998-03-14', '04:20')).timeZoneUsed)
            .toBe('Asia/Kolkata');
        expect(calculateMoonPosition(birth('1998-03-14', '04:20', 'America/New_York')).timeZoneUsed)
            .toBe('America/New_York');
    });

    it('handles the 1942-45 wartime offset via the IANA database', () => {
        // India ran +6:30 during the war. Luxon gets this from tzdata; the old
        // Date.UTC path could not have known about it at all.
        const wartime = calculateMoonPosition(birth('1943-06-15', '08:00'));
        expect(wartime.siderealLongitude).toBeGreaterThanOrEqual(0);
        expect(wartime.siderealLongitude).toBeLessThan(360);
        expect(wartime.hasBirthTime).toBe(true);
    });

    it('handles a pre-1947 birth', () => {
        const p = buildAstroProfile(birth('1930-11-02', '05:45'));
        expect(p.nakshatra).toBeTruthy();
        expect(p.nakshatraPada).toBeGreaterThanOrEqual(1);
        expect(p.nakshatraPada).toBeLessThanOrEqual(4);
    });
});

describe('missing birth time never fails silently', () => {
    it('flags assumedNoon when no time is given', () => {
        const r = calculateMoonPosition(birth('1998-03-14'));
        expect(r.hasBirthTime).toBe(false);
        expect(r.assumedNoon).toBe(true);
    });

    it('flags assumedNoon when the time is unparseable', () => {
        const r = calculateMoonPosition(birth('1998-03-14', 'half past four'));
        expect(r.hasBirthTime).toBe(false);
        expect(r.assumedNoon).toBe(true);
    });

    it('does not flag assumedNoon for a real time', () => {
        const r = calculateMoonPosition(birth('1998-03-14', '04:20'));
        expect(r.assumedNoon).toBe(false);
    });

    it('assumes LOCAL noon, not UTC noon', () => {
        const ist = calculateMoonPosition(birth('1998-03-14', undefined, 'Asia/Kolkata'));
        const utc = calculateMoonPosition(birth('1998-03-14', undefined, 'UTC'));
        expect(Math.abs(ist.siderealLongitude - utc.siderealLongitude)).toBeGreaterThan(2.5);
    });
});

describe('calendar date is read in UTC', () => {
    /**
     * The old code mixed local-zone getFullYear/getMonth/getDate with
     * Date.UTC. On a non-UTC machine that shifts the calendar date a full day
     * — 13.2 degrees, an entire nakshatra, four padas.
     */
    it('gives the same answer regardless of how the Date was constructed', () => {
        const fromIsoString = calculateMoonPosition({
            userId: 't',
            dateOfBirth: new Date('1998-03-14'), // UTC midnight
            exactBirthTime: '04:20',
            birthTimeZone: 'Asia/Kolkata',
        });
        const fromExplicitUtc = calculateMoonPosition({
            userId: 't',
            dateOfBirth: new Date(Date.UTC(1998, 2, 14)),
            exactBirthTime: '04:20',
            birthTimeZone: 'Asia/Kolkata',
        });
        expect(fromIsoString.siderealLongitude).toBeCloseTo(fromExplicitUtc.siderealLongitude, 10);
    });
});

describe('profile shape', () => {
    it('always produces a nakshatra, a pada in 1-4, and a rashi', () => {
        for (let day = 1; day <= 28; day++) {
            const p = buildAstroProfile(birth(`1998-03-${String(day).padStart(2, '0')}`, '06:00'));
            expect(p.nakshatra?.name).toBeTruthy();
            expect(p.rashi?.name).toBeTruthy();
            expect(p.nakshatraPada).toBeGreaterThanOrEqual(1);
            expect(p.nakshatraPada).toBeLessThanOrEqual(4);
            expect(p.moonLongitude).toBeGreaterThanOrEqual(0);
            expect(p.moonLongitude).toBeLessThan(360);
        }
    });
});

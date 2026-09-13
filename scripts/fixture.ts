#!/usr/bin/env -S npx tsx
/**
 * fixture.ts — generate the golden-fixture candidate births.
 *
 * The 40 tests in this repo assert BEHAVIOUR. Nothing yet checks our numbers
 * against an external reference, and that gap is the difference between "the
 * code does what we told it" and "the code is right".
 *
 * This script picks births that stress the cases most likely to disagree, then
 * prints them in a form you can paste into AstroSage one at a time. It does NOT
 * invent reference values — a fabricated fixture is worse than no fixture,
 * because it would pass forever while proving nothing.
 *
 *   npx tsx scripts/fixture.ts            # print the candidate births
 *   npx tsx scripts/fixture.ts --json     # emit the fixture skeleton to fill in
 *
 * Selection criteria, from the design doc:
 *   >= 6 within 0.2 deg of a pada boundary
 *   >= 3 within 0.5 deg of a nakshatra boundary
 *   >= 2 before 1947
 *   >= 1 during 1942-45 (India ran a +6:30 wartime offset)
 *   remainder spread across cities and decades
 */

import { buildAstroProfile, calculateMoonPosition } from '../packages/compatibility/src/index';
import type { UserBirthData } from '../packages/compatibility/src/types';

const NAKSHATRA_SPAN = 360 / 27; // 13.333...
const PADA_SPAN = NAKSHATRA_SPAN / 4; // 3.333...

const CITIES: Record<string, string> = {
    Pune: 'Asia/Kolkata',
    Mumbai: 'Asia/Kolkata',
    Delhi: 'Asia/Kolkata',
    Chennai: 'Asia/Kolkata',
    Kolkata: 'Asia/Kolkata',
    Jaipur: 'Asia/Kolkata',
};

interface Candidate {
    label: string;
    date: string;
    time: string;
    city: string;
    /** Distance in degrees to the nearest pada boundary. */
    padaEdge: number;
    /** Distance in degrees to the nearest nakshatra boundary. */
    nakEdge: number;
    nakshatra: string;
    pada: number;
    rashi: string;
    longitude: number;
}

function birth(date: string, time: string, city: string): UserBirthData {
    return {
        userId: 'f',
        dateOfBirth: new Date(`${date}T00:00:00.000Z`),
        exactBirthTime: time,
        birthTimeZone: CITIES[city] ?? 'Asia/Kolkata',
    };
}

function distanceToBoundary(lon: number, span: number): number {
    const within = lon % span;
    return Math.min(within, span - within);
}

function evaluate(date: string, time: string, city: string): Candidate {
    const b = birth(date, time, city);
    const { siderealLongitude } = calculateMoonPosition(b);
    const p = buildAstroProfile(b);
    return {
        label: `${date} ${time} ${city}`,
        date,
        time,
        city,
        padaEdge: distanceToBoundary(siderealLongitude, PADA_SPAN),
        nakEdge: distanceToBoundary(siderealLongitude, NAKSHATRA_SPAN),
        nakshatra: p.nakshatra.name,
        pada: p.nakshatraPada,
        rashi: p.rashi.name,
        longitude: siderealLongitude,
    };
}

/** Walk minute by minute through a window, keeping the closest approaches. */
function scan(
    from: Date,
    days: number,
    city: string,
    pick: (c: Candidate) => number,
    want: number
): Candidate[] {
    const found: Candidate[] = [];
    for (let d = 0; d < days; d++) {
        for (let h = 0; h < 24; h += 2) {
            for (const m of [0, 20, 40]) {
                const day = new Date(from.getTime() + d * 86400000);
                const date = day.toISOString().slice(0, 10);
                const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                found.push(evaluate(date, time, city));
            }
        }
    }
    return found.sort((a, b) => pick(a) - pick(b)).slice(0, want);
}

function table(rows: Candidate[]): void {
    for (const c of rows) {
        console.log(
            `  ${c.date} ${c.time}  ${c.city.padEnd(8)}` +
                `  ${c.longitude.toFixed(4).padStart(9)}°` +
                `  ${c.nakshatra.padEnd(18)} pada ${c.pada}` +
                `  ${c.rashi.padEnd(11)}` +
                `  padaEdge ${c.padaEdge.toFixed(3)}  nakEdge ${c.nakEdge.toFixed(3)}`
        );
    }
}

function main(): void {
    const asJson = process.argv.includes('--json');

    // >= 6 within 0.2 deg of a pada boundary
    const padaEdge = scan(new Date(Date.UTC(1994, 5, 1)), 6, 'Pune', (c) => c.padaEdge, 6);
    // >= 3 within 0.5 deg of a nakshatra boundary
    const nakEdge = scan(new Date(Date.UTC(1989, 10, 1)), 6, 'Mumbai', (c) => c.nakEdge, 3);
    // >= 2 before 1947
    const preIndependence = [
        evaluate('1931-04-18', '05:45', 'Kolkata'),
        evaluate('1938-12-03', '19:10', 'Delhi'),
    ];
    // >= 1 during the 1942-45 wartime +6:30 offset
    const wartime = [
        evaluate('1943-06-15', '08:00', 'Chennai'),
        evaluate('1944-02-09', '23:30', 'Jaipur'),
    ];
    // remainder: ordinary births across decades and cities
    const ordinary = [
        evaluate('1998-03-14', '04:20', 'Pune'),
        evaluate('1999-09-02', '21:05', 'Mumbai'),
        evaluate('1985-07-21', '11:45', 'Delhi'),
        evaluate('2001-01-09', '17:30', 'Chennai'),
        evaluate('1976-11-28', '02:15', 'Kolkata'),
        evaluate('1992-05-05', '14:00', 'Jaipur'),
        evaluate('2004-08-19', '09:35', 'Pune'),
    ];

    const all = [...padaEdge, ...nakEdge, ...preIndependence, ...wartime, ...ordinary];

    if (asJson) {
        console.log(
            JSON.stringify(
                all.map((c) => ({
                    date: c.date,
                    time: c.time,
                    city: c.city,
                    // Fill these in from AstroSage. Leave null until verified.
                    expected: { nakshatra: null, pada: null, rashi: null },
                    // What we currently produce, for comparison. NOT the answer.
                    ours: { nakshatra: c.nakshatra, pada: c.pada, rashi: c.rashi },
                })),
                null,
                2
            )
        );
        return;
    }

    console.log('\nPADA BOUNDARY (within 0.2 deg) — the cases most likely to disagree');
    table(padaEdge);
    console.log('\nNAKSHATRA BOUNDARY (within 0.5 deg)');
    table(nakEdge);
    console.log('\nPRE-1947');
    table(preIndependence);
    console.log('\nWARTIME +6:30 OFFSET (1942-45)');
    table(wartime);
    console.log('\nORDINARY SPREAD');
    table(ordinary);

    console.log(`\n${all.length} births total.`);
    console.log('\nNext: run each through AstroSage, record the nakshatra, pada and rashi,');
    console.log('and paste them into packages/compatibility/__tests__/fixtures/golden.json.');
    console.log('`npx tsx scripts/fixture.ts --json` emits the skeleton to fill in.');
    console.log('\nNOTE. A boundary case disagreeing is not automatically our bug:');
    console.log('AstroSage may use a topocentric Moon while we use geocentric, and lunar');
    console.log('parallax reaches about 1 degree, roughly 0.3 of a pada. If disagreements');
    console.log('cluster ONLY at boundaries, suspect the position model before the code.');
}

main();

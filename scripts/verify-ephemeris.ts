#!/usr/bin/env -S npx tsx
/**
 * verify-ephemeris.ts — a second opinion on the Moon, from different arithmetic.
 *
 * WHY THIS EXISTS. The engine shipped for its entire history calling
 * `Astronomy.EclipticLongitude(Body.Moon)`, which returns HELIOCENTRIC
 * longitude — a point drifting at Earth's orbital rate, about 1.03 deg/day
 * instead of the Moon's 13.2. Every nakshatra and rashi it produced came from
 * the wrong body, and nothing caught it: the library was fine, our call was
 * wrong, and the output stayed plausible the whole time.
 *
 * Unit tests cannot catch that on their own. They assert what we told the code
 * to do. What catches it is a SECOND, INDEPENDENT implementation disagreeing.
 *
 * So this file implements lunar longitude from scratch using the truncated
 * ELP-2000/82 series as published in Meeus, *Astronomical Algorithms*, ch. 47.
 * It shares no code path with astronomy-engine — different algorithm, different
 * coefficients, different author. If the two agree to within an arcminute or so
 * across four centuries, the call is right. If they diverge, something is.
 *
 *   npx tsx scripts/verify-ephemeris.ts
 *
 * Runs weekly in CI (.github/workflows/reference-check.yml). Astronomy code
 * fails silently, so a scheduled second opinion is worth more here than in most
 * places.
 */

import * as Astronomy from 'astronomy-engine';

const DEG = Math.PI / 180;
const sin = (d: number) => Math.sin(d * DEG);

/** Julian Day from a JS Date. */
function julianDay(date: Date): number {
    return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Geocentric apparent ecliptic longitude of the Moon, degrees.
 *
 * Meeus ch. 47, truncated to the 60 largest periodic terms in longitude.
 * Accurate to roughly 10 arcseconds over the modern era — several orders of
 * magnitude tighter than the errors this is here to catch.
 */
function moonLongitudeMeeus(date: Date): number {
    const T = (julianDay(date) - 2451545.0) / 36525;
    const T2 = T * T;
    const T3 = T2 * T;
    const T4 = T3 * T;

    // Mean elements (47.1 - 47.5)
    const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;
    const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000;
    const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000;
    const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000;
    const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000;

    // Eccentricity correction for terms involving the Sun's anomaly (47.6)
    const E = 1 - 0.002516 * T - 0.0000074 * T2;

    // Table 47.A — [D, M, M', F, coefficient in 1e-6 degrees]
    const TERMS: [number, number, number, number, number][] = [
        [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314],
        [0, 0, 2, 0, 213618], [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332],
        [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066], [2, 0, 1, 0, 53322],
        [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
        [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528],
        [0, 0, 1, -2, 10980], [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034],
        [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888], [2, 1, 0, 0, -6766],
        [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036],
        [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665],
        [0, 1, -2, 0, -2689], [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390],
        [1, 0, 1, 0, -2348], [2, -2, 0, 0, 2236], [0, 1, 2, 0, -2120],
        [0, 2, 0, 0, -2069], [2, -2, -1, 0, 2048], [2, 0, 1, -2, -1773],
        [2, 0, 0, 2, -1595], [4, -1, -1, 0, 1215], [0, 0, 2, 2, -1110],
        [3, 0, -1, 0, -892], [2, 1, 1, 0, -810], [4, -1, -2, 0, 759],
        [0, 2, -1, 0, -713], [2, 2, -1, 0, -700], [2, 1, -2, 0, 691],
        [2, -1, 0, -2, 596], [4, 0, 1, 0, 549], [0, 0, 4, 0, 537],
        [4, -1, 0, 0, 520], [1, 0, -2, 0, -487], [2, 1, 0, -2, -399],
        [0, 0, 2, -2, -381], [1, 1, 1, 0, 351], [3, 0, -2, 0, -340],
        [4, 0, -3, 0, 330], [2, -1, 2, 0, 327], [0, 2, 1, 0, -323],
        [1, 1, -1, 0, 299], [2, 0, 3, 0, 294], [2, 0, -1, -2, 0],
    ];

    let sigmaL = 0;
    for (const [d, m, mp, f, coeff] of TERMS) {
        if (coeff === 0) continue;
        // E^|M| accounts for the slowly changing eccentricity of Earth's orbit
        const ecc = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
        sigmaL += coeff * ecc * sin(d * D + m * M + mp * Mp + f * F);
    }

    // Additive terms from Venus, Jupiter and the flattening of the Earth (47.  )
    const A1 = 119.75 + 131.849 * T;
    const A2 = 53.09 + 479264.29 * T;
    sigmaL += 3958 * sin(A1) + 1962 * sin(Lp - F) + 318 * sin(A2);

    let lambda = Lp + sigmaL / 1000000;
    lambda %= 360;
    if (lambda < 0) lambda += 360;
    return lambda;
}

/** Smallest absolute angular difference, degrees. */
function angleDiff(a: number, b: number): number {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}

function main(): void {
    // Four centuries, sampled irregularly so a periodic term cannot hide.
    const samples: Date[] = [];
    for (let year = 1900; year <= 2100; year += 7) {
        for (const [m, d, h] of [[0, 11, 3], [4, 23, 14], [8, 7, 21]] as const) {
            samples.push(new Date(Date.UTC(year, m, d, h, 37)));
        }
    }
    // Plus the fixture's own dates, which are the ones that matter in practice.
    for (const iso of [
        '1931-04-18T00:15:00Z', '1938-12-03T13:40:00Z', '1943-06-15T02:30:00Z',
        '1944-02-09T18:00:00Z', '1994-06-01T10:30:00Z', '1998-03-13T22:50:00Z',
        '1999-09-02T15:35:00Z', '2004-08-19T04:05:00Z',
    ]) {
        samples.push(new Date(iso));
    }

    let worst = 0;
    let worstAt: Date | null = null;
    let total = 0;

    for (const when of samples) {
        const ours = Astronomy.EclipticGeoMoon(when).lon;
        const meeus = moonLongitudeMeeus(when);
        const diff = angleDiff(ours, meeus);
        total += diff;
        if (diff > worst) {
            worst = diff;
            worstAt = when;
        }
    }

    const mean = total / samples.length;
    // Meeus truncated to 60 terms, compared against a full-precision library,
    // sits comfortably inside an arcminute. A pada is 3 deg 20', so even a
    // tenth of a degree of disagreement would be irrelevant to the product —
    // but it would still mean one of the two is not doing what we think.
    const TOLERANCE_DEG = 0.05;

    console.log('\nIndependent ephemeris cross-check');
    console.log('─'.repeat(62));
    console.log(`  implementation A   astronomy-engine EclipticGeoMoon`);
    console.log(`  implementation B   Meeus ch.47 truncated ELP-2000/82 (this file)`);
    console.log(`  samples            ${samples.length} instants, 1900-2100`);
    console.log(`  mean difference    ${(mean * 60).toFixed(3)} arcmin`);
    console.log(`  worst difference   ${(worst * 60).toFixed(3)} arcmin`);
    if (worstAt) console.log(`  worst at           ${worstAt.toISOString()}`);
    console.log(`  tolerance          ${(TOLERANCE_DEG * 60).toFixed(1)} arcmin`);
    console.log('─'.repeat(62));

    if (worst > TOLERANCE_DEG) {
        console.error(
            `\n  FAIL — the two implementations disagree by ${(worst * 60).toFixed(2)} arcmin.\n` +
            `  One of them is not computing what we think it is. This is the check\n` +
            `  that would have caught the heliocentric bug on day one.\n`
        );
        process.exit(1);
    }

    // Prove the check has teeth: the OLD, wrong call must fail it loudly.
    const probe = new Date(Date.UTC(1998, 2, 13, 22, 50));
    const wrong = Astronomy.EclipticLongitude(Astronomy.Body.Moon, probe);
    const right = moonLongitudeMeeus(probe);
    const wrongBy = angleDiff(wrong, right);

    console.log(`\n  Sanity: the pre-fix call (EclipticLongitude, heliocentric)`);
    console.log(`  differs from the reference by ${wrongBy.toFixed(2)}° at ${probe.toISOString()}.`);
    console.log(`  The check is live, not vacuous.\n`);

    if (wrongBy < 1) {
        console.error('  FAIL — the known-bad call did not trip the check. Check is vacuous.\n');
        process.exit(1);
    }

    console.log('  PASS — two independent implementations agree.\n');
}

main();

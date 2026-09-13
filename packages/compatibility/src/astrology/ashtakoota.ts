/**
 * @file ashtakoota.ts
 * @description Implementations of the 8 Kootas for Guna Milan.
 */

import type { RashiData, NakshatraData, KootaResult, GunaMilanResult, AstroProfile } from './astrology-types';
import { getVashyaGroup } from './data/rashis';
import { getYoniScore } from './data/yoni-compatibility';
import { getPlanetaryRelationship } from './data/planetary-relationships';

const METHODOLOGY = 'v1.0.0';

/**
 * Varna. Gendered by tradition: 1 point if the groom's varna rank is at least
 * the bride's, otherwise 0.
 *
 * The old code awarded 0.5 in each direction, so it scored 1 on equal ranks and
 * 0.5 otherwise and could never return 0. Varna has no half point in any
 * convention — that was a bug, not a neutrality choice.
 *
 * @param groom rashi of the groom
 * @param bride rashi of the bride
 */
export function calculateVarna(groom: RashiData, bride: RashiData): KootaResult {
    const score = groom.varnaRank >= bride.varnaRank ? 1 : 0;
    const rashiA = groom, rashiB = bride;

    return {
        koota: 'Varna', maxPoints: 1, score,
        valueA: rashiA.varna, valueB: rashiB.varna,
        interpretation: score === 1 ? 'Excellent work compatibility' : 'Average work compatibility',
        methodologyVersion: METHODOLOGY
    };
}

/**
 * Vashya. Directional by tradition: the bride's group as seen from the groom's.
 *
 * The old code averaged both directions to stay gender-neutral. The matrix is
 * deliberately asymmetric (Chatushpada -> Vanachara is 1.5 while
 * Vanachara -> Chatushpada is 0), so averaging produced 0.75 — a quarter point
 * that appears in no convention and in no reference tool. Halves are valid
 * here; quarters are not.
 *
 * @param groom rashi of the groom
 * @param bride rashi of the bride
 */
export function calculateVashya(groom: RashiData, bride: RashiData, groomDegree?: number, brideDegree?: number): KootaResult {
    const rashiA = groom, rashiB = bride;
    const degreeA = groomDegree, degreeB = brideDegree;
    const vGroupA = getVashyaGroup(rashiA, degreeA);
    const vGroupB = getVashyaGroup(rashiB, degreeB);

    const vashyaMatrix: Record<string, Record<string, number>> = {
        'Chatushpada': { 'Chatushpada': 2, 'Manava': 1, 'Jalachara': 1, 'Vanachara': 1.5, 'Keeta': 1 },
        'Manava': { 'Chatushpada': 1, 'Manava': 2, 'Jalachara': 1.5, 'Vanachara': 0, 'Keeta': 1 },
        'Jalachara': { 'Chatushpada': 1, 'Manava': 1.5, 'Jalachara': 2, 'Vanachara': 1, 'Keeta': 1 },
        'Vanachara': { 'Chatushpada': 0, 'Manava': 0, 'Jalachara': 0, 'Vanachara': 2, 'Keeta': 0 },
        'Keeta': { 'Chatushpada': 1, 'Manava': 1, 'Jalachara': 1, 'Vanachara': 0, 'Keeta': 2 }
    };

    // Directional lookup: groom's group -> bride's group. No averaging.
    const finalScore = vashyaMatrix[vGroupA]?.[vGroupB] ?? 0;

    return {
        koota: 'Vashya', maxPoints: 2, score: finalScore,
        valueA: vGroupA, valueB: vGroupB,
        interpretation: `Vashya compatibility score: ${finalScore}/2`,
        methodologyVersion: METHODOLOGY
    };
}

export function calculateTara(nakshatraA: NakshatraData, nakshatraB: NakshatraData): KootaResult {
    const diffAB = (nakshatraB.index - nakshatraA.index + 27) % 27 + 1;
    const diffBA = (nakshatraA.index - nakshatraB.index + 27) % 27 + 1;

    const taraAB = ((diffAB - 1) % 9) + 1;
    const taraBA = ((diffBA - 1) % 9) + 1;

    const inauspicious = [3, 5, 7];
    const isAuspiciousAB = !inauspicious.includes(taraAB);
    const isAuspiciousBA = !inauspicious.includes(taraBA);

    let score = 0;
    if (isAuspiciousAB && isAuspiciousBA) score = 3;
    else if (isAuspiciousAB || isAuspiciousBA) score = 1.5;

    return {
        koota: 'Tara', maxPoints: 3, score,
        valueA: nakshatraA.name, valueB: nakshatraB.name,
        interpretation: `Tara score indicates destiny alignment: ${score}/3`,
        methodologyVersion: METHODOLOGY
    };
}

export function calculateYoni(nakshatraA: NakshatraData, nakshatraB: NakshatraData): KootaResult {
    const score = getYoniScore(nakshatraA.yoniAnimal, nakshatraB.yoniAnimal);
    return {
        koota: 'Yoni', maxPoints: 4, score,
        valueA: nakshatraA.yoniAnimal, valueB: nakshatraB.yoniAnimal,
        interpretation: `Yoni (intimacy/nature) compatibility: ${score}/4`,
        methodologyVersion: METHODOLOGY
    };
}

export function calculateGrahaMaitri(rashiA: RashiData, rashiB: RashiData): KootaResult {
    const { score: scoreA } = getPlanetaryRelationship(rashiA.lord, rashiB.lord);
    const { score: scoreB } = getPlanetaryRelationship(rashiB.lord, rashiA.lord);
    
    // Exact mapping for matrix to max 5
    // Actually our Graha Maitri matrix directly gives values out of 5
    let combinedScore = (scoreA + scoreB) / 2;

    return {
        koota: 'Graha Maitri', maxPoints: 5, score: combinedScore,
        valueA: rashiA.lord, valueB: rashiB.lord,
        interpretation: `Planetary friendship (mental compatibility): ${combinedScore}/5`,
        methodologyVersion: METHODOLOGY
    };
}

export function calculateGana(nakshatraA: NakshatraData, nakshatraB: NakshatraData): KootaResult {
    const getScore = (g1: string, g2: string) => {
        if (g1 === g2) return 6;
        if (g1 === 'Deva' && g2 === 'Manushya') return 5;
        if (g1 === 'Manushya' && g2 === 'Deva') return 5;
        if (g1 === 'Deva' && g2 === 'Rakshasa') return 1;
        if (g1 === 'Rakshasa' && g2 === 'Deva') return 1;
        return 0; // Manushya + Rakshasa
    };

    const score = (getScore(nakshatraA.gana, nakshatraB.gana) + getScore(nakshatraB.gana, nakshatraA.gana)) / 2;

    return {
        koota: 'Gana', maxPoints: 6, score,
        valueA: nakshatraA.gana, valueB: nakshatraB.gana,
        interpretation: `Temperament (Gana) alignment: ${score}/6`,
        methodologyVersion: METHODOLOGY
    };
}

export function calculateBhakoot(rashiA: RashiData, rashiB: RashiData): KootaResult {
    let distance = ((rashiB.index - rashiA.index + 12) % 12) + 1;
    let reciprocal = 14 - distance;

    //  signs apart  0    1    2     3     4     5     6
    //  distance     1    2    3     4     5     6     7
    //  reciprocal  13   12   11    10     9     8     7
    //  pairs      1/13 2/12 3/11  4/10  5/9   6/8   7/7
    //
    // The 1/7 relationship (opposite signs, six apart) surfaces here as
    // pairs [7,7] — NOT [1,7]. The old `pairs[0]===1 && pairs[1]===7` check
    // tested a representation this arithmetic can never produce, so every
    // opposite-sign couple scored 0 of 7 instead of 7 of 7. Bhakoot is the
    // largest koota, so that is roughly one couple in twelve losing seven
    // points against every reference tool they might check.
    //
    // Verified: distance=1 always yields reciprocal=13, so the dead branch
    // was unreachable by construction. One correct answer, no convention
    // ambiguity. See docs/designs/...-ceo-plan.md, eng amendment E2.
    const pairs = [Math.min(distance, reciprocal), Math.max(distance, reciprocal)];
    let isAuspicious = (pairs[0] === 1 && pairs[1] === 13) || // 1/1  same sign
                       (pairs[0] === 7 && pairs[1] === 7) ||  // 1/7  opposite signs
                       (pairs[0] === 3 && pairs[1] === 11) || // 3/11
                       (pairs[0] === 4 && pairs[1] === 10);   // 4/10
    
    let score = isAuspicious ? 7 : 0;
    
    // Cancellation
    if (!isAuspicious && rashiA.lord === rashiB.lord) {
        score = 7;
    }

    return {
        koota: 'Bhakoot', maxPoints: 7, score,
        valueA: rashiA.name, valueB: rashiB.name,
        interpretation: `Bhakoot (love/health) alignment: ${score}/7`,
        methodologyVersion: METHODOLOGY
    };
}

export function calculateNadi(nakshatraA: NakshatraData, nakshatraB: NakshatraData, rashiA: RashiData, rashiB: RashiData): KootaResult {
    let score = (nakshatraA.nadi !== nakshatraB.nadi) ? 8 : 0;

    // Cancellations
    if (score === 0) {
        if (rashiA.index === rashiB.index && nakshatraA.index !== nakshatraB.index) {
            score = 8;
        } else if (nakshatraA.index === nakshatraB.index && rashiA.index !== rashiB.index) {
            score = 8;
        }
    }

    return {
        koota: 'Nadi', maxPoints: 8, score,
        valueA: nakshatraA.nadi, valueB: nakshatraB.nadi,
        interpretation: `Nadi (genetic/spiritual) alignment: ${score}/8`,
        methodologyVersion: METHODOLOGY
    };
}

/**
 * Full 36-point Ashtakoota.
 *
 * ORDER MATTERS. Varna and Vashya are scored by tradition from the groom's
 * chart to the bride's, so the first argument must be the groom. Passing them
 * the other way round changes the total.
 */
export function calculateGunaMilan(groom: AstroProfile, bride: AstroProfile): GunaMilanResult {
    const profileA = groom, profileB = bride;
    const kootas = [
        calculateVarna(profileA.rashi, profileB.rashi),
        calculateVashya(profileA.rashi, profileB.rashi, profileA.moonLongitude, profileB.moonLongitude),
        calculateTara(profileA.nakshatra, profileB.nakshatra),
        calculateYoni(profileA.nakshatra, profileB.nakshatra),
        calculateGrahaMaitri(profileA.rashi, profileB.rashi),
        calculateGana(profileA.nakshatra, profileB.nakshatra),
        calculateBhakoot(profileA.rashi, profileB.rashi),
        calculateNadi(profileA.nakshatra, profileB.nakshatra, profileA.rashi, profileB.rashi)
    ];

    // ── Half-point guard ─────────────────────────────────────────────────
    // Half points ARE traditional in Ashtakoota. Tara awards 1.5 when only one
    // direction is auspicious, and the Graha Maitri table contains 0.5 and 3.
    // Reference tools routinely print totals like 24.5 / 36.
    //
    // What is NOT traditional is a QUARTER point. Those only ever came from
    // averaging an asymmetric directional matrix to fake gender neutrality,
    // which this engine no longer does. Anything that is not a multiple of 0.5
    // is a bug rather than a convention, so refuse it rather than render a
    // number a family cannot check against any reference.
    const invalid = kootas.filter((k) => Math.round(k.score * 2) !== k.score * 2);
    if (invalid.length > 0) {
        const detail = invalid.map((k) => `${k.koota}=${k.score}`).join(', ');
        throw new Error(
            `Koota score(s) not a multiple of 0.5: ${detail}. Half points are ` +
            `traditional; quarter points come from averaging a directional ` +
            `matrix and appear in no reference tool.`
        );
    }

    const totalScore = kootas.reduce((sum, k) => sum + k.score, 0);
    const percentage = (totalScore / 36) * 100;

    let interpretation = '';
    if (totalScore < 18) interpretation = 'Low compatibility';
    else if (totalScore < 25) interpretation = 'Average compatibility';
    else if (totalScore < 33) interpretation = 'Strong compatibility';
    else interpretation = 'Exceptional compatibility';

    return {
        kootas,
        totalScore,
        maxScore: 36,
        percentage,
        interpretation,
        methodologyVersion: METHODOLOGY
    };
}

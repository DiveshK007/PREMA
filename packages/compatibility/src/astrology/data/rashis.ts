/**
 * @file rashis.ts
 * @description Data for 12 Rashis (Zodiac signs) and utility functions.
 */

import type { RashiData, VashyaGroup } from '../astrology-types';

export const RASHIS: RashiData[] = [
    { index: 1, name: 'Mesha', englishName: 'Aries', degreesStart: 0, degreesEnd: 30, lord: 'Mars', element: 'Fire', varnaRank: 3, varna: 'Kshatriya', vashyaGroup: 'Chatushpada' },
    { index: 2, name: 'Vrishabha', englishName: 'Taurus', degreesStart: 30, degreesEnd: 60, lord: 'Venus', element: 'Earth', varnaRank: 2, varna: 'Vaishya', vashyaGroup: 'Chatushpada' },
    { index: 3, name: 'Mithuna', englishName: 'Gemini', degreesStart: 60, degreesEnd: 90, lord: 'Mercury', element: 'Air', varnaRank: 1, varna: 'Shudra', vashyaGroup: 'Manava' },
    { index: 4, name: 'Karka', englishName: 'Cancer', degreesStart: 90, degreesEnd: 120, lord: 'Moon', element: 'Water', varnaRank: 4, varna: 'Brahmin', vashyaGroup: 'Jalachara' },
    { index: 5, name: 'Simha', englishName: 'Leo', degreesStart: 120, degreesEnd: 150, lord: 'Sun', element: 'Fire', varnaRank: 3, varna: 'Kshatriya', vashyaGroup: 'Vanachara' },
    { index: 6, name: 'Kanya', englishName: 'Virgo', degreesStart: 150, degreesEnd: 180, lord: 'Mercury', element: 'Earth', varnaRank: 2, varna: 'Vaishya', vashyaGroup: 'Manava' },
    { index: 7, name: 'Tula', englishName: 'Libra', degreesStart: 180, degreesEnd: 210, lord: 'Venus', element: 'Air', varnaRank: 1, varna: 'Shudra', vashyaGroup: 'Manava' },
    { index: 8, name: 'Vrishchika', englishName: 'Scorpio', degreesStart: 210, degreesEnd: 240, lord: 'Mars', element: 'Water', varnaRank: 4, varna: 'Brahmin', vashyaGroup: 'Keeta' },
    { index: 9, name: 'Dhanu', englishName: 'Sagittarius', degreesStart: 240, degreesEnd: 270, lord: 'Jupiter', element: 'Fire', varnaRank: 3, varna: 'Kshatriya', vashyaGroup: 'Manava' },
    { index: 10, name: 'Makara', englishName: 'Capricorn', degreesStart: 270, degreesEnd: 300, lord: 'Saturn', element: 'Earth', varnaRank: 2, varna: 'Vaishya', vashyaGroup: 'Chatushpada' },
    { index: 11, name: 'Kumbha', englishName: 'Aquarius', degreesStart: 300, degreesEnd: 330, lord: 'Saturn', element: 'Air', varnaRank: 1, varna: 'Shudra', vashyaGroup: 'Manava' },
    { index: 12, name: 'Meena', englishName: 'Pisces', degreesStart: 330, degreesEnd: 360, lord: 'Jupiter', element: 'Water', varnaRank: 4, varna: 'Brahmin', vashyaGroup: 'Jalachara' }
];

/**
 * Returns Rashi based on Sidereal Moon Longitude.
 * @param siderealMoonLongitude The longitude of the moon in degrees (0-360)
 */
export function getRashiFromDegree(siderealMoonLongitude: number): RashiData {
    let normalized = siderealMoonLongitude % 360;
    if (normalized < 0) normalized += 360;

    const index = Math.floor(normalized / 30);
    const rashi = RASHIS[Math.min(index, 11)];
    if (!rashi) {
        // Unreachable: RASHIS has 12 entries and the index is clamped to 11.
        throw new Error(
            `No rashi at index ${Math.min(index, 11)} for longitude ${siderealMoonLongitude}`
        );
    }
    return rashi;
}

/**
 * Determines exact Vashya Group handling dual-vashya signs.
 */
export function getVashyaGroup(rashi: RashiData, moonDegree?: number): VashyaGroup {
    if (rashi.index === 9) { // Dhanu (Sagittarius)
        if (moonDegree !== undefined) {
            let normalized = moonDegree % 360;
            if (normalized < 0) normalized += 360;
            return normalized < 255 ? 'Manava' : 'Chatushpada';
        }
        return 'Manava';
    }
    
    if (rashi.index === 10) { // Makara (Capricorn)
        if (moonDegree !== undefined) {
            let normalized = moonDegree % 360;
            if (normalized < 0) normalized += 360;
            return normalized < 285 ? 'Chatushpada' : 'Jalachara';
        }
        return 'Chatushpada';
    }
    
    return rashi.vashyaGroup;
}

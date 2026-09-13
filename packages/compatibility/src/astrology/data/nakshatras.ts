/**
 * @file nakshatras.ts
 * @description Data for 27 Nakshatras and utility functions to fetch them.
 */

import type { NakshatraData } from '../astrology-types';

/**
 * Full 27 Nakshatra Data
 */
export const NAKSHATRAS: NakshatraData[] = [
    { index: 1, name: 'Ashwini', degreesStart: 0, degreesEnd: 13.333, lord: 'Ketu', gana: 'Deva', nadi: 'Aadi', yoniAnimal: 'Horse', yoniSex: 'M' },
    { index: 2, name: 'Bharani', degreesStart: 13.333, degreesEnd: 26.667, lord: 'Venus', gana: 'Manushya', nadi: 'Madhya', yoniAnimal: 'Elephant', yoniSex: 'M' },
    { index: 3, name: 'Krittika', degreesStart: 26.667, degreesEnd: 40, lord: 'Sun', gana: 'Rakshasa', nadi: 'Antya', yoniAnimal: 'Sheep', yoniSex: 'F' },
    { index: 4, name: 'Rohini', degreesStart: 40, degreesEnd: 53.333, lord: 'Moon', gana: 'Manushya', nadi: 'Antya', yoniAnimal: 'Serpent', yoniSex: 'M' },
    { index: 5, name: 'Mrigashira', degreesStart: 53.333, degreesEnd: 66.667, lord: 'Mars', gana: 'Deva', nadi: 'Madhya', yoniAnimal: 'Serpent', yoniSex: 'F' },
    { index: 6, name: 'Ardra', degreesStart: 66.667, degreesEnd: 80, lord: 'Rahu', gana: 'Manushya', nadi: 'Aadi', yoniAnimal: 'Dog', yoniSex: 'F' },
    { index: 7, name: 'Punarvasu', degreesStart: 80, degreesEnd: 93.333, lord: 'Jupiter', gana: 'Deva', nadi: 'Aadi', yoniAnimal: 'Cat', yoniSex: 'F' },
    { index: 8, name: 'Pushya', degreesStart: 93.333, degreesEnd: 106.667, lord: 'Saturn', gana: 'Deva', nadi: 'Madhya', yoniAnimal: 'Sheep', yoniSex: 'M' },
    { index: 9, name: 'Ashlesha', degreesStart: 106.667, degreesEnd: 120, lord: 'Mercury', gana: 'Rakshasa', nadi: 'Antya', yoniAnimal: 'Cat', yoniSex: 'M' },
    { index: 10, name: 'Magha', degreesStart: 120, degreesEnd: 133.333, lord: 'Ketu', gana: 'Rakshasa', nadi: 'Antya', yoniAnimal: 'Rat', yoniSex: 'M' },
    { index: 11, name: 'Purva Phalguni', degreesStart: 133.333, degreesEnd: 146.667, lord: 'Venus', gana: 'Manushya', nadi: 'Madhya', yoniAnimal: 'Rat', yoniSex: 'F' },
    { index: 12, name: 'Uttara Phalguni', degreesStart: 146.667, degreesEnd: 160, lord: 'Sun', gana: 'Manushya', nadi: 'Aadi', yoniAnimal: 'Cow', yoniSex: 'M' },
    { index: 13, name: 'Hasta', degreesStart: 160, degreesEnd: 173.333, lord: 'Moon', gana: 'Deva', nadi: 'Aadi', yoniAnimal: 'Buffalo', yoniSex: 'F' },
    { index: 14, name: 'Chitra', degreesStart: 173.333, degreesEnd: 186.667, lord: 'Mars', gana: 'Rakshasa', nadi: 'Madhya', yoniAnimal: 'Tiger', yoniSex: 'F' },
    { index: 15, name: 'Swati', degreesStart: 186.667, degreesEnd: 200, lord: 'Rahu', gana: 'Deva', nadi: 'Antya', yoniAnimal: 'Buffalo', yoniSex: 'M' },
    { index: 16, name: 'Vishakha', degreesStart: 200, degreesEnd: 213.333, lord: 'Jupiter', gana: 'Rakshasa', nadi: 'Antya', yoniAnimal: 'Tiger', yoniSex: 'M' },
    { index: 17, name: 'Anuradha', degreesStart: 213.333, degreesEnd: 226.667, lord: 'Saturn', gana: 'Deva', nadi: 'Madhya', yoniAnimal: 'Deer', yoniSex: 'F' },
    { index: 18, name: 'Jyeshtha', degreesStart: 226.667, degreesEnd: 240, lord: 'Mercury', gana: 'Rakshasa', nadi: 'Aadi', yoniAnimal: 'Deer', yoniSex: 'M' },
    { index: 19, name: 'Mula', degreesStart: 240, degreesEnd: 253.333, lord: 'Ketu', gana: 'Rakshasa', nadi: 'Aadi', yoniAnimal: 'Dog', yoniSex: 'M' },
    { index: 20, name: 'Purva Ashadha', degreesStart: 253.333, degreesEnd: 266.667, lord: 'Venus', gana: 'Manushya', nadi: 'Madhya', yoniAnimal: 'Monkey', yoniSex: 'M' },
    { index: 21, name: 'Uttara Ashadha', degreesStart: 266.667, degreesEnd: 280, lord: 'Sun', gana: 'Manushya', nadi: 'Antya', yoniAnimal: 'Mongoose', yoniSex: 'M' },
    { index: 22, name: 'Shravana', degreesStart: 280, degreesEnd: 293.333, lord: 'Moon', gana: 'Deva', nadi: 'Antya', yoniAnimal: 'Monkey', yoniSex: 'F' },
    { index: 23, name: 'Dhanishta', degreesStart: 293.333, degreesEnd: 306.667, lord: 'Mars', gana: 'Rakshasa', nadi: 'Madhya', yoniAnimal: 'Lion', yoniSex: 'F' },
    { index: 24, name: 'Shatabhisha', degreesStart: 306.667, degreesEnd: 320, lord: 'Rahu', gana: 'Rakshasa', nadi: 'Aadi', yoniAnimal: 'Horse', yoniSex: 'F' },
    { index: 25, name: 'Purva Bhadrapada', degreesStart: 320, degreesEnd: 333.333, lord: 'Jupiter', gana: 'Manushya', nadi: 'Aadi', yoniAnimal: 'Lion', yoniSex: 'M' },
    { index: 26, name: 'Uttara Bhadrapada', degreesStart: 333.333, degreesEnd: 346.667, lord: 'Saturn', gana: 'Manushya', nadi: 'Madhya', yoniAnimal: 'Cow', yoniSex: 'F' },
    { index: 27, name: 'Revati', degreesStart: 346.667, degreesEnd: 360, lord: 'Mercury', gana: 'Deva', nadi: 'Antya', yoniAnimal: 'Elephant', yoniSex: 'F' }
];

/**
 * Returns Nakshatra based on Sidereal Moon Longitude.
 * @param siderealMoonLongitude The longitude of the moon in degrees (0-360)
 * @returns NakshatraData and calculated pada
 */
export function getNakshatraFromDegree(siderealMoonLongitude: number): { nakshatra: NakshatraData, pada: number } {
    let normalized = siderealMoonLongitude % 360;
    if (normalized < 0) normalized += 360;

    const span = 360 / 27; // 13.333333...
    const index = Math.floor(normalized / span);
    const nakshatra = NAKSHATRAS[Math.min(index, 26)];
    if (!nakshatra) {
        // Unreachable: NAKSHATRAS has 27 entries and the index is clamped to 26.
        // Throwing beats a silent undefined reaching the koota calculations.
        throw new Error(
            `No nakshatra at index ${Math.min(index, 26)} for longitude ${siderealMoonLongitude}`
        );
    }
    
    // Each pada is 3.333... degrees
    const relativeDegree = normalized - (index * span);
    const pada = Math.floor(relativeDegree / (span / 4)) + 1;
    
    return { nakshatra, pada: Math.min(pada, 4) };
}

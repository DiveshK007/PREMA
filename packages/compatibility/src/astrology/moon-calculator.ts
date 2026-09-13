// =============================================================================
// PREMA Compatibility Engine — Moon Calculator
// =============================================================================
// Computes sidereal Moon longitude from birth data using astronomy-engine.
// Applies Lahiri Ayanamsa correction (tropical → sidereal).
// =============================================================================

import * as Astronomy from 'astronomy-engine';
import { DateTime } from 'luxon';
import type { UserBirthData } from '../types';
import type { AstroProfile } from './astrology-types';
import { getNakshatraFromDegree } from './data/nakshatras';
import { getRashiFromDegree } from './data/rashis';
import type { ConfidenceLevel } from '../types';

const METHODOLOGY = 'vedic_v1';

/**
 * Fallback zone when birth data carries no IANA zone.
 *
 * The wedge is India, so Asia/Kolkata is the right default — but it IS a
 * default, and `timeZoneUsed` on the result surfaces which zone was applied
 * so the caller can display it. Never assume silently.
 */
const DEFAULT_ZONE = 'Asia/Kolkata';

/**
 * The result of placing a birth on the sky.
 *
 * `assumedNoon` and `timeZoneUsed` exist so the UI can say what it did.
 * A confident-looking score built on a guessed birth time is the single
 * failure this product cannot survive, so the guess is never silent.
 */
export interface MoonPosition {
    siderealLongitude: number;
    hasBirthTime: boolean;
    /** True when no usable birth time was given and local noon was assumed. */
    assumedNoon: boolean;
    /** The IANA zone actually applied, whether supplied or defaulted. */
    timeZoneUsed: string;
}

/**
 * Extracts the calendar date from a birth Date using UTC getters.
 *
 * Callers MUST construct `dateOfBirth` as UTC midnight — which is what
 * `new Date('1998-03-14')` produces, and what Supabase returns for a DATE
 * column. Using local getters here (as this file did before) mixes the
 * server's zone into the calendar date: on a non-UTC machine a midnight DOB
 * shifts a full day, which is 13.2 degrees of Moon travel, an entire
 * nakshatra and four padas.
 */
function calendarDate(dob: Date): { year: number; month: number; day: number } {
    return {
        year: dob.getUTCFullYear(),
        month: dob.getUTCMonth() + 1, // luxon months are 1-indexed
        day: dob.getUTCDate(),
    };
}

/**
 * Calculates Lahiri Ayanamsa for a given date.
 * Uses the standard linear approximation based on the Lahiri reference epoch.
 */
function getLahiriAyanamsa(date: Date): number {
  // `date` is a true UTC instant by this point, so UTC getters are correct here.
  // Linear approximation, accurate to roughly an arcminute over the modern era.
  // Open question: confirm against Swiss Ephemeris to <0.01 deg across the fixture range.
  const year = date.getUTCFullYear() + (date.getUTCMonth() / 12) + (date.getUTCDate() / 365.25);
  return 23.856 + 0.01396 * (year - 2000);
}

/**
 * Parses exact birth time from HH:mm format string.
 */
function parseBirthTime(timeStr: string): { hour: number; minute: number } | null {
  const parts = timeStr.split(':');
  if (parts.length !== 2) return null;
  const hour = parseInt(parts[0]!, 10);
  const minute = parseInt(parts[1]!, 10);
  if (isNaN(hour) || isNaN(minute)) return null;
  return { hour, minute };
}

/**
 * Calculates the sidereal Moon position from birth data.
 *
 * @param birthData - User's birth data including date of birth and optional exact birth time
 * @returns Object containing sidereal longitude (0-360 degrees) and whether birth time was available
 */
export function calculateMoonPosition(birthData: UserBirthData): MoonPosition {
  const { year, month, day } = calendarDate(birthData.dateOfBirth);
  const zone = birthData.birthTimeZone ?? DEFAULT_ZONE;

  //  local wall-clock  ──▶  luxon (zone + historical offset)  ──▶  UTC instant
  //       04:20 IST                Asia/Kolkata, +5:30              22:50 prev day
  //
  // The old code fed the wall-clock hour straight into Date.UTC, so 04:20 IST
  // was treated as 04:20 UTC — a 5h30m error, ~3.0 degrees of Moon travel.
  // A pada is 3 deg 20', so the pada was wrong most of the time and the
  // nakshatra was wrong for roughly one birth in five.
  const build = (hour: number, minute: number): DateTime =>
    DateTime.fromObject({ year, month, day, hour, minute }, { zone });

  let dt: DateTime;
  let hasBirthTime = false;
  let assumedNoon = false;

  const parsed = birthData.exactBirthTime ? parseBirthTime(birthData.exactBirthTime) : null;
  if (parsed) {
    dt = build(parsed.hour, parsed.minute);
    hasBirthTime = true;
  } else {
    // No usable birth time. Noon LOCAL, not noon UTC — and the caller is told.
    dt = build(12, 0);
    assumedNoon = true;
  }

  if (!dt.isValid) {
    throw new Error(
      `Cannot resolve birth instant: ${dt.invalidReason ?? 'unknown'} ` +
      `(${year}-${month}-${day}, zone "${zone}")`
    );
  }

  const date = dt.toJSDate();

  // MUST be EclipticGeoMoon, not EclipticLongitude.
  //
  // `Astronomy.EclipticLongitude(body, date)` returns HELIOCENTRIC longitude.
  // Passed Body.Moon it yields a point drifting at ~1.03 deg/day — Earth's
  // orbital rate — not the Moon's ~13.2 deg/day. Measured on 1998-03-13:
  //
  //     EclipticLongitude(Moon) = 173.18 deg   (1.03 deg/day)
  //     EclipticGeoMoon().lon   = 181.42 deg   (11.82 deg/day)
  //
  // 8.2 degrees apart on that date, and the gap is arbitrary rather than a
  // constant offset. Every nakshatra, rashi and guna score this engine
  // produced before this fix was computed from the wrong body.
  //
  // EclipticGeoMoon gives true-of-date geocentric ecliptic coordinates, which
  // is what the Lahiri ayanamsa subtraction below expects.
  //
  // Still open: geocentric vs topocentric. Lunar parallax reaches ~1 deg
  // (about 0.3 of a pada), so boundary cases in the golden fixture may
  // disagree with a topocentric reference for reasons unrelated to any bug.
  const tropicalLongitude = Astronomy.EclipticGeoMoon(date).lon;
  const ayanamsa = getLahiriAyanamsa(date);

  let siderealLongitude = tropicalLongitude - ayanamsa;
  if (siderealLongitude < 0) siderealLongitude += 360;
  if (siderealLongitude >= 360) siderealLongitude %= 360;

  return { siderealLongitude, hasBirthTime, assumedNoon, timeZoneUsed: zone };
}

/**
 * Builds a full astrology profile from birth data.
 * Derives Rashi, Nakshatra, and Pada from sidereal Moon longitude.
 *
 * @param birthData - User's birth data
 * @returns Complete AstroProfile for compatibility calculations
 */
export function buildAstroProfile(birthData: UserBirthData): AstroProfile {
  const { siderealLongitude, hasBirthTime } = calculateMoonPosition(birthData);

  const rashi = getRashiFromDegree(siderealLongitude);
  const { nakshatra, pada } = getNakshatraFromDegree(siderealLongitude);

  const confidence: ConfidenceLevel = hasBirthTime ? 'strong' : 'moderate';

  return {
    userId: birthData.userId,
    moonLongitude: siderealLongitude,
    rashi,
    nakshatra,
    nakshatraPada: pada,
    hasBirthTime,
    confidence,
  };
}

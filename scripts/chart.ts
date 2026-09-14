#!/usr/bin/env -S npx tsx
/**
 * chart.ts — run the compatibility engine from the command line.
 *
 * Nothing else in this repo can execute packages/compatibility. This is the
 * prerequisite for the golden fixture, for verifying the moon-calculator fix,
 * and for The Assignment (compare three real charts against AstroSage).
 *
 *   npx tsx scripts/chart.ts "14/03/1998 04:20 Pune" "02/09/1999 21:05 Hyderabad"
 *   npx tsx scripts/chart.ts --one "14/03/1998 04:20 Pune"
 *
 * Birth time is optional. Omit it and the engine falls back to noon, which is
 * exactly the silent-wrong-answer this harness exists to make visible.
 */

import {
  buildAstroProfile,
  calculateMoonPosition,
  calculateGunaMilan,
} from '../packages/compatibility/src/index';
import type { UserBirthData } from '../packages/compatibility/src/types';

// A few Indian cities so the harness runs without the full dataset.
// The real geocoder lands in apps/web (task T8).
const CITIES: Record<string, { lat: number; lon: number; tz: string }> = {
  pune: { lat: 18.5204, lon: 73.8567, tz: 'Asia/Kolkata' },
  mumbai: { lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata' },
  delhi: { lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' },
  hyderabad: { lat: 17.385, lon: 78.4867, tz: 'Asia/Kolkata' },
  bengaluru: { lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' },
  bangalore: { lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' },
  chennai: { lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata' },
  kolkata: { lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' },
  jaipur: { lat: 26.9124, lon: 75.7873, tz: 'Asia/Kolkata' },
  nashik: { lat: 19.9975, lon: 73.7898, tz: 'Asia/Kolkata' },
};

interface Parsed {
  label: string;
  birth: UserBirthData;
  cityKey: string;
  hasTime: boolean;
}

/** "14/03/1998 04:20 Pune" or "14/03/1998 Pune" */
function parse(spec: string, id: string): Parsed {
  const parts = spec.trim().split(/\s+/);
  const datePart = parts[0];
  if (!datePart) throw new Error(`Empty birth spec: "${spec}"`);

  const timePart = parts.length >= 3 ? parts[1] : undefined;
  const cityPart = parts.length >= 3 ? parts.slice(2).join(' ') : parts.slice(1).join(' ');

  const dm = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(datePart);
  if (!dm) throw new Error(`Bad date "${datePart}" — expected DD/MM/YYYY`);
  const day = Number(dm[1]);
  const month = Number(dm[2]);
  const year = Number(dm[3]);

  if (timePart && !/^\d{1,2}:\d{2}$/.test(timePart)) {
    throw new Error(`Bad time "${timePart}" — expected HH:mm`);
  }

  const cityKey = cityPart.toLowerCase();
  const city = CITIES[cityKey];
  if (!city) {
    throw new Error(
      `Unknown city "${cityPart}". Known: ${Object.keys(CITIES).sort().join(', ')}`
    );
  }

  // UTC midnight — the engine reads Y/M/D with UTC getters by contract.
  const dateOfBirth = new Date(Date.UTC(year, month - 1, day));

  return {
    label: `${datePart}${timePart ? ' ' + timePart : ' (no time)'} ${cityPart}`,
    cityKey,
    hasTime: Boolean(timePart),
    birth: {
      userId: id,
      dateOfBirth,
      exactBirthTime: timePart,
      birthPlaceCity: cityPart,
      birthPlaceLat: city.lat,
      birthPlaceLon: city.lon,
      birthTimeZone: city.tz,
    },
  };
}

function line(ch = '─', n = 62): string {
  return ch.repeat(n);
}

function describeOne(p: Parsed): void {
  const moon = calculateMoonPosition(p.birth);
  const profile = buildAstroProfile(p.birth);

  console.log(line('═'));
  console.log(p.label);
  console.log(line('═'));
  console.log(`  sidereal longitude   ${moon.siderealLongitude.toFixed(4)}°`);
  console.log(`  birth time used      ${moon.hasBirthTime ? 'yes' : 'NO'}`);
  console.log(`  noon assumed         ${moon.assumedNoon ? 'YES — score is a guess' : 'no'}`);
  console.log(`  nakshatra            ${profile.nakshatra?.name ?? '(none)'}`);
  console.log(`  pada                 ${profile.nakshatraPada}`);
  console.log(`  rashi                ${profile.rashi?.name ?? '(none)'}`);
  console.log(`  time zone applied    ${moon.timeZoneUsed}`);
  console.log('');
}

function comparePair(a: Parsed, b: Parsed): void {
  describeOne(a);
  describeOne(b);

  const pa = buildAstroProfile(a.birth);
  const pb = buildAstroProfile(b.birth);
  const guna = calculateGunaMilan(pa, pb);

  console.log(line('═'));
  console.log('GUNA MILAN');
  console.log(line('═'));

  let sum = 0;
  for (const k of guna.kootas) {
    sum += k.score;
    // Half points are traditional: Tara awards 1.5 when one direction is
    // auspicious, and the Graha Maitri table contains 0.5 and 3. Only a
    // QUARTER point is a bug, and calculateGunaMilan throws on those.
    const frac = k.score % 0.5 !== 0 ? '  ← NOT a multiple of 0.5, this is a bug' : '';
    console.log(
      `  ${k.koota.padEnd(14)} ${String(k.score).padStart(5)} / ${k.maxPoints}${frac}`
    );
  }
  console.log(line('─'));
  console.log(`  ${'TOTAL'.padEnd(14)} ${String(guna.totalScore).padStart(5)} / 36`);
  if (Math.abs(sum - guna.totalScore) > 1e-9) {
    console.log(`  !! koota sum (${sum}) disagrees with totalScore (${guna.totalScore})`);
  }
  if (guna.totalScore % 1 !== 0) {
    console.log(`  (half points are normal in Ashtakoota — reference tools print them too)`);
  }
  console.log('');
  if (!a.hasTime || !b.hasTime) {
    console.log('  WARNING: at least one birth time was missing. Noon was assumed.');
    console.log('  Nakshatra and several kootas may be wrong. This is the silent');
    console.log('  failure task T9 exists to surface in the UI.');
    console.log('');
  }
}

function main(): void {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    console.log('Usage:');
    console.log('  npx tsx scripts/chart.ts "DD/MM/YYYY HH:mm City" "DD/MM/YYYY HH:mm City"');
    console.log('  npx tsx scripts/chart.ts --one "DD/MM/YYYY HH:mm City"');
    console.log('');
    console.log('Cities: ' + Object.keys(CITIES).sort().join(', '));
    process.exit(argv.length === 0 ? 1 : 0);
  }

  try {
    if (argv[0] === '--one') {
      const spec = argv[1];
      if (!spec) throw new Error('--one needs a birth spec');
      describeOne(parse(spec, 'a'));
      return;
    }
    const specA = argv[0];
    const specB = argv[1];
    if (!specB) throw new Error('Two birth specs required (or use --one)');
    comparePair(parse(specA, 'a'), parse(specB, 'b'));
  } catch (err) {
    console.error(`\n  ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
}

main();

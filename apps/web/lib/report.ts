import {
    buildAstroProfile,
    calculateGunaMilan,
    calculateMoonPosition,
} from '@prema/compatibility';
import type { UserBirthData } from '@prema/compatibility';
import { lookupCity, displayName, type City } from './cities';

/**
 * The report is a PURE FUNCTION of two birth records carried in the URL.
 *
 * That is the whole architecture (eng amendment E3). The page and the OG image
 * both compute from the same search params, so they are identical **by
 * construction** rather than by a database round-trip that can race, fail, or
 * drift. It also deletes the opaque id, two Supabase tables, every
 * anonymous-insert RLS policy, and the read-after-write hazard.
 *
 * Cost, stated plainly: person B's birth details live in the URL, in browser
 * history and in server access logs. The plan already concedes this elsewhere —
 * the ask-the-pandit handoff transmits exactly the same fields as plain text
 * over WhatsApp.
 */

export type Role = 'groom' | 'bride';

export interface PersonInput {
    name: string;
    /** YYYY-MM-DD */
    date: string;
    /** HH:mm, or empty when unknown. */
    time: string;
    /** Raw typed city. */
    city: string;
    /**
     * Traditional role. Varna and Vashya are scored from the groom's chart to
     * the bride's, so the engine needs to know which is which — otherwise the
     * only options are to average (producing quarter points that match no
     * reference tool) or to pick a direction arbitrarily.
     */
    role?: Role;
}

export const EMPTY_PERSON: PersonInput = { name: '', date: '', time: '', city: '' };

export function otherRole(r: Role): Role {
    return r === 'groom' ? 'bride' : 'groom';
}

// ---------------------------------------------------------------------------
// URL encoding
// ---------------------------------------------------------------------------

/** name|YYYY-MM-DD|HH:mm|City  — pipe-delimited, then base64url. ~40 bytes each. */
function encodePerson(p: PersonInput): string {
    const raw = [p.name, p.date, p.time, p.city, p.role ?? '']
        .map((f) => f.replace(/\|/g, ' '))
        .join('|');
    return Buffer.from(raw, 'utf8').toString('base64url');
}

function decodePerson(token: string): PersonInput | null {
    try {
        const raw = Buffer.from(token, 'base64url').toString('utf8');
        const [name, date, time, city, role] = raw.split('|');
        if (name === undefined || date === undefined) return null;
        return {
            name,
            date,
            time: time ?? '',
            city: city ?? '',
            role: role === 'groom' || role === 'bride' ? role : undefined,
        };
    } catch {
        return null;
    }
}

export function encodePair(a: PersonInput, b: PersonInput): string {
    return new URLSearchParams({ a: encodePerson(a), b: encodePerson(b) }).toString();
}

export function decodePair(
    params: { a?: string | string[]; b?: string | string[] }
): { a: PersonInput; b: PersonInput } | null {
    const at = Array.isArray(params.a) ? params.a[0] : params.a;
    const bt = Array.isArray(params.b) ? params.b[0] : params.b;
    if (!at || !bt) return null;
    const a = decodePerson(at);
    const b = decodePerson(bt);
    if (!a || !b) return null;
    return { a, b };
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

export interface KootaRow {
    /** English name as the engine reports it. */
    koota: string;
    /** Devanagari, for the document register. */
    devanagari: string;
    score: number;
    maxPoints: number;
}

/** Sanskrit koota names. `lang="sa"` on render so a screen reader does not
 *  attempt them in the page language. */
const DEVANAGARI: Record<string, string> = {
    Varna: 'वर्ण',
    Vashya: 'वश्य',
    Tara: 'तारा',
    Yoni: 'योनि',
    'Graha Maitri': 'ग्रह मैत्री',
    Gana: 'गण',
    Bhakoot: 'भकूट',
    Nadi: 'नाड़ी',
};

export interface PersonResolved {
    input: PersonInput;
    city: City;
    nakshatra: string;
    pada: number;
    rashi: string;
    /** True when no usable birth time was given and local noon was assumed. */
    assumedNoon: boolean;
}

export type ReportResult =
    | {
          ok: true;
          a: PersonResolved;
          b: PersonResolved;
          total: number;
          maxTotal: 36;
          kootas: KootaRow[];
          /** Plain verdict lines — the two things families actually veto on. */
          nadiClear: boolean;
          bhakootClear: boolean;
          /** Names of people whose birth time was guessed. */
          assumedNoonFor: string[];
      }
    | { ok: false; kind: 'city'; field: 'a' | 'b'; message: string; suggestions: string[] }
    | { ok: false; kind: 'input'; field: 'a' | 'b'; message: string }
    | { ok: false; kind: 'engine'; message: string };

function toBirthData(p: PersonInput, city: City, id: string): UserBirthData {
    // UTC midnight. The engine reads Y/M/D with UTC getters by contract, and a
    // Supabase DATE column arrives as exactly this 'YYYY-MM-DD' string.
    return {
        userId: id,
        dateOfBirth: new Date(`${p.date}T00:00:00.000Z`),
        exactBirthTime: p.time || undefined,
        birthPlaceCity: displayName(city),
        birthPlaceLat: city.lat,
        birthPlaceLon: city.lon,
        birthTimeZone: city.tz,
    };
}

function validate(p: PersonInput, field: 'a' | 'b'): { message: string } | null {
    if (!p.name.trim()) return { message: 'A name is needed.' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) return { message: 'A date of birth is needed.' };

    const d = new Date(`${p.date}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return { message: 'That date does not exist.' };

    // Round-trip check catches 31 February and friends.
    const [y, m, day] = p.date.split('-').map(Number);
    if (d.getUTCFullYear() !== y || d.getUTCMonth() + 1 !== m || d.getUTCDate() !== day) {
        return { message: `That date does not exist.` };
    }
    if (d.getTime() > Date.now()) return { message: 'That date is in the future.' };
    if (y !== undefined && y < 1900) return { message: 'Births before 1900 are not supported.' };

    if (p.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time)) {
        return { message: 'Time should look like 21:05.' };
    }
    void field;
    return null;
}

export function computeReport(a: PersonInput, b: PersonInput): ReportResult {
    for (const [p, field] of [[a, 'a'], [b, 'b']] as const) {
        const bad = validate(p, field);
        if (bad) return { ok: false, kind: 'input', field, message: bad.message };
    }

    const resolved: Partial<Record<'a' | 'b', City>> = {};
    for (const [p, field] of [[a, 'a'], [b, 'b']] as const) {
        const hit = lookupCity(p.city);
        if (hit.kind === 'found') {
            resolved[field] = hit.city;
        } else if (hit.kind === 'ambiguous') {
            return {
                ok: false,
                kind: 'city',
                field,
                message: `There is more than one place called ${p.city}. Which one?`,
                suggestions: hit.candidates.map(displayName),
            };
        } else {
            return {
                ok: false,
                kind: 'city',
                field,
                message: `We do not have ${p.city || 'that place'} yet.`,
                suggestions: hit.suggestions.map(displayName),
            };
        }
    }

    const cityA = resolved.a!;
    const cityB = resolved.b!;

    try {
        const birthA = toBirthData(a, cityA, 'a');
        const birthB = toBirthData(b, cityB, 'b');

        const moonA = calculateMoonPosition(birthA);
        const moonB = calculateMoonPosition(birthB);
        const profA = buildAstroProfile(birthA);
        const profB = buildAstroProfile(birthB);

        // Varna and Vashya are directional. Hand calculateGunaMilan the groom
        // first, whichever of the two that is.
        const aIsGroom = (a.role ?? 'groom') === 'groom';
        const groomProfile = aIsGroom ? profA : profB;
        const brideProfile = aIsGroom ? profB : profA;

        // Throws on any fractional koota. Varna, Vashya and Tara can still
        // produce halves and are pending an astrologer's ruling. A confident
        // "27.75 / 36" on a document a family is meant to trust is worse than
        // an honest failure.
        const guna = calculateGunaMilan(groomProfile, brideProfile);

        const kootas: KootaRow[] = guna.kootas.map((k) => ({
            koota: k.koota,
            devanagari: DEVANAGARI[k.koota] ?? '',
            score: k.score,
            maxPoints: k.maxPoints,
        }));

        const find = (n: string) => kootas.find((k) => k.koota === n);
        const assumedNoonFor: string[] = [];
        if (moonA.assumedNoon) assumedNoonFor.push(a.name);
        if (moonB.assumedNoon) assumedNoonFor.push(b.name);

        return {
            ok: true,
            a: {
                input: a,
                city: cityA,
                nakshatra: profA.nakshatra.name,
                pada: profA.nakshatraPada,
                rashi: profA.rashi.name,
                assumedNoon: moonA.assumedNoon,
            },
            b: {
                input: b,
                city: cityB,
                nakshatra: profB.nakshatra.name,
                pada: profB.nakshatraPada,
                rashi: profB.rashi.name,
                assumedNoon: moonB.assumedNoon,
            },
            total: guna.totalScore,
            maxTotal: 36,
            kootas,
            nadiClear: (find('Nadi')?.score ?? 0) > 0,
            bhakootClear: (find('Bhakoot')?.score ?? 0) > 0,
            assumedNoonFor,
        };
    } catch (err) {
        return {
            ok: false,
            kind: 'engine',
            message: err instanceof Error ? err.message : String(err),
        };
    }
}

// ---------------------------------------------------------------------------
// Presentation helpers (shared by the page and the OG image)
// ---------------------------------------------------------------------------

export function longDate(iso: string): string {
    const d = new Date(`${iso}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

/** "born 14 March 1998 at 04:20 in Pune" / "born 14 March 1998 in Pune" */
export function bornPhrase(p: PersonResolved): string {
    const when = longDate(p.input.date);
    const at = p.input.time ? ` at ${p.input.time}` : '';
    return `born ${when}${at} in ${p.city.name}`;
}

/** Screen readers must not say "thirty-two slash thirty-six". */
export function scoreLabel(total: number): string {
    return `${total} out of 36 gunas`;
}

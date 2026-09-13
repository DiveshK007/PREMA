import { describe, it, expect } from 'vitest';
import { calculateBhakoot, calculateGunaMilan } from '../src/astrology/ashtakoota';
import { getRashiFromDegree } from '../src/astrology/data/rashis';
import { buildAstroProfile } from '../src/astrology/moon-calculator';
import type { UserBirthData } from '../src/types';

/** Rashi at index 0-11. Each sign spans 30 degrees, so index * 30 + 15 lands mid-sign. */
function rashi(index: number) {
    return getRashiFromDegree(index * 30 + 15);
}

describe('REGRESSION: calculateBhakoot 1/7', () => {
    /**
     * `distance = ((B - A + 12) % 12) + 1; reciprocal = 14 - distance`
     *
     *   signs apart  0    1    2     3     4     5     6
     *   distance     1    2    3     4     5     6     7
     *   reciprocal  13   12   11    10     9     8     7
     *   pairs      1/13 2/12 3/11  4/10  5/9   6/8   7/7
     *
     * The 1/7 relationship (opposite signs) surfaces as pairs [7,7], NOT
     * [1,7]. The old check tested `pairs[0]===1 && pairs[1]===7`, which this
     * arithmetic can never produce, so every opposite-sign couple scored 0 of
     * 7. Bhakoot is the largest koota.
     */
    it('scores 7 for opposite signs (six apart)', () => {
        for (let a = 0; a < 12; a++) {
            const b = (a + 6) % 12;
            const result = calculateBhakoot(rashi(a), rashi(b));
            expect(result.score, `signs ${a} and ${b} are opposite`).toBe(7);
        }
    });

    it('scores 7 for the same sign', () => {
        for (let a = 0; a < 12; a++) {
            expect(calculateBhakoot(rashi(a), rashi(a)).score).toBe(7);
        }
    });

    it('covers all twelve sign distances without throwing', () => {
        for (let a = 0; a < 12; a++) {
            for (let b = 0; b < 12; b++) {
                const r = calculateBhakoot(rashi(a), rashi(b));
                expect(r.maxPoints).toBe(7);
                expect([0, 7]).toContain(r.score);
                expect(Number.isInteger(r.score)).toBe(true);
            }
        }
    });

    it('is symmetric — order of the two charts does not change the score', () => {
        for (let a = 0; a < 12; a++) {
            for (let b = 0; b < 12; b++) {
                expect(calculateBhakoot(rashi(a), rashi(b)).score)
                    .toBe(calculateBhakoot(rashi(b), rashi(a)).score);
            }
        }
    });

    it('awards 7 for the auspicious 3/11 and 4/10 relationships', () => {
        // three apart -> pairs [3,11]; four apart -> pairs [4,10]
        expect(calculateBhakoot(rashi(0), rashi(2)).score).toBe(7);
        expect(calculateBhakoot(rashi(0), rashi(3)).score).toBe(7);
    });
});

describe('half-point guard', () => {
    /**
     * CORRECTION. An earlier version of this suite asserted whole numbers,
     * which was wrong. Half points ARE traditional in Ashtakoota: Tara awards
     * 1.5 when only one direction is auspicious, and the Graha Maitri table
     * contains 0.5 and 3. Reference tools routinely print totals like 24.5/36.
     *
     * Only QUARTER points are a bug, and they only ever came from averaging an
     * asymmetric directional matrix to fake gender neutrality. The engine no
     * longer does that.
     */
    function birth(iso: string, time: string): UserBirthData {
        return {
            userId: 't',
            dateOfBirth: new Date(`${iso}T00:00:00.000Z`),
            exactBirthTime: time,
            birthTimeZone: 'Asia/Kolkata',
        };
    }

    it('allows half points — they are the tradition', () => {
        // Sweep until a half-point total turns up; it should, and it must not throw.
        let sawHalf = false;
        for (let d = 1; d <= 28 && !sawHalf; d++) {
            const g = buildAstroProfile(birth(`1998-03-${String(d).padStart(2, '0')}`, '09:00'));
            const b = buildAstroProfile(birth(`1999-07-${String(d).padStart(2, '0')}`, '17:30'));
            const r = calculateGunaMilan(g, b);
            if (r.totalScore % 1 === 0.5) sawHalf = true;
        }
        expect(sawHalf).toBe(true);
    });

    it('rejects anything that is not a multiple of 0.5', () => {
        for (let d = 1; d <= 28; d += 2) {
            const g = buildAstroProfile(birth(`1998-03-${String(d).padStart(2, '0')}`, '09:00'));
            const b = buildAstroProfile(birth(`1999-07-${String(d).padStart(2, '0')}`, '17:30'));
            const r = calculateGunaMilan(g, b);
            expect(Math.round(r.totalScore * 2)).toBe(r.totalScore * 2);
            expect(r.totalScore).toBeGreaterThanOrEqual(0);
            expect(r.totalScore).toBeLessThanOrEqual(36);
        }
    });
});

describe('REGRESSION: gendered convention, no quarter points', () => {
    /**
     * Varna and Vashya are counted from the groom's chart to the bride's.
     * Averaging both directions to fake gender-neutrality produced quarter
     * points (Chatushpada x Vanachara = (1.5 + 0) / 2 = 0.75), which appear in
     * no tradition and in no reference tool.
     *
     * Half points ARE traditional: Tara awards 1.5, Graha Maitri's table
     * contains 0.5 and 3. Only quarters are the bug.
     */
    function prof(iso: string, time: string) {
        return buildAstroProfile({
            userId: 't',
            dateOfBirth: new Date(`${iso}T00:00:00.000Z`),
            exactBirthTime: time,
            birthTimeZone: 'Asia/Kolkata',
        });
    }

    it('never produces a score that is not a multiple of 0.5', () => {
        for (let i = 0; i < 300; i++) {
            const y1 = 1985 + (i % 15);
            const y2 = 1986 + ((i * 7) % 15);
            const g = prof(`${y1}-0${(i % 9) + 1}-1${i % 9}`, '10:30');
            const br = prof(`${y2}-0${((i * 3) % 9) + 1}-1${(i * 5) % 9}`, '18:15');
            const r = calculateGunaMilan(g, br);
            for (const k of r.kootas) {
                expect(Math.round(k.score * 2), `${k.koota} = ${k.score}`).toBe(k.score * 2);
            }
            expect(r.totalScore).toBeGreaterThanOrEqual(0);
            expect(r.totalScore).toBeLessThanOrEqual(36);
        }
    });

    it('Varna is 1 or 0, never a half', () => {
        for (let i = 0; i < 60; i++) {
            const g = prof(`199${i % 10}-0${(i % 9) + 1}-15`, '08:00');
            const br = prof(`199${(i + 3) % 10}-0${((i * 2) % 9) + 1}-20`, '14:00');
            const varna = calculateGunaMilan(g, br).kootas.find((k) => k.koota === 'Varna');
            expect([0, 1]).toContain(varna?.score);
        }
    });

    it('swapping groom and bride can change the total — the convention is directional', () => {
        let differed = false;
        for (let i = 0; i < 80 && !differed; i++) {
            const g = prof(`199${i % 10}-0${(i % 9) + 1}-11`, '07:20');
            const br = prof(`199${(i + 5) % 10}-0${((i * 4) % 9) + 1}-23`, '19:40');
            if (calculateGunaMilan(g, br).totalScore !== calculateGunaMilan(br, g).totalScore) {
                differed = true;
            }
        }
        expect(differed).toBe(true);
    });
});

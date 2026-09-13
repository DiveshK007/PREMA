#!/usr/bin/env -S npx tsx
/**
 * astrologer-brief.ts — the message to send a practising astrologer.
 *
 * Four conventions in the engine cannot be settled by code, by testing, or by
 * reading more sources. They need someone who does this professionally. This
 * generates the message to send them, with WORKED EXAMPLES pulled live from the
 * engine so the questions are concrete rather than theoretical.
 *
 *   npx tsx scripts/astrologer-brief.ts           # print it
 *   npx tsx scripts/astrologer-brief.ts > brief.txt
 *
 * Send it as one message. Four questions batched respects their time far more
 * than four separate conversations, and it is the difference between a reply
 * this week and a reply never.
 */

import {
    buildAstroProfile,
    calculateGunaMilan,
} from '../packages/compatibility/src/index';
import { getRashiFromDegree } from '../packages/compatibility/src/astrology/data/rashis';
import type { UserBirthData } from '../packages/compatibility/src/types';

function birth(date: string, time: string): UserBirthData {
    return {
        userId: 'x',
        dateOfBirth: new Date(`${date}T00:00:00.000Z`),
        exactBirthTime: time,
        birthTimeZone: 'Asia/Kolkata',
    };
}

/** A real pair from the engine, so every question has a concrete case attached. */
function worked(groomDate: string, groomTime: string, brideDate: string, brideTime: string) {
    const g = buildAstroProfile(birth(groomDate, groomTime));
    const b = buildAstroProfile(birth(brideDate, brideTime));
    const r = calculateGunaMilan(g, b);
    return { g, b, r };
}

function main(): void {
    const A = worked('1998-03-14', '04:20', '1999-09-02', '21:05');

    // Find a pair where Bhakoot is 5/9 — the case question 2 is about.
    let fiveNine: ReturnType<typeof worked> | null = null;
    for (let d = 1; d <= 28 && !fiveNine; d++) {
        for (let e = 1; e <= 28 && !fiveNine; e++) {
            const w = worked(
                `1995-04-${String(d).padStart(2, '0')}`, '09:00',
                `1996-10-${String(e).padStart(2, '0')}`, '15:00'
            );
            const gi = w.g.rashi.index, bi = w.b.rashi.index;
            const apart = Math.min((gi - bi + 12) % 12, (bi - gi + 12) % 12);
            if (apart === 4) fiveNine = w; // 5/9 relationship
        }
    }

    const line = (s = '─') => s.repeat(66);

    console.log(`
Subject: four questions about guna milan conventions

Namaste,

I am building a small tool that computes Ashtakoota guna milan from two birth
charts. It is free, it does not give advice, and it does not claim to predict
anything — it shows the eight kootas and the total, the way a printed matching
sheet would.

I want the numbers to agree with what you would produce, and there are four
places where I have had to make a choice that I am not qualified to make. I
would rather ask once than guess four times.

I am happy to pay for your time, and separately I would like to talk about you
reviewing charts for people who ask for a proper reading.

${line()}
WHAT THE TOOL DOES NOW
${line()}

  Ayanamsa            Lahiri
  Moon position       geocentric, verified against two independent
                      implementations agreeing to under 2 arcminutes
  Birth time missing   assumes local noon and says so plainly on the report
  Manglik             not computed at all, and the report says so

Worked example, ${A.g.nakshatra.name} pada ${A.g.nakshatraPada} (${A.g.rashi.name})
with ${A.b.nakshatra.name} pada ${A.b.nakshatraPada} (${A.b.rashi.name}):

${A.r.kootas.map((k) => `  ${k.koota.padEnd(14)} ${String(k.score).padStart(5)} / ${k.maxPoints}`).join('\n')}
  ${'TOTAL'.padEnd(14)} ${String(A.r.totalScore).padStart(5)} / 36

${line()}
QUESTION 1 — Varna
${line()}

I award 1 point when the groom's varna rank is at least the bride's, and 0
otherwise. Ranks used: Brahmin 4, Kshatriya 3, Vaishya 2, Shudra 1.

  Is that the rule you apply?
  Is Varna ever scored as a half point in your practice?

${line()}
QUESTION 2 — Bhakoot, the 5/9 relationship
${line()}

I award 7 points when the moon signs are 1/1, 1/7, 3/11 or 4/10 apart, and 0
otherwise. That means 5/9 currently scores nothing.
${
    fiveNine
        ? `
  A real case: ${fiveNine.g.rashi.name} with ${fiveNine.b.rashi.name} — four signs
  apart, so a 5/9 relationship. We score Bhakoot 0 of 7 for this pair, which
  costs them seven points out of thirty-six.
`
        : ''
}
  Should 5/9 score, and if so how much?

${line()}
QUESTION 3 — Bhakoot cancellations
${line()}

I cancel Bhakoot dosha when both signs share a ruling planet.

  Which other cancellations do you apply in practice?
  Do you weigh Bhakoot dosha lightly when the rest of the chart is strong?

${line()}
QUESTION 4 — Nadi cancellations
${line()}

This is the one I am least confident about, and it carries the most weight —
eight of the thirty-six points, and the koota families ask about most.

My cancellation rules were written from secondary sources and I do not trust
them. I know of these:

  - both people share the same moon sign
  - both share a birth star but in different padas
  - the birth stars are the same but the rashis differ

  Which of these do you accept, and which others do you use?
  Are there cases where you would not cancel at all?

${line()}

Whatever you tell me goes into the tool, and I will say on the page that the
conventions came from a practising astrologer rather than from a book.

Thank you,
`);

    console.error(
        '\n  Send this as ONE message. Four batched questions respect their time\n' +
        '  and get answered; four separate ones do not.\n\n' +
        '  Their answers land in:\n' +
        '    packages/compatibility/src/astrology/ashtakoota.ts\n'
    );
}

main();

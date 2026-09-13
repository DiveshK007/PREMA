#!/usr/bin/env -S npx tsx
/**
 * handtest.ts — turn a list of couples into forwardable images.
 *
 * The experiment is: do people forward a kundali report to a parent without
 * being asked? Everything else in this repo exists to serve that question, and
 * it has been the outstanding action since the first planning session.
 *
 * This removes the friction. Put real couples in a CSV, run one command, get
 * back the images and the links. The only part left is the part only a person
 * can do: sending them and watching what happens.
 *
 *   npx tsx scripts/handtest.ts --init            # write a template CSV
 *   npx tsx scripts/handtest.ts couples.csv       # generate images + links
 *
 * Requires the web app running (npm run dev --workspace=web). The script says
 * so rather than failing obscurely.
 *
 * CSV columns:
 *   groom_name, groom_date, groom_time, groom_city,
 *   bride_name, bride_date, bride_time, bride_city
 *
 * Dates are YYYY-MM-DD, times are HH:mm and may be blank if unknown — a blank
 * produces the caveat band, which is itself worth testing.
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.PREMA_BASE ?? 'http://localhost:3000';
const OUT = 'handtest-out';

const TEMPLATE = `groom_name,groom_date,groom_time,groom_city,bride_name,bride_date,bride_time,bride_city
# Replace these with real couples. Delete rows you do not need.
# Times may be blank if unknown — that produces the caveat band, which is
# itself worth putting in front of someone.
Arjun Mehta,1994-06-12,07:15,Pune,Priya Nair,1995-11-03,19:40,Kochi
Rohan Das,1991-02-28,23:05,Kolkata,Meera Iyer,1993-08-17,05:50,Chennai
Vikram Singh,1990-09-09,14:20,Jaipur,Ananya Rao,1992-12-25,,Hyderabad
`;

interface Couple {
    groom: { name: string; date: string; time: string; city: string };
    bride: { name: string; date: string; time: string; city: string };
}

function encodePerson(p: { name: string; date: string; time: string; city: string }, role: string) {
    const raw = [p.name, p.date, p.time, p.city, role].join('|');
    return Buffer.from(raw, 'utf8').toString('base64url');
}

function parseCsv(text: string): Couple[] {
    const rows = text
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'))
        .slice(1); // header

    return rows.map((line, i) => {
        const c = line.split(',').map((f) => f.trim());
        if (c.length < 8) {
            throw new Error(`Row ${i + 1} has ${c.length} columns, expected 8:\n  ${line}`);
        }
        return {
            groom: { name: c[0]!, date: c[1]!, time: c[2]!, city: c[3]! },
            bride: { name: c[4]!, date: c[5]!, time: c[6]!, city: c[7]! },
        };
    });
}

async function main(): Promise<void> {
    if (process.argv.includes('--init')) {
        writeFileSync('couples.csv', TEMPLATE);
        console.log('\n  Wrote couples.csv. Replace the rows with real couples, then:\n');
        console.log('    npx tsx scripts/handtest.ts couples.csv\n');
        return;
    }

    const file = process.argv[2];
    if (!file) {
        console.log('\n  Usage: npx tsx scripts/handtest.ts couples.csv');
        console.log('         npx tsx scripts/handtest.ts --init\n');
        process.exit(1);
    }

    // Check the app is up before doing anything, so the failure is legible.
    try {
        const ping = await fetch(BASE, { signal: AbortSignal.timeout(4000) });
        if (!ping.ok) throw new Error(String(ping.status));
    } catch {
        console.error(`\n  The app is not answering at ${BASE}.`);
        console.error('  Start it first:\n');
        console.error('    npm run dev --workspace=web\n');
        console.error('  Or point elsewhere with PREMA_BASE=https://...\n');
        process.exit(1);
    }

    const couples = parseCsv(readFileSync(file, 'utf8'));
    if (!existsSync(OUT)) mkdirSync(OUT);

    console.log(`\n  ${couples.length} couples, rendering from ${BASE}\n`);

    const rows: string[] = [];
    let failures = 0;

    for (const [i, c] of couples.entries()) {
        const qs =
            `a=${encodePerson(c.groom, 'groom')}&b=${encodePerson(c.bride, '')}`;
        const reportUrl = `${BASE}/report?${qs}`;
        const imageUrl = `${BASE}/api/og?${qs}`;
        const label = `${c.groom.name} + ${c.bride.name}`;

        const res = await fetch(imageUrl);
        if (!res.ok) {
            // A bad city or an impossible date shows up here rather than in a
            // stranger's WhatsApp thread.
            const why = await res.text().catch(() => '');
            console.log(`  ${String(i + 1).padStart(2)}. ${label.padEnd(34)} FAILED  ${why.slice(0, 60)}`);
            failures++;
            continue;
        }

        const png = Buffer.from(await res.arrayBuffer());
        const name = `${String(i + 1).padStart(2, '0')}-${c.groom.name.split(' ')[0]}-${c.bride.name.split(' ')[0]}.png`
            .toLowerCase()
            .replace(/[^a-z0-9.-]/g, '-');
        writeFileSync(join(OUT, name), png);

        // Pull the total out of the report page so the summary is useful.
        let total = '?';
        try {
            const html = await (await fetch(reportUrl)).text();
            const m = html.replace(/<!--.*?-->/g, '').match(/>([\d.]+) \/ 36</g);
            if (m?.length) total = m[m.length - 1]!.replace(/[>/<]|36| /g, '');
        } catch {
            /* summary only */
        }

        console.log(`  ${String(i + 1).padStart(2)}. ${label.padEnd(34)} ${total.padStart(5)}/36   ${name}`);
        rows.push(`| ${label} | ${total}/36 | \`${name}\` | ${reportUrl} |`);
    }

    const sheet = [
        '# Hand test',
        '',
        `Generated ${new Date().toISOString().slice(0, 10)} from ${BASE}.`,
        '',
        '## What to do',
        '',
        `1. Send each image in \`${OUT}/\` to one person in the target demographic.`,
        '2. Say nothing clever. Just send it.',
        '3. Wait a day.',
        '4. Fill in the last column below.',
        '',
        '**The number that matters is how many forwarded it to a parent without',
        'being asked.** Below roughly two in ten and the forwarding thesis is',
        'wrong, and no amount of code changes that.',
        '',
        '| Couple | Score | Image | Report link | Forwarded? |',
        '|---|---|---|---|---|',
        ...rows.map((r) => `${r}  |`),
        '',
        '## Result',
        '',
        '- Sent: ___',
        '- Forwarded to a parent unprompted: ___',
        '- Rate: ___%',
        '',
        'Record the answer in TODOS.md either way. A negative result is the most',
        'valuable thing this project can learn right now.',
        '',
    ].join('\n');

    writeFileSync(join(OUT, 'HANDTEST.md'), sheet);

    console.log(`\n  ${couples.length - failures} images in ${OUT}/`);
    if (failures) console.log(`  ${failures} failed — fix those rows and re-run.`);
    console.log(`  Tracking sheet: ${OUT}/HANDTEST.md\n`);
}

main().catch((e) => {
    console.error(`\n  ${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(1);
});

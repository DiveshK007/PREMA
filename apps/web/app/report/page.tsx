import Link from 'next/link';
import {
    computeReport,
    decodePair,
    bornPhrase,
    scoreLabel,
    encodePair,
} from '../../lib/report';
import { ReportActions } from './ReportActions';
import { ReportBeacon } from './ReportBeacon';
import { KootaLedger } from './KootaLedger';
import { PoolOptIn } from './PoolOptIn';
import { DOSHA_COPY } from '../../content/kootas';

export const dynamic = 'force-dynamic';

/**
 * The report.
 *
 * A server component that is a pure function of the URL. The OG image route
 * computes from the same params, so page and image are identical by
 * construction rather than by a database round-trip (eng amendment E3).
 *
 * Hierarchy, per DESIGN.md:
 *   1. the sentence   verdict in plain language, legible at thumbnail size
 *   2. the dosha line the two things families actually veto on
 *   3. the ledger     eight rows, hairlines, no boxes
 *   4. the total      closes the arithmetic she does in her head
 *   5. the caveat     only when the data is uncertain
 *   6. two actions
 *   7. the footer     wordmark + URL. the return path.
 */

function Shell({ children }: { children: React.ReactNode }) {
    return (
        <main className="sheet">
            <div className="eyebrow">Guna Milan · Ashtakoota</div>
            {children}
            <div className="foot">
                <span className="wordmark">Prema</span>
                <a href="/legal/privacy">Privacy</a>
                <a href="/legal/terms">Terms</a>
                <span>prema.in</span>
            </div>
        </main>
    );
}

export default async function ReportPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;
    const pair = decodePair(params);

    if (!pair) {
        return (
            <Shell>
                <div className="band err" role="alert" style={{ marginTop: 20 }}>
                    <b>This link is incomplete.</b> It does not carry two birth records.
                </div>
                <Link className="cta" href="/">
                    Start a new report
                </Link>
            </Shell>
        );
    }

    const result = computeReport(pair.a, pair.b);

    if (!result.ok) {
        const back = `/?${encodePair(pair.a, pair.b)}`;
        return (
            <Shell>
                <div className="band err" role="alert" style={{ marginTop: 20 }}>
                    {result.kind === 'engine' ? (
                        <>
                            <b>We could not calculate this.</b> Something went wrong on our
                            side, not with the details you entered.
                        </>
                    ) : (
                        <>
                            <b>{result.message}</b>
                            {result.kind === 'city' && result.suggestions.length > 0 && (
                                <> Try: {result.suggestions.join(' · ')}.</>
                            )}
                        </>
                    )}
                </div>
                <Link className="cta" href={back}>
                    Go back and fix it
                </Link>
                {result.kind === 'engine' && (
                    <p className="note mono" style={{ fontSize: 12 }}>
                        {result.message}
                    </p>
                )}
            </Shell>
        );
    }

    const { a, b, total, kootas, nadiClear, bhakootClear, assumedNoonFor } = result;

    const qs = encodePair(pair.a, pair.b);
    const ogUrl = `/api/og?${qs}`;
    const pageUrl = `https://prema.in/report?${qs}`;

    const verdictLine =
        `${a.input.name} and ${b.input.name} match on ${total} of 36 gunas. ` +
        `${bhakootClear ? 'No Bhakoot dosha' : 'There is a Bhakoot dosha'}, ` +
        `${nadiClear ? 'Nadi is clear' : 'Nadi is the same for both'}.`;

    // Plain text the astrologer casts from themselves. The engine computes Moon
    // longitude only — there is no lagna chart to send, so this is the birth
    // details formatted the way a pandit expects to receive them.
    const panditText = [
        'Kundali matching — please review.',
        '',
        `1. ${a.input.name}`,
        `   ${bornPhrase(a)}`,
        `   Nakshatra ${a.nakshatra} pada ${a.pada}, Rashi ${a.rashi}`,
        '',
        `2. ${b.input.name}`,
        `   ${bornPhrase(b)}`,
        `   Nakshatra ${b.nakshatra} pada ${b.pada}, Rashi ${b.rashi}`,
        '',
        `Computed guna milan: ${total}/36 (Lahiri ayanamsa, traditional groom-to-bride convention).`,
    ].join('\n');

    return (
        <Shell>
            <ReportBeacon city={a.city.name} assumedNoon={assumedNoonFor.length > 0} />

            <p className="verdict verdict-enter">
                The charts of <b>{a.input.name}</b>, {bornPhrase(a)}, and{' '}
                <b>{b.input.name}</b>, {bornPhrase(b)}, match on{' '}
                <b className="score num">
                    <span aria-hidden="true">{total} of 36 gunas</span>
                    <span className="sr-only">{scoreLabel(total)}</span>
                </b>
                .
            </p>

            <p className="verdict">
                There is <b>{bhakootClear ? 'no Bhakoot dosha' : 'a Bhakoot dosha'}</b>, and{' '}
                <b>{nadiClear ? 'Nadi is clear' : 'Nadi is the same for both'}</b>.
            </p>

            <KootaLedger
                kootas={kootas}
                total={total}
                scoreLabel={scoreLabel(total)}
            />

            {assumedNoonFor.length > 0 && (
                <div className="band" role="note">
                    <b>
                        Birth time not given for {assumedNoonFor.join(' and ')}.
                    </b>{' '}
                    We assumed noon. The nakshatra, and several of the eight gunas, may
                    change once the exact time is known.
                </div>
            )}

            <ReportActions
                ogUrl={ogUrl}
                pageUrl={pageUrl}
                verdictLine={verdictLine}
                panditText={panditText}
            />

            {/* The two verdicts families actually act on, explained at length.
                Below the actions deliberately: the reader who wants the detail
                will scroll for it, and the reader who does not is not made to
                read a lecture before they can forward the thing. */}
            <div className="dosha">
                <h2>
                    {bhakootClear
                        ? DOSHA_COPY.bhakoot.clear.title
                        : DOSHA_COPY.bhakoot.present.title}
                </h2>
                <p>
                    {bhakootClear
                        ? DOSHA_COPY.bhakoot.clear.body
                        : DOSHA_COPY.bhakoot.present.body}
                </p>
                <h2>
                    {nadiClear ? DOSHA_COPY.nadi.clear.title : DOSHA_COPY.nadi.present.title}
                </h2>
                <p>
                    {nadiClear ? DOSHA_COPY.nadi.clear.body : DOSHA_COPY.nadi.present.body}
                </p>
            </div>

            <PoolOptIn city={a.city.name} />

            {/* Divergence disclosure. Ships with the pandit handoff or not at
                all — routing someone to a verdict we do not control is only
                survivable once the page has explained why numbers may differ. */}
            <p className="note">
                Computed with Lahiri ayanamsa, using the traditional groom-to-bride
                convention. Half points are normal.{' '}
                <Link href="/method">Why</Link>
            </p>
        </Shell>
    );
}

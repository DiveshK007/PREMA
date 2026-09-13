import Link from 'next/link';

export const metadata = { title: 'How these numbers are computed — Prema' };

/**
 * The divergence disclosure, in full.
 *
 * Every user can check our total against AstroSage, and some of them will.
 * Explaining the difference before they find it is the difference between a
 * credibility problem and a trust signal.
 */
export default function MethodPage() {
    return (
        <main className="sheet">
            <div className="eyebrow">Method</div>

            <p className="verdict">
                Your astrologer may get a different number than we do. Here is exactly why.
            </p>

            <h2 style={{ fontSize: 19, marginTop: 30, fontWeight: 700 }}>Ayanamsa</h2>
            <p style={{ fontSize: 17, color: 'var(--ink-2)' }}>
                We use the Lahiri ayanamsa, which is the Indian government standard and the
                one most Indian astrologers use. Positions are geocentric.
            </p>

            <h2 style={{ fontSize: 19, marginTop: 26, fontWeight: 700 }}>
                Groom and bride roles
            </h2>
            <p style={{ fontSize: 17, color: 'var(--ink-2)' }}>
                Varna and Vashya are counted from the groom&rsquo;s chart to the
                bride&rsquo;s, not the other way round, so we ask which is which. It is the
                only reason we ask. Scoring without roles would mean averaging two
                directions, which produces quarter points that appear in no tradition and in
                no reference tool.
            </p>

            <h2 style={{ fontSize: 19, marginTop: 26, fontWeight: 700 }}>Half points</h2>
            <p style={{ fontSize: 17, color: 'var(--ink-2)' }}>
                Totals often land on a half — 24.5 out of 36, say. That is normal. Tara
                awards 1.5 when only one direction is auspicious, and the Graha Maitri table
                contains 0.5 and 3. A half point is the tradition, not a rounding error.
            </p>

            <h2 style={{ fontSize: 19, marginTop: 26, fontWeight: 700 }}>Birth time</h2>
            <p style={{ fontSize: 17, color: 'var(--ink-2)' }}>
                The Moon moves about half a degree an hour, and a pada is only 3°20′ wide. If
                a birth time is missing we assume local noon and say so on the report. A
                score built on an assumed time can be wrong by a full nakshatra.
            </p>

            <h2 style={{ fontSize: 19, marginTop: 26, fontWeight: 700 }}>What we do not do</h2>
            <p style={{ fontSize: 17, color: 'var(--ink-2)' }}>
                We do not compute Manglik dosha. It needs Mars and the ascendant, which needs
                more than the Moon. Rather than print an empty verdict, we leave it out — your
                astrologer will check it.
            </p>

            <Link className="cta" href="/">
                Start a report
            </Link>

            <div className="foot">
                <span className="wordmark">Prema</span>
                <a href="/legal/privacy">Privacy</a>
                <a href="/legal/terms">Terms</a>
                <span>prema.in</span>
            </div>
        </main>
    );
}

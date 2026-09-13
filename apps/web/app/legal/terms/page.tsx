export const metadata = { title: 'Terms — Prema' };

export default function Terms() {
    return (
        <>
            <div className="eyebrow">Terms of use</div>
            <p className="verdict">What we do, and what we do not claim.</p>

            <div className="dosha" style={{ marginTop: 26 }}>
                <h2>The service</h2>
                <p>
                    Prema computes Ashtakoota guna milan from two birth records and shows
                    the result. The free report is complete. There is nothing withheld from
                    it and nothing to unlock.
                </p>

                <h2>What the numbers are</h2>
                <p>
                    Guna milan is a traditional system. We compute it carefully and say
                    exactly how on our method page. We do not claim it predicts the outcome
                    of a marriage, and nothing here is advice about whether to marry
                    someone. That judgement is yours, and your family&rsquo;s, and your
                    astrologer&rsquo;s.
                </p>

                <h2>Accuracy</h2>
                <p>
                    We use the Lahiri ayanamsa and the traditional groom-to-bride
                    convention. If a birth time is missing we assume local noon and say so
                    on the report, because a score built on a guessed time can be wrong by a
                    whole nakshatra. We do not compute Manglik.
                </p>

                <h2>Paid reviews</h2>
                <p>
                    Where a paid astrologer review is offered, you are buying a
                    person&rsquo;s reading of the charts, not a different score. See our
                    refunds page.
                </p>

                <h2>Age</h2>
                <p>This service is for adults.</p>
            </div>
        </>
    );
}

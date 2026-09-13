import { TURNAROUND } from '../../../lib/payments';

export const metadata = { title: 'Refunds — Prema' };

export default function Refunds() {
    return (
        <>
            <div className="eyebrow">Refunds</div>
            <p className="verdict">Ask and we refund. We will not ask you why.</p>

            <div className="dosha" style={{ marginTop: 26 }}>
                <h2>The promise</h2>
                <p>
                    A paid astrologer review is delivered within {TURNAROUND}. If it is
                    late, if it is not what you expected, or if you simply changed your
                    mind, write to us and we refund in full.
                </p>

                <h2>No conditions</h2>
                <p>
                    There is no window you can miss and no form to fill in. We would rather
                    return the money than have someone feel they were caught out by a rule
                    they did not read.
                </p>

                <h2>How long it takes</h2>
                <p>
                    We start the refund the day you ask. Your bank decides the rest, which
                    is usually a few working days.
                </p>

                <h2>The free report</h2>
                <p>There is nothing to refund. It is free and always will be.</p>
            </div>
        </>
    );
}

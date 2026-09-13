'use client';

import { useState } from 'react';
import { copyFor } from '../../content/kootas';
import type { KootaRow } from '../../lib/report';

/**
 * The ledger, with each row openable to say what the koota is for.
 *
 * Closed by default. The document must still read as a document — the score,
 * the dosha lines and the total carry the verdict on their own, and the
 * explanations are there for the reader who wants them, not imposed on the one
 * who does not.
 *
 * Each row is a <details>, so it works without JavaScript, is keyboard
 * reachable for free, and a screen reader announces it as expandable.
 */
export function KootaLedger({
    kootas,
    total,
    scoreLabel,
}: {
    kootas: KootaRow[];
    total: number;
    scoreLabel: string;
}) {
    const [openAll, setOpenAll] = useState(false);

    return (
        <div className="ledger">
            <div className="ledger-head">
                <span>Koota</span>
                <button
                    type="button"
                    className="textlink"
                    style={{ minHeight: 0 }}
                    aria-expanded={openAll}
                    onClick={() => setOpenAll((v) => !v)}
                >
                    {openAll ? 'Hide what these mean' : 'What these mean'}
                </button>
                <span className="ledger-head-points">Points</span>
            </div>

            {kootas.map((k) => {
                const copy = copyFor(k.koota);
                const full = k.score === k.maxPoints;
                const none = k.score === 0;
                // A partial score is not a failure. Fall back to `weak` only
                // when a koota has no partial copy, which is the case for the
                // ones that only ever score full or zero.
                const verdict = full
                    ? copy?.strong
                    : none
                      ? copy?.weak
                      : (copy?.partial ?? copy?.weak);
                return (
                    <details key={k.koota} className="koota" open={openAll}>
                        <summary>
                            <span className="koota-name">
                                {k.koota}{' '}
                                <span className="dv" lang="sa">
                                    {k.devanagari}
                                </span>
                            </span>
                            <span
                                className="num koota-score"
                                aria-label={`${k.score} out of ${k.maxPoints}`}
                            >
                                {k.score} / {k.maxPoints}
                            </span>
                        </summary>
                        {copy && (
                            <div className="koota-body">
                                <p>{copy.about}</p>
                                <p className="koota-verdict">{verdict}</p>
                            </div>
                        )}
                    </details>
                );
            })}

            <div className="ledger-total">
                <span>Total</span>
                <span className="num" aria-label={scoreLabel}>
                    {total} / 36
                </span>
            </div>
        </div>
    );
}

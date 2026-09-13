'use client';

import { useState } from 'react';
import { track } from '../../lib/events';

/**
 * The pool opt-in.
 *
 * Records an ANONYMOUS consent event only — timestamp, opted_in, city. No name,
 * no date of birth, no birth time. Therefore no deletion path, no retention
 * statement, no DPDP surface, and nothing to regret storing.
 *
 * Be honest about what this measures. A checkbox is a free action, and this
 * whole project has spent its reviews establishing that free actions are
 * interest rather than demand. So the opt-in RATE is a signal about interest in
 * a pool, and it is explicitly not proof anyone would join one. If the rate
 * clears the threshold in the plan, the next step is building the real capture
 * WITH a contact field — which is a much bigger ask and therefore much better
 * evidence.
 */
export function PoolOptIn({ city }: { city: string }) {
    const [checked, setChecked] = useState(false);
    const [recorded, setRecorded] = useState(false);

    function toggle(next: boolean) {
        setChecked(next);
        // Fire once, on opt-in only. Unchecking is not an event.
        if (next && !recorded) {
            track({ name: 'optin_checked', city });
            setRecorded(true);
        }
    }

    return (
        <div className="optin">
            <label>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggle(e.target.checked)}
                />
                <span>
                    Tell me if Prema builds a place where everyone&rsquo;s chart has already
                    been checked.
                </span>
            </label>
            <p className="why">
                {recorded
                    ? 'Noted — and nothing about you was stored. We recorded only that someone in ' +
                      city +
                      ' was interested. When there is something to join, we will say so here.'
                    : 'Ticking this stores no personal details. Not your name, not your date of birth, not your birth time. Only that someone in ' +
                      city +
                      ' would want it.'}
            </p>
        </div>
    );
}

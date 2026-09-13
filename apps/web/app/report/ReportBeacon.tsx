'use client';

import { useEffect, useRef } from 'react';
import { track } from '../../lib/events';

/**
 * Fires report_generated exactly once per mount.
 *
 * This is the DENOMINATOR for every success criterion in the plan, so it has
 * to be exactly once — a StrictMode double-mount must not inflate it.
 */
export function ReportBeacon({ city, assumedNoon }: { city: string; assumedNoon: boolean }) {
    const fired = useRef(false);
    useEffect(() => {
        if (fired.current) return;
        fired.current = true;
        track({ name: 'report_generated', city });
        if (assumedNoon) track({ name: 'birthtime_missing' });
    }, [city, assumedNoon]);
    return null;
}

/**
 * Instrumentation.
 *
 * Eight events, written SERVER-SIDE through a route handler — never through an
 * anonymous-insert RLS policy. A public unauthenticated write endpoint whose
 * contents are the primary success metric is trivially forgeable, and
 * client-side analytics lose a material share of Indian traffic to ad-blockers,
 * which would bias the *denominator* specifically (eng amendment, correction 8).
 *
 * With no Supabase credentials configured the sink falls back to a structured
 * server log. Nothing about the experiment silently stops recording.
 */

export type EventName =
    | 'report_generated'
    | 'share_clicked'
    | 'share_completed'
    | 'share_unavailable'
    | 'pandit_clicked'
    | 'optin_checked'
    | 'pay_clicked'
    | 'pay_completed'
    | 'geocode_miss'
    | 'birthtime_missing';

export interface EventPayload {
    name: EventName;
    /** Coarse, non-identifying context only. Never a name, DOB or birth time. */
    city?: string;
    detail?: string;
}

/**
 * Fire an event from the browser.
 *
 * `keepalive` so it survives the navigation that `navigator.share` can trigger.
 * Failure is swallowed: a missing analytics write must never break the report.
 */
export function track(payload: EventPayload): void {
    if (typeof window === 'undefined') return;
    try {
        void fetch('/api/events', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
        }).catch(() => {});
    } catch {
        /* never block the page */
    }
}

/**
 * Why share_completed exists.
 *
 * `share_clicked` is NOT a forward. A user can open the share sheet, change
 * their mind and back out, and a click-based metric counts it. The primary
 * success criterion is a share rate, so the threshold is measured on
 * `share_completed`, which fires only when navigator.share resolves.
 * `share_clicked` is kept alongside it to give the abandonment rate.
 */
export const PRIMARY_METRIC: EventName = 'share_completed';

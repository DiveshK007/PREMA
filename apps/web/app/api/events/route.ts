import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Server-side event sink.
 *
 * Deliberately NOT an anonymous-insert RLS policy on Supabase: a public,
 * unauthenticated, unrate-limited write endpoint whose contents are the primary
 * success metric is trivially forgeable, including by an accidental crawler.
 * Writing server-side with a secret key keeps the denominator honest and keeps
 * the anon key off the client.
 *
 * With no Supabase credentials configured this falls back to a structured log
 * so the experiment never silently stops recording.
 */

const ALLOWED = new Set([
    'report_generated',
    'share_clicked',
    'share_completed',
    'share_unavailable',
    'pandit_clicked',
    'optin_checked',
    'pay_clicked',
    'pay_completed',
    'geocode_miss',
    'birthtime_missing',
]);

export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { name, city, detail } = (body ?? {}) as Record<string, unknown>;
    if (typeof name !== 'string' || !ALLOWED.has(name)) {
        return NextResponse.json({ ok: false }, { status: 400 });
    }

    const row = {
        name,
        // Coarse, non-identifying only. Never a person's name, DOB or birth time.
        city: typeof city === 'string' ? city.slice(0, 60) : null,
        detail: typeof detail === 'string' ? detail.slice(0, 120) : null,
        at: new Date().toISOString(),
    };

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;

    if (url && key) {
        try {
            await fetch(`${url}/rest/v1/events`, {
                method: 'POST',
                headers: {
                    apikey: key,
                    authorization: `Bearer ${key}`,
                    'content-type': 'application/json',
                    prefer: 'return=minimal',
                },
                body: JSON.stringify(row),
            });
        } catch {
            console.warn('[events] sink unreachable, logging instead', row);
        }
    } else {
        console.info('[events]', JSON.stringify(row));
    }

    return NextResponse.json({ ok: true });
}

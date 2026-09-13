import { ImageResponse } from 'next/og';
import { computeReport, decodePair, longDate } from '../../../lib/report';

/**
 * The forwarded artifact.
 *
 * Node runtime, not edge: the compute path pulls in astronomy-engine and luxon,
 * and Node removes the edge bundle ceiling and the Node-API compatibility
 * question entirely (eng amendment, correction 10).
 *
 * Computed from the SAME search params as the page, through the SAME pure
 * function. The two cannot disagree.
 *
 * Devanagari is deliberately absent here. Satori does not ship a Devanagari
 * face and falls back over the network for unknown glyphs — a fallback that
 * fails silently in sandboxed builds and renders tofu in the image that
 * actually reaches the family. English only until a Noto Sans Devanagari TTF
 * is vendored and embedded (TODOS.md). Better a plain image than a broken one.
 */

export const runtime = 'nodejs';

const PAPER = '#FBFAF7';
const INK = '#141619';
const INK2 = '#5D5449';
const INK3 = '#6B6257';
const HAIR = '#E5E1D8';
const WARN = '#9A6A1F';
const WARN_BG = '#FAF3E6';

const W = 1080;
const H = 1350; // 4:5 — the tallest crop WhatsApp shows without trimming

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pair = decodePair({
        a: searchParams.get('a') ?? undefined,
        b: searchParams.get('b') ?? undefined,
    });

    if (!pair) return new Response('Missing birth records', { status: 400 });

    const result = computeReport(pair.a, pair.b);
    if (!result.ok) return new Response(result.message, { status: 422 });

    const { a, b, total, kootas, nadiClear, bhakootClear, assumedNoonFor } = result;

    const person = (p: typeof a) =>
        `${p.input.name} · ${longDate(p.input.date)}${p.input.time ? ` at ${p.input.time}` : ''} · ${p.city.name}`;

    return new ImageResponse(
        (
            <div
                style={{
                    width: W,
                    height: H,
                    background: PAPER,
                    color: INK,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '72px 76px',
                    fontFamily: 'serif',
                }}
            >
                <div
                    style={{
                        fontSize: 22,
                        letterSpacing: 6,
                        textTransform: 'uppercase',
                        color: INK3,
                        display: 'flex',
                    }}
                >
                    Guna Milan · Ashtakoota
                </div>

                {/* 1. THE SENTENCE — the whole verdict, legible at thumbnail size */}
                <div style={{ fontSize: 46, lineHeight: 1.42, marginTop: 40, display: 'flex', flexWrap: 'wrap' }}>
                    <span>
                        {a.input.name} and {b.input.name} match on{' '}
                    </span>
                    <span style={{ fontWeight: 700 }}>{total} of 36 gunas.</span>
                </div>

                {/* 2. THE DOSHA LINE */}
                <div style={{ fontSize: 38, lineHeight: 1.45, marginTop: 26, color: INK, display: 'flex' }}>
                    {bhakootClear ? 'No Bhakoot dosha' : 'There is a Bhakoot dosha'}
                    {' · '}
                    {nadiClear ? 'Nadi is clear' : 'Nadi is the same for both'}
                </div>

                <div style={{ fontSize: 24, color: INK2, marginTop: 30, lineHeight: 1.6, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex' }}>{person(a)}</div>
                    <div style={{ display: 'flex' }}>{person(b)}</div>
                </div>

                {/* 3. THE LEDGER — hairlines, no boxes */}
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 38, borderTop: `2px solid ${INK}` }}>
                    {kootas.map((k) => (
                        <div
                            key={k.koota}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '17px 0',
                                borderBottom: `1px solid ${HAIR}`,
                                fontSize: 30,
                            }}
                        >
                            <span>{k.koota}</span>
                            <span>
                                {k.score} / {k.maxPoints}
                            </span>
                        </div>
                    ))}
                    {/* 4. THE TOTAL — closes the arithmetic she does in her head */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '22px 0 0',
                            borderTop: `3px solid ${INK}`,
                            fontSize: 38,
                            fontWeight: 700,
                        }}
                    >
                        <span>Total</span>
                        <span>{total} / 36</span>
                    </div>
                </div>

                {/* 5. THE CAVEAT — only when the data is uncertain */}
                {assumedNoonFor.length > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            marginTop: 30,
                            borderLeft: `5px solid ${WARN}`,
                            background: WARN_BG,
                            padding: '20px 24px',
                            fontSize: 25,
                            lineHeight: 1.45,
                            color: '#3F3626',
                        }}
                    >
                        Birth time not given for {assumedNoonFor.join(' and ')}. Noon was
                        assumed; the nakshatra and several gunas may change.
                    </div>
                )}

                <div style={{ flex: 1 }} />

                {/* 7. THE FOOTER — the return path. Without it every forward is
                     a dead end and the share rate can never become a growth rate. */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        borderTop: `1px solid ${HAIR}`,
                        paddingTop: 22,
                        fontSize: 22,
                        color: INK3,
                        letterSpacing: 3,
                    }}
                >
                    <span style={{ color: INK, letterSpacing: 10, textTransform: 'uppercase' }}>
                        Prema
                    </span>
                    <span>prema.in</span>
                </div>
            </div>
        ),
        { width: W, height: H }
    );
}

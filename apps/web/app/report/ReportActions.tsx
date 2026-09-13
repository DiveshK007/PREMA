'use client';

import { useState } from 'react';
import { track } from '../../lib/events';

/**
 * Share, pandit handoff, and the paid upgrade.
 *
 * wa.me carries TEXT ONLY and cannot attach a file. So the primary path is
 * navigator.share({ files }), which is the API that actually drops an image
 * into a WhatsApp chat, with a wa.me text link as the fallback where file
 * sharing is unsupported (eng amendment E4).
 */

type ShareState = 'idle' | 'preparing' | 'sent' | 'unavailable';

export function ReportActions({
    ogUrl,
    pageUrl,
    verdictLine,
    panditText,
}: {
    ogUrl: string;
    pageUrl: string;
    verdictLine: string;
    panditText: string;
}) {
    const [state, setState] = useState<ShareState>('idle');

    async function share() {
        track({ name: 'share_clicked' });
        setState('preparing');

        try {
            const res = await fetch(ogUrl);
            if (!res.ok) throw new Error(`image ${res.status}`);
            const blob = await res.blob();
            const file = new File([blob], 'kundali-match.png', { type: 'image/png' });

            const canShareFile =
                typeof navigator !== 'undefined' &&
                typeof navigator.canShare === 'function' &&
                navigator.canShare({ files: [file] });

            if (!canShareFile) {
                track({ name: 'share_unavailable' });
                setState('unavailable');
                return;
            }

            await navigator.share({ files: [file], text: verdictLine });

            // Only reached when the share sheet RESOLVES. An abandoned sheet
            // rejects, so it is never counted. This is the primary metric.
            track({ name: 'share_completed' });
            setState('sent');
        } catch (err) {
            // AbortError means the user backed out of the share sheet. That is
            // an answer, not a failure — return to idle and count nothing.
            if (err instanceof DOMException && err.name === 'AbortError') {
                setState('idle');
                return;
            }
            track({ name: 'share_unavailable' });
            setState('unavailable');
        }
    }

    const waLink = `https://wa.me/?text=${encodeURIComponent(`${verdictLine}\n\n${pageUrl}`)}`;
    const panditLink = `https://wa.me/?text=${encodeURIComponent(panditText)}`;

    return (
        <>
            {state === 'sent' ? (
                <>
                    <div className="band ok" role="status">
                        <b>Sent.</b> If it did not arrive, send it again — nothing is lost.
                    </div>
                    <button className="cta2" onClick={() => setState('idle')}>
                        Send to someone else
                    </button>
                </>
            ) : state === 'unavailable' ? (
                <>
                    <div className="band" role="status">
                        <b>This browser cannot attach the image.</b> We will send a link
                        instead — whoever opens it sees the full report.
                    </div>
                    <a
                        className="cta"
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => track({ name: 'share_completed', detail: 'link-fallback' })}
                    >
                        Send a link on WhatsApp
                    </a>
                    <a className="cta2" href={ogUrl} download="kundali-match.png">
                        Save the image to send yourself
                    </a>
                </>
            ) : (
                <button className="cta" onClick={share} disabled={state === 'preparing'}>
                    {state === 'preparing' ? 'Preparing image…' : 'Send to family'}
                </button>
            )}

            {/* Serve the astrologer rather than compete with them. Ships together
                with the divergence disclosure below, never on its own. */}
            <a
                className="cta2"
                href={panditLink}
                target="_blank"
                rel="noreferrer"
                onClick={() => track({ name: 'pandit_clicked' })}
            >
                Send these details to your astrologer
            </a>

            {/* The paid upgrade. Rendered IDENTICALLY at 32/36 and at 11/36 —
                same position, same wording, same weight. No copy implying
                payment can change or rescue a verdict, no countdown, no
                scarcity. This is .agents/skills/prema-human-factors/SKILL.md
                holding, and it is deliberate: targeting this at disappointed
                users is exactly what that rule forbids. */}
            <a
                className="cta2"
                href="/review-request"
                onClick={() => track({ name: 'pay_clicked' })}
            >
                Have an astrologer review this
            </a>
            <p className="subnote">
                Reviewed and signed within 3 working days · full refund on request
            </p>
        </>
    );
}

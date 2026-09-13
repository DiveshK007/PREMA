import Link from 'next/link';
import { paymentConfig, formatPrice, TURNAROUND, REFUND } from '../../lib/payments';
import { decodePair, computeReport, encodePair } from '../../lib/report';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Astrologer review — Prema' };

/**
 * The paid tier.
 *
 * ETHICS CONSTRAINT, binding, from .agents/skills/prema-human-factors/SKILL.md:
 * this page renders IDENTICALLY whatever score sent the user here. It does not
 * read the total, does not mention it, and has no branch on it. There is no
 * copy implying payment can change or rescue a verdict, no countdown, no
 * scarcity, no "improve your score".
 *
 * Targeting an upsell at people who just received bad news is precisely what
 * that rule forbids, and the cheapest way to guarantee compliance is to make
 * the page structurally incapable of it.
 */
export default async function ReviewRequestPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const params = await searchParams;
    const pair = decodePair(params);
    const cfg = paymentConfig();
    const price = formatPrice(cfg);

    // Used only to carry the order through checkout. Deliberately NOT used to
    // vary a single word on this page.
    const chartParams = pair ? encodePair(pair.a, pair.b) : null;
    const chartsResolve = pair ? computeReport(pair.a, pair.b).ok : false;

    return (
        <main className="sheet">
            <div className="eyebrow">Astrologer review</div>

            <p className="verdict">
                A practising astrologer reads both charts and sends you a signed report.
            </p>

            <div className="dosha" style={{ marginTop: 26 }}>
                <h2>What you get</h2>
                <p>
                    The full 36-point matching checked by hand, including the things a
                    calculator cannot judge: whether a Bhakoot or Nadi cancellation applies
                    here, and Manglik, which we do not compute at all.
                </p>

                <h2>What it does not do</h2>
                <p>
                    It does not change your score. Nobody can. The review tells you what an
                    astrologer makes of the charts you already have.
                </p>

                <h2>Turnaround and refunds</h2>
                <p>
                    Reviewed and signed within {TURNAROUND}. {REFUND}
                </p>
            </div>

            {cfg.live && chartParams && chartsResolve ? (
                <>
                    <a
                        className="cta"
                        href={`${cfg.checkoutUrl}?chart_params=${encodeURIComponent(chartParams)}`}
                    >
                        {price ? `Request a review — ${price}` : 'Request a review'}
                    </a>
                    <p className="subnote">
                        Payment is handled by our provider. No card details reach Prema.
                    </p>
                </>
            ) : (
                <div className="band" role="note">
                    <b>Not open yet.</b> We are still setting this up, so no payment is being
                    taken and nothing has been charged. The report you already have is
                    complete and free.
                </div>
            )}

            <Link className="cta2" href={chartParams ? `/report?${chartParams}` : '/'}>
                Back to the report
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

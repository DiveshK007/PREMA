import Link from 'next/link';

/**
 * Legal pages.
 *
 * These are a payment-KYC prerequisite: Razorpay and Stripe India will not
 * onboard without live Terms, Privacy, Refund and Contact pages on a registered
 * custom domain. The eng review flagged that this prerequisite sits inside the
 * increment that ships first, and nobody had listed it.
 *
 * Written plainly rather than in template legalese. A document nobody can read
 * is not a disclosure.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="sheet">
            {children}
            <nav className="legal-nav">
                <Link href="/legal/terms">Terms</Link>
                <Link href="/legal/privacy">Privacy</Link>
                <Link href="/legal/refunds">Refunds</Link>
                <Link href="/legal/contact">Contact</Link>
            </nav>
            <div className="foot">
                <span className="wordmark">Prema</span>
                <span>prema.in</span>
            </div>
        </main>
    );
}

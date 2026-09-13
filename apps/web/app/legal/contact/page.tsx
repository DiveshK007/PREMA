export const metadata = { title: 'Contact — Prema' };

export default function Contact() {
    return (
        <>
            <div className="eyebrow">Contact</div>
            <p className="verdict">A person reads these.</p>

            <div className="dosha" style={{ marginTop: 26 }}>
                <h2>Email</h2>
                <p>
                    <a href="mailto:hello@prema.in">hello@prema.in</a>
                </p>

                <h2>What to write about</h2>
                <p>
                    A refund, a birth city we are missing, a number that disagrees with your
                    astrologer, or anything that looks wrong. The last one is genuinely
                    useful to us — if our calculation differs from a reference you trust, we
                    want to know which and why.
                </p>

                <h2>Response time</h2>
                <p>
                    Prema is small. Expect a reply within a couple of working days, from a
                    person rather than a system.
                </p>
            </div>
        </>
    );
}

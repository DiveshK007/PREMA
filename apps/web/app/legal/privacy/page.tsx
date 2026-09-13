export const metadata = { title: 'Privacy — Prema' };

/**
 * Written to be true of what the code actually does, not aspirationally.
 * Every claim here is checkable against apps/web/lib and the migrations.
 */
export default function Privacy() {
    return (
        <>
            <div className="eyebrow">Privacy</div>
            <p className="verdict">
                A free report stores nothing about you. Here is exactly what happens in each
                case.
            </p>

            <div className="dosha" style={{ marginTop: 26 }}>
                <h2>The free report</h2>
                <p>
                    Both sets of birth details are carried in the web address itself. They
                    are not written to any database. That means the link is the report:
                    anyone you send it to can open it, and it will appear in your browser
                    history and in ordinary server access logs. Do not share a link with
                    someone you would not share the birth details with.
                </p>

                <h2>What we measure</h2>
                <p>
                    We record that a report was generated, that a share button was pressed,
                    and which city was entered. No name, no date of birth, no birth time. We
                    do this on our server rather than in your browser, so the counts are
                    honest.
                </p>

                <h2>The pool checkbox</h2>
                <p>
                    Ticking it records three things: the time, that someone was interested,
                    and the city. Nothing that identifies you. There is nothing to delete
                    because there is nothing stored about you.
                </p>

                <h2>Paid reviews</h2>
                <p>
                    If you pay for an astrologer review we do store both people&rsquo;s
                    birth details, because reviewing those two charts is the thing you asked
                    us to do. We keep them while we fulfil the order and through the refund
                    window, then erase them after ninety days. The order record survives for
                    accounting; the birth details do not. Card details never reach us — our
                    payment provider handles them.
                </p>

                <h2>The second person</h2>
                <p>
                    You can enter someone else&rsquo;s birth details, and they will not
                    know. We think you should tell them. We have kept what we store to the
                    minimum that makes the service work, which is why the free report stores
                    nothing at all.
                </p>

                <h2>Asking us</h2>
                <p>
                    If you have paid for a review and want the birth details erased before
                    the ninety days are up, write to us and we will do it.
                </p>
            </div>
        </>
    );
}

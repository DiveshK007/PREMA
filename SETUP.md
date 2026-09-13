# What only you can do

Everything in this repo is built and tested. What remains needs a human with a
bank account, a phone, and access to people. This is that list, in the order
that unblocks the most.

Nothing here is engineering. If you do steps 1 and 2 and nothing else, you will
have learned more than the last three weeks of planning did.

---

## 1. The hand test — do this first, today

**Time: about an hour. Cost: nothing. Unblocks: whether any of the rest matters.**

You need roughly 20 real births for the golden fixture (step 3) regardless. Use
ten of them twice.

1. Run the app locally:
   ```bash
   npm install
   npm run dev --workspace=web        # http://localhost:3000
   ```
2. Make ten reports for real couples you know of — friends, cousins, anyone
   whose birth details you can get honestly.
3. Screenshot each one, or grab the image straight from
   `/api/og?a=...&b=...` (the URL is in the page's share button).
4. Send them to ten people in the target demographic. Say nothing clever. Just
   send it.
5. **Count how many forward it to a parent without being asked.**

That number is the entire thesis. Below roughly two in ten and the forwarding
bet is wrong, and no amount of Next.js changes it. Above that and you know
exactly what to build next.

> This has been the outstanding action since the very first planning session.
> Three reviews and a working application later, it is still the only thing
> nobody has done.

---

## 2. Find one astrologer

**Time: a few conversations. Cost: their fee. Unblocks: the paid tier, and four
open engine questions.**

You need a practising astrologer for two separate reasons, and one person can
serve both.

**As a supplier** for the paid review tier. Manual fulfilment means you pay them
per report and email the signed result yourself. There is no integration.

**As the authority on four questions the code cannot settle.** Send these
together, not one at a time:

1. **Varna convention.** We score 1 point if the groom's varna rank is at least
   the bride's, else 0. Correct?
2. **Bhakoot 5/9.** We award 7 for 1/1, 1/7, 3/11 and 4/10, and 0 otherwise.
   Should 5/9 score?
3. **Bhakoot cancellations.** We cancel when both signs share a ruling planet.
   Which other cancellations do you apply?
4. **Nadi cancellations.** Ours are hand-rolled and unverified. Nadi is 8 of 36
   points and the one families ask about most. Which cancellations count?

Their answers land in `packages/compatibility/src/astrology/ashtakoota.ts`.

---

## 3. Verify the numbers against AstroSage

**Time: about an hour of copying. Unblocks: shipping to strangers.**

Right now 40 tests prove the engine is internally consistent. None prove it is
externally right — which is exactly what it was not before the heliocentric bug
was found.

```bash
npx tsx scripts/fixture.ts          # prints 20 births to check
```

For each one, run it through [AstroSage](https://www.astrosage.com) and record
the nakshatra, pada and rashi into:

```
packages/compatibility/__tests__/fixtures/golden.json
```

Fill in the `expected` block. Leave `ours` alone — it is there so you can spot
disagreements at a glance. The test activates itself as soon as any entry has
values, and `npm test` prints how much of the fixture is verified.

**Before calling a mismatch a bug:** AstroSage may use a topocentric Moon while
we use geocentric. Lunar parallax reaches about 1 degree, roughly 0.3 of a pada.
If disagreements cluster ONLY at the boundary births, suspect the position model
rather than the code.

---

## 4. Name the price

**Time: a decision. Unblocks: the paid experiment meaning anything.**

`REVIEW_PRICE_MINOR` is deliberately unset, and payments cannot go live without
it. That is enforced in code, not merely documented.

Anchor against what a family pandit charges per consultation in your city, since
that is the substitute good people are actually comparing you to. An unnamed
price makes the willingness-to-pay result uninterpretable: you would not know
whether nobody wants it or whether you simply picked wrong.

Set it in minor units — `49900` is ₹499.

---

## 5. Name the acquisition channel

**Time: a decision. Unblocks: the experiment concluding at all.**

The success criteria need a minimum of 100 reports. There is no paid
acquisition, so those 100 have to come from somewhere specific.

Name it before launch: your own network, plus **one** particular community — a
WhatsApp group, a subreddit, an alumni network. Write it down.

**Estimate your reach honestly first.** A personal network realistically yields
20 to 40. If you cannot see a path to 100, the experiment design needs changing,
not the channel. Better to know that now than three weeks in.

> Also worth knowing: at n=100 a 2% paid conversion crosses on two purchases,
> with a confidence interval spanning "dead" to "great". Treat the paid tier as
> a qualitative probe unless you can reach a much larger n.

---

## 6. Deploy (free tier is fine for now)

**Vercel Pro is NOT required yet.** Hobby forbids *commercial* use. While
`PAYMENTS_LIVE=false` you are shipping a free report and selling nothing, so
Hobby is fine for building, testing and even a live free experiment.

It becomes mandatory the moment the pay button goes live.

```
Vercel project settings
  Root directory     apps/web
  Framework          Next.js
  Node version       24          (package.json requires >=24; local is 20 and
                                  builds fine, but match it in production)
  Build command      (default)
```

Environment variables — all optional, all absent-safe:

| Variable | Needed for | Notes |
|---|---|---|
| `SUPABASE_URL` | instrumentation | Without it events go to the server log |
| `SUPABASE_SECRET_KEY` | instrumentation | **Secret key, not the anon key.** Never exposed to the browser |
| `PAYMENTS_LIVE` | the pay button | Leave `false` until steps 4 and 7 are done |
| `REVIEW_PRICE_MINOR` | the pay button | Minor units. Payments stay off without it |
| `REVIEW_CURRENCY` | the pay button | Defaults to `INR` |
| `CHECKOUT_URL` | the pay button | Hosted link. No card data touches this app |
| `PAYMENT_WEBHOOK_SECRET` | the order ledger | Without it the webhook returns 503 rather than trusting unsigned input |

Run the migration once against your Supabase project:

```
supabase/migrations/20260913120000_events_and_orders.sql
```

It creates `events` and `review_orders`, both with RLS on and **no permissive
policies** — server-side writes only. It also adds
`purge_delivered_order_charts()`, which you should schedule; it clears birth
details from delivered orders after 90 days.

---

## 7. Payment KYC — start early, it is the long pole

**Time: days to weeks. None of it is engineering.**

Razorpay and Stripe India will not onboard you without:

- a registered business entity
- PAN and a bank account in that entity's name
- **live Terms, Privacy, Refund and Contact pages on a registered custom
  domain** — a `*.vercel.app` address will not pass

That last one is why those four pages exist already, at `/legal/*`. Point a real
domain at the deployment before you apply, or the application stalls on
something you could have had ready weeks earlier.

Once approved:
1. Set `CHECKOUT_URL` and `PAYMENT_WEBHOOK_SECRET`
2. Point the provider's webhook at `https://yourdomain/api/payment-webhook`
3. Send one test event and confirm a row appears in `review_orders`
4. Send the **same** event again and confirm no duplicate appears — the UNIQUE
   constraint should absorb it and the endpoint should still return 2xx
5. Only then set `PAYMENTS_LIVE=true`
6. Upgrade to Vercel Pro

---

## Still open in the code, for reference

Nothing below blocks you, and none of it needs deciding today.

- **Hindi and Marathi copy.** Structure is ready in
  `apps/web/content/kootas.ts`; English is complete. Deliberately not
  machine-translated — subtly wrong religious terminology reads as careless in
  exactly the register where carelessness costs most. Needs a human translator.
  Tamil is deferred further; it needs a third embedded font.
- **Step 2 emotional gap.** Asking someone to type their prospective partner's
  birth time into a stranger's website is socially loaded and nothing in the
  design acknowledges it. If step-2 abandonment is high, this is why.
- **Manglik.** Not computed. Cheaper than originally estimated —
  `astronomy-engine` is already a dependency and supplies Mars longitude — but
  it also needs the ascendant.
- **Numerology.** Weighted 0.00 and display-only. Either weight it or stop
  describing the product as matching on it.
- **The standing shortlist.** Gated on the opt-in rate clearing its threshold.
  Do not build it before then; an empty pool disproves the pitch.

See `TODOS.md` for the full list with reasoning attached.

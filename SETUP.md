# What only you can do

Everything in this repo is built, tested and automated as far as a machine can
take it. What remains needs a human with a bank account, a phone, and access to
people.

Each step below names the command that does the machine half, so the part left
to you is only the part a machine genuinely cannot do.

Nothing here is engineering. If you do steps 1 and 2 and nothing else, you will
have learned more than the last three weeks of planning did.

---

## 1. The hand test — do this first, today

**Time: about an hour. Cost: nothing. Unblocks: whether any of the rest matters.**

You need roughly 20 real births for the golden fixture (step 3) regardless. Use
ten of them twice.

**Automated for you:** image generation, links, and a tracking sheet.

```bash
npm install
npm run dev --workspace=web     # leave running, http://localhost:3000

npm run handtest -- --init      # writes couples.csv
#   ...replace the rows with real couples...
npm run handtest -- couples.csv # writes handtest-out/ with images + HANDTEST.md
```

A blank birth-time column is fine and worth including — it produces the caveat
band, which is itself worth putting in front of someone.

**Left to you:**

1. Get birth details for ten real couples, honestly.
2. Send each image to one person in the target demographic. Say nothing clever.
3. Wait a day.
4. **Count how many forward it to a parent without being asked.** Fill in
   `handtest-out/HANDTEST.md`.

`handtest-out/` and `couples.csv` are gitignored — they contain real people's
birth details and are never committed.

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

**As the authority on four questions the code cannot settle.**

**Automated for you:** the message is written, with live worked examples pulled
from the engine so every question has a concrete case attached.

```bash
npm run astrologer              # prints it
npm run astrologer > brief.txt  # or save it
```

Send it as ONE message. Four batched questions get answered; four separate
conversations do not.

**Left to you:** finding the person, and paying them. Their answers land in
`packages/compatibility/src/astrology/ashtakoota.ts`.

---

## 3. Spot-check the conventions against AstroSage

**Time: fifteen minutes, not an hour. Unblocks: shipping to strangers.**

**Already automated, and this changed what is left for you.** The *astronomy* is
now verified by machine:

```bash
npm run verify:ephemeris
```

That implements lunar longitude from scratch (Meeus ch.47) and compares it
against astronomy-engine. Two implementations sharing no code agree to **0.64
arcminutes mean, 1.8 worst, across 1900-2100** — and the check proves it has
teeth by confirming the old heliocentric call still fails it by 8.22 degrees. It
runs in the normal test gate and weekly in CI.

So you are no longer verifying whether the Moon is in the right place. You are
only verifying **convention**: ayanamsa choice, nakshatra boundaries, koota
rules. That is a handful of spot-checks, not twenty lookups.

```bash
npx tsx scripts/fixture.ts          # prints 20 births to check
```

Do **three or four**, not all twenty — pick from the boundary cases, since those
are where a convention difference actually shows. Run each through
[AstroSage](https://www.astrosage.com) and record the nakshatra, pada and rashi
into:

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

A `vercel.json` is committed with the monorepo build commands and `bom1`
(Mumbai) as the region — your audience is in India, and serving the report from
Washington adds a round trip to the one artifact that has to feel instant.

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

## What the machine now does on its own

| | Command | Runs |
|---|---|---|
| Full gate: types, tests, lint, build | `npm test` / CI | every push and PR |
| Independent ephemeris cross-check | `npm run verify:ephemeris` | test gate + weekly |
| Run any chart from the CLI | `npm run chart -- "14/03/1998 04:20 Pune" "..."` | on demand |
| Golden fixture candidates | `npm run fixture` | on demand |
| Hand-test images and tracking sheet | `npm run handtest -- couples.csv` | on demand |
| Astrologer brief with worked examples | `npm run astrologer` | on demand |

CI lives in `.github/workflows/`. The gate pins Node 24 so it cannot pass on a
version production will not run, and it asserts the engine is executable from a
clean checkout — which it was not, for this repo's entire history.

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

# TODOS

Deferred work with its reasoning attached. Items here were considered and consciously
postponed, not forgotten. Each says what would make it worth doing.

Source: `/plan-ceo-review` 2026-09-12 (SCOPE EXPANSION mode).
Plan: `docs/designs/forwardable-kundali-report.md`

---

## Deferred — product

### Standing-shortlist list view
The chart-capture opt-in ships in the first push; the view does not.

**Trigger to build:** the consented pool reaches a depth where a median user sees 3+
candidates after hard filters. Before that, an empty shortlist actively disproves the
pitch, which is worse than not shipping it.

**Cost when built:** ~1 day CC+gstack. The matching work is `calculateGunaMilan` in a
loop; the work is the ranked list UI and the privacy model for what one user sees of
another.

### Birth-time uncertainty range
When birth time is unknown or approximate, show which nakshatras are possible and whether
the guna score holds across that window, instead of refusing the user or silently
defaulting to noon (which is what `moon-calculator.ts` does today).

**Why deferred:** real problem, real value, but it adds complexity to both the calculator
and the report layout before the core bet has been tested.

**Cost:** ~1h CC+gstack.

### Print / A4 view
A clean printout in the visual register of a pandit's printout. Families print these and
no competitor builds for paper.

**Cost:** ~30min CC+gstack.

### Re-openable share link
Alongside the forwarded PNG, a link that can be reopened — which also yields open-count
data a static image never can. Requires a retention decision: how long does a shared
chart stay reachable, and who can revoke it.

**Cost:** ~45min CC+gstack.

---

## Deferred — from the design doc

### Manglik
`packages/compatibility/src/astrology/manglik.ts` contains no Mars calculation.
`profile.isManglik` is an optional field never written by any code, so `checkManglik`
always returns `'unknown'` and `astrology-scorer.ts` falls back to the constant 75. The
0.10 manglik sub-weight is therefore a constant, not a computation.

Computing it properly needs Mars longitude plus lagna (sidereal time, lat/lon, and a
house system). Days of work, not hours.

**Decision for v1:** cut it from the report and say so on the page. A report that always
prints "Manglik: unknown" is worse than one that does not claim to check it.

### Numerology
`numerologyMode: 'metadata_only'`, `numerologyWeight: 0.00`. Computed, displayed,
contributes nothing to the match. Either weight it or stop describing the product as
matching on numerology. Currently neither.

---

## Known defects

### FIXED 2026-09-13

- **THE BIG ONE — wrong celestial body.** `moon-calculator.ts` called
  `Astronomy.EclipticLongitude(Body.Moon, date)`, which returns **heliocentric**
  longitude. For the Moon that drifts at ~1.03 deg/day (Earth's orbital rate) instead
  of ~13.2. Measured 1998-03-13: `EclipticLongitude` = 173.18 deg,
  `EclipticGeoMoon().lon` = 181.42 deg — **8.2 degrees apart, more than half a
  nakshatra**, and the gap is arbitrary rather than a constant offset. Every nakshatra,
  rashi and guna score the engine ever produced was computed from the wrong body.
  No review caught this; the `scripts/chart.ts` harness exposed it in one run.
  Fixed to `Astronomy.EclipticGeoMoon(date).lon`. Pinned by a daily-motion regression
  test that fails if the rate leaves 11-16 deg/day.
- **Compound timezone bug.** Local wall-clock fed to `Date.UTC` (IST treated as UTC,
  ~3 deg), and local-zone date getters mixed with `Date.UTC` (a full day, 13.2 deg, on
  a non-UTC machine). Fixed with luxon plus a new `birthTimeZone` field on
  `UserBirthData`; calendar date now read with UTC getters by contract.
- **`calculateBhakoot` 1/7.** `pairs=[7,7]` IS the 1/7 relationship; the branch tested
  `[1,7]`, which the arithmetic can never produce. Fixed. All twelve sign distances
  covered by a regression test.
- **No tests, no test task.** 19 tests now exist. Root `npm test` runs `turbo run test`.

### Still open

1. **`moon-calculator.ts` compound timezone bug.** Local birth time treated as UTC
   (~3.0° Moon drift, IST being +5:30), *and* `getFullYear()/getMonth()/getDate()` read
   in the server's local zone while the rest of the expression is `Date.UTC` — which
   shifts the date a full day (13.2°, an entire nakshatra) on a non-UTC machine.
   `birthPlaceLat`/`birthPlaceLon` exist on `UserBirthData` (`types.ts:70-71`) and are
   read nowhere.

2. **`ashtakoota.ts` `calculateBhakoot` unreachable branch.** `distance =
   ((B-A+12)%12)+1; reciprocal = 14-distance`. Opposite signs give `distance=7 →
   reciprocal=7 → pairs=[7,7]`, matching no auspicious pattern, so the pair scores 0 of
   7. The intended `1/7` branch can never fire because `distance=1` always yields
   `reciprocal=13`.

3. ~~**`calculateVarna` returns 0.5.**~~ **FIXED 2026-09-13** — gendered convention
   adopted; Varna is now 1 or 0. See below.

3-old. **`calculateVarna` returns 0.5.** Two `>=` checks award 1.0 on equal ranks and 0.5
   otherwise, so it never returns 0. Varna is intrinsically gendered (1 if groom's varna
   >= bride's, else 0) and this engine is deliberately gender-neutral, so **no coherent
   symmetric rule exists**. Blocked on the astrologer, not on code.

3b. **`calculateVashya` averages an asymmetric matrix.** The Vanachara row is all zeros
   while every other row gives Vanachara 1 or 1.5, so Chatushpada x Vanachara =
   (1.5 + 0) / 2 = 0.75. Which direction is correct is an astrology question. Blocked.

3c. **`calculateTara` also returns fractions** (observed 1.5). Not previously flagged by
   any review. Same batch.

### CORRECTION 2026-09-13 — half points are traditional

An earlier entry here claimed all fractional koota scores were bugs. **That was wrong**,
and it came from over-generalising the outside voice's "no reference tool prints 27.75".

- **Tara 1.5 is correct** — the tradition awards 1.5 when only one direction is
  auspicious.
- **Graha Maitri 0.5 is correct** — it is a value in the standard planetary table, and
  that matrix is symmetric, so its averaging was a no-op.
- **Varna 0.5 WAS a bug** — Varna is 1 or 0 in every convention.
- **Vashya 0.75 WAS a bug** — from averaging an asymmetric directional matrix.

Reference tools routinely print totals like 24.5/36. An integer guard therefore blocked
**77.8% of real pairs** — a measurement that only existed because the guard was wrong.

**Resolved:** the engine now uses the traditional groom-to-bride convention for Varna and
Vashya (`calculateGunaMilan(groom, bride)` — order matters), the form asks which role the
user holds, and the guard rejects only non-multiples of 0.5. Blocked rate: **0%**.
Totals now range 3-34 with half-point granularity, matching what a real kundali report
prints.

4. **Workspace wiring still undone.** `dist/` unbuilt, no `exports` map, `turbo.json`
   build outputs are `.next/**` only, `apps/web` does not reference
   `@prema/compatibility`. `packages/typescript-config/base.json:13` sets
   `noUncheckedIndexedAccess: true`, which the compatibility package does not honour —
   wiring it source-only will fail `npm run check-types`. Task E7/T6.

5. **Node version mismatch.** `package.json` requires `>=24`; the machine runs v20.20.0.
   npm did not enforce it. The engine is fine on 20; Next 16 may not be.

---

## Housekeeping

- **Delete `fix-second-spin.js` and `apps/mobile/fix-figure.js`.** One-off regex codemods
  that patch source files, committed to the repo. `fix-second-spin.js` landed in
  `06e67a0`. Their edits are already in the source; re-running them is a no-op at best.
- **`README.md` is unmodified Turborepo boilerplate.** It documents a `docs` app that
  does not exist and never mentions mobile, admin, supabase, or PREMA.
- **`discoveryThreshold: 70`** is declared in `matching-config.ts:42` and `types.ts:240`
  and referenced nowhere in the engine. Either wire it or delete it.

---

## Deferred — design (from /plan-design-review 2026-09-12)

### Step 2 emotional gap
Entering a prospective partner's birth time into a stranger's website is socially
loaded and nothing in the design acknowledges it. Pass 3 rated the user journey 3/10
and this is the reason. Candidate fixes: a one-line reassurance at step 2, or asking
for their details second precisely so the user is already invested.

**Trigger:** if step-2 abandonment is high in the instrumentation, this is why.

### Print stylesheet
The deferred A4 view needs its own stylesheet. `DESIGN.md` has no print tokens.

### Tamil dosha explainers
v1 ships English plus Devanagari koota names on the web page only. Tamil needs a
second embedded font and is deferred with the print view.

### Touch target padding
"I don't know my birth time" and "Change" are text links below the 44px minimum
`DESIGN.md` mandates. Needs padding, not a redesign.

---

## Increment 2 — shipped 2026-09-13

- **Trust bundle (T14).** Eight koota explanations written from scratch, each with
  full / partial / zero copy, rendered as openable `<details>` rows. Plus the two
  dosha verdicts explained at length below the actions.
- **Anonymous pool opt-in (T17).** Records `{timestamp, opted_in, city}` and nothing
  else. No name, no DOB, no birth time, therefore no deletion path and no DPDP surface.
- **Event sink.** `/api/events` writes server-side with a secret key, falling back to a
  structured log when Supabase credentials are absent. Verified end to end.

### Still open in Increment 2

- **Hindi and Marathi copy.** The structure exists (`LANGUAGES` in
  `apps/web/content/kootas.ts`) and English is complete. Translations are deliberately
  NOT machine-generated — religious terminology that is subtly wrong reads as careless
  in exactly the register where carelessness is most expensive. Needs a human
  translator. Tamil is deferred separately; it needs a second embedded font.
- **OG image font.** Renders in Satori's default sans, not the document serif, and
  carries no Devanagari. Satori does not ship a Devanagari face and falls back over the
  network for unknown glyphs — a fallback that fails silently in sandboxed builds.
  Needs Noto Sans Devanagari vendored as TTF/OTF (not WOFF2, which Satori cannot read)
  and embedded via the `fonts` option, with OFL attribution.
- **Golden fixture.** The 22 tests assert behaviour. Nothing yet checks against
  AstroSage. Now much more likely to agree: the heliocentric bug is fixed and the
  gendered convention matches the reference.

## Increment 3 — shipped 2026-09-13 (code complete, blocked on real-world steps)

- **Order ledger.** `review_orders` with a UNIQUE constraint on `provider_event_id`, so
  a webhook retry cannot create a duplicate order. Enforced by the database, not by
  handler logic. The handler returns 2xx on the duplicate path — anything else makes the
  provider retry forever against a constraint that will always reject it.
- **Webhook security.** HMAC signature verified in constant time against the RAW body,
  read once before parsing. Unsigned and tampered requests are rejected with 401. A
  malformed payload returns 400, not 500, so it does not trigger a retry storm. A failed
  ledger write DOES return 500, because that order is not recorded anywhere yet.
- **Retention, enforced.** `purge_delivered_order_charts()` clears birth details from
  delivered orders after 90 days. The order row survives for accounting; the personal
  data does not.
- **Pay button behind `PAYMENTS_LIVE`.** Off by default, and it stays off unless the
  flag, a named price AND a checkout URL are all present. Money can be switched off
  without a deploy.
- **SLA in code.** `threeWorkingDays()` skips weekends, is tested, and is written into
  the order as `due_at`. A promise with no ledger behind it is a promise you cannot keep
  on purpose.
- **Legal pages.** Terms, Privacy, Refunds, Contact — the KYC prerequisite the eng
  review flagged as sitting inside the increment that ships first. Written plainly; the
  privacy page describes what the code actually does and is checkable against it.
- **Ethics constraint proven.** `/review-request` renders byte-identically at 3.5/36 and
  30.5/36 — verified by diffing the two responses. The page never reads the total, so it
  is structurally incapable of targeting disappointed users.
- **18 web tests added.** `apps/web` had none.

### Blocked on real-world steps, not on code

1. **Name the price.** `REVIEW_PRICE_MINOR` is deliberately unset and payments cannot go
   live without it. An unnamed price makes the willingness-to-pay result uninterpretable.
   Anchor against what a family pandit charges per consultation.
2. **Payment provider KYC.** Needs a business entity, PAN, bank account, and the legal
   pages live on a registered custom domain — a `*.vercel.app` address will not pass.
   Days to weeks, and none of it is engineering.
3. **Find the astrologer.** Manual fulfilment presumes a pandit. None identified.
4. **Vercel Pro.** Hobby forbids commercial use; the moment the pay button is live the
   project must be on a paid plan.

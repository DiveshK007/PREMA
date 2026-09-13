---
name: PREMA
surface: web — the kundali report
extracted_from: designs/kundali-report-20260912/approved-direction.html
status: v1, single surface
---

# PREMA Design System

Extracted from the approved kundali report direction, 2026-09-12, via
`/plan-design-review`. One surface so far. Treat every token below as a decision
that has been made, not a suggestion.

## The one-line brief

**A printed document from a traditional Indian astrologer, translated to a phone.**
Paper, not app. It should look like something a pandit hands across a desk.

If a design decision does not serve that sentence, it is wrong.

## Mode classifier

This product is a **HYBRID**. Classify per surface, never per page.

| Surface | Mode | Consequence |
|---|---|---|
| The report | **READ** | Structure for comprehension. One reading column. Wayfinding matters. No hero, no CTA theater |
| The form | **OPERATE** | Utility language. Scannability beats expression. Minimal chrome |
| Share + upgrade | light **PERSUADE** | One action each. No urgency, no scarcity, no recovery nudges |

**`apps/mobile/app/CompatibilityBreakdown.tsx` is built as PERSUADE** — a 94% hero,
"PREMA MATCH", a mood statement about "48 deep psycho-social traits". That is the
right design for a dating app and the wrong one for a document. **Do not use it as a
reference.** Read it as a warning.

## Color

```
--paper      #FBFAF7   the ground. near-white, barely warm
--ink        #141619   body and display. 15.8:1 on paper
--ink-2      #5d5449   secondary prose
--ink-3      #6b6257   labels, eyebrows, footer
--rule       #141619   structural rules (table head, total)
--hair       #e5e1d8   row separators
--line       #c8c2b6   input underlines, secondary button borders

--warn       #9a6a1f   caveat band rule
--warn-bg    #faf3e6   caveat band ground
--warn-ink   #3f3626   caveat band text
--err        #8a2016   validation and failure
--err-bg     #fbecea
--ok         #2f5d3a   sent, ordered, preserved
--ok-bg      #eef3ee
```

**Secondary text on a colored surface is tinted from that hue, never gray** —
`--warn-ink` is a desaturated warn, not `#666`.

**No accent color.** The document has no brand accent by design. Ink and paper carry
it. Color appears only to mark a state.

**Do not inherit `apps/mobile/src/theme/theme.ts`.** Its `#F8F7F2` cream, `#FF6B8B`
pink, `#A9D8F5` sky blue and `pill: 9999` radii belong to a consumer app. Only
`#172B3A` navy is close to usable, and `--ink` supersedes it.

## Type

```
display + body   Gentium Book Plus      serif, 400/700
devanagari       Noto Serif Devanagari  400/600
labels + data    IBM Plex Mono          400/500
```

Three faces, three jobs. No default stacks — `system-ui` and `-apple-system` are
forbidden as the display or body voice.

```
verdict sentence   19px / 1.58    the headline. carries the whole result
score inline       21px           bold, inside the sentence
table rows         17px
table total        20px / 700
body prose         18.5px
hints, footnotes   13px
eyebrow, labels    10–10.5px      mono, .16–.2em tracking, uppercase
footer wordmark    10.5px         mono, .28em tracking, uppercase
```

**Body text never below 18px.** The reader is in their fifties. This overrides the
usual 16px floor.

`font-variant-numeric: tabular-nums` on every score, date and coordinate.

More space above a heading than below it.

## Layout

Single column, 390px reference width, 26–30px side padding.

**No cards. No radii. No shadows.** Structure comes from rules:

```
1px solid var(--rule)    under a table head, above a total
1px solid var(--hair)    between rows
1px solid var(--line)    under an input
2px solid <state>        left edge of a state band
```

The caveat band's left rule is AI-slop blacklist item 8 (`border-accent-on-rounded`).
It is kept deliberately (settled 2026-09-12): a rule in the margin is printed-document
vocabulary, it is not on a rounded card, and a caveat saying the score may be wrong
should be hard to miss rather than elegant. **Do not "fix" it.**

## Information hierarchy (the report)

```
1. THE SENTENCE     verdict in plain language. works at thumbnail size
2. THE DOSHA LINE   the two things families actually veto on
3. THE LEDGER       eight rows, hairlines, no boxes
4. THE TOTAL        closes the arithmetic she does in her head
5. THE CAVEAT       only when the data is uncertain
6. TWO ACTIONS      send · have it reviewed
7. THE FOOTER       wordmark + short URL. the return path
```

If only three survive: the sentence, the total, the dosha line. All three sit in the
first viewport.

## Motion

**One authored moment.** The verdict sentence only: opacity `0.6 → 1`, y `+6px → 0`,
420ms, `cubic-bezier(.16, 1, .3, 1)`, on first paint of the result.

It eases from an **already-visible default** — never `display:none`, never opacity 0.
The text is readable before, during and after.

Nothing else animates. No hover effects that carry no information. No effect appears
in the PNG, which is the artifact that matters most. `prefers-reduced-motion` skips
it entirely.

## Accessibility (mandatory, per `.agents/skills/prema-human-factors/SKILL.md`)

- **Body text ≥ 18px.** Not 16. The audience is presbyopic.
- **Contrast ≥ 4.5:1 on all body text.** `--ink` on `--paper` is 15.8:1. Every state
  band pairing is checked at its own ink/ground combination.
- **Touch targets ≥ 44px.** Both buttons are 44–48px tall. The "I don't know my birth
  time" and "Change" links need padding to reach 44px — they do not have it yet.
- **Keyboard order** follows visual order: name → date → time → city → submit. The
  "I don't know" control is reachable and is not a `div`.
- **Devanagari koota names** get `lang="sa"` so a screen reader does not attempt them
  in the page language.
- **The score must not be announced as "thirty-two slash thirty-six".** Use
  `aria-label="32 out of 36 gunas"` on the total, and write the verdict sentence's
  score in words for assistive tech.
- **State bands** are `role="status"` (sent, ordered, preserved) or `role="alert"`
  (validation, failure). The caveat band is `role="note"`.
- **Never placeholder-as-label.** Every field label is visible while the field has
  content — the current design already does this.
- **Visited links** keep a distinct color.

## Copy rules

Utility language on the form. Plain declarative prose on the report. No mood
statements, no product marketing, no design commentary.

**Divergence disclosure.** Earlier drafts promised a permanent note explaining that
PREMA scores without groom/bride roles. That is no longer true: as of 2026-09-13 the
engine uses the traditional gendered convention for Varna and Vashya, so totals should
now AGREE with reference tools rather than systematically differ. The note stays, but it
explains the ayanamsa and the half-point convention, not a divergence.

**Forbidden on the upgrade surface**, per the human-factors rule: any wording implying
payment can change or rescue a verdict, any countdown, any scarcity, any "improve your
score", any recovery nudge after an abandoned checkout. The upgrade renders
**identically at 32/36 and at 11/36** — same position, same words, same weight.

Errors state what happened and never blame the user for a server failure.

## Browser surfaces (the cheapest tell that a page was designed)

Theme from the palette, do not ship defaults: selection color, caret, scrollbars,
focus rings, underline offset, tabular numerals. Focus rings must be visible and must
come from `--ink`, not the browser's blue.

## Not yet decided

- Which script the dosha explainers render in (v1: web page only, English +
  Devanagari koota names; Tamil deferred)
- Print stylesheet for the deferred A4 view

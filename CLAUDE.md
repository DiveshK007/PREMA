# PREMA

Turborepo monorepo (npm workspaces). Node >= 24, npm 11.6.2.

## Commands

Run from the repo root unless noted.

```bash
npm run dev           # turbo run dev — all apps
npm run build         # turbo run build
npm run lint          # turbo run lint (eslint --max-warnings 0)
npm run check-types   # turbo run check-types
npm run format        # prettier --write "**/*.{ts,tsx,md}"
```

Scope to one workspace with a filter:

```bash
npx turbo dev --filter=mobile
npx turbo build --filter=web
```

**Verification gate:** there is no root `test` script. Before claiming work is
done, run `npm run check-types && npm run lint`. That is the project's real
verify command.

**Tests: there are none.** Not one `.test.ts` or `.spec.ts` file exists anywhere
in the monorepo. `packages/compatibility` has a `test` script and a
`vitest.config.ts`, but that config points at `__tests__/**/*.test.ts` and no
such directory exists — running it tests nothing and exits clean.

Never report a change as "verified by tests" in this repo. There is no test to
verify it. Say what you actually ran.

The highest-value first test is a golden fixture for
`packages/compatibility/src/astrology/moon-calculator.ts` — known births with
nakshatra and pada checked against an external reference.

## Layout

| Path | What it is |
|------|-----------|
| `apps/mobile` | Expo / React Native. The primary product surface. `expo start` |
| `apps/web` | Next.js |
| `apps/admin` | Next.js, dev server on port 3001 |
| `packages/ui` | `@repo/ui` — shared React components |
| `packages/compatibility` | `@prema/compatibility` — TypeScript lib, the only tested package |
| `packages/eslint-config`, `packages/typescript-config` | shared configs |
| `supabase/` | Supabase project |

`README.md` is still the unmodified Turborepo starter boilerplate — it describes
a `docs` app that does not exist. Do not trust it; trust this file.

## Human factors — read before touching any UI

This project has a mandatory UX skill at
`.agents/skills/prema-human-factors/SKILL.md`. **Read and apply it whenever you
design or modify a user-facing screen, onboarding flow, or interaction.**

The short version: every screen is evaluated against cognitive load, decision
fatigue, attention hierarchy, working memory, touch ergonomics, error recovery,
and trust. PREMA optimizes for **confident decisions, not compulsive
engagement**. Never use psychological principles to manipulate — the ordering is
Usability > Honesty > Persuasion, and the product must never exploit loneliness,
FOMO, romantic insecurity, artificial scarcity, or emotional vulnerability to
drive engagement or payment.

Target UX: calm, clear, confident, trustworthy, easy to use, emotionally
intelligent.

## gstack

Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.

Available skills: /office-hours, /plan-ceo-review, /plan-eng-review,
/plan-design-review, /design-consultation, /design-shotgun, /design-html,
/review, /ship, /land-and-deploy, /canary, /benchmark, /browse,
/open-gstack-browser, /qa, /qa-only, /design-review, /setup-browser-cookies,
/setup-deploy, /retro, /investigate, /document-release, /document-generate,
/codex, /cso, /autoplan, /pair-agent, /careful, /freeze, /guard, /unfreeze,
/gstack-upgrade, /learn, /spec, /health, /diagram, /make-pdf.

Notes for gstack skills in this repo:

- `/plan-design-review` and `/design-review` must apply the human factors rule
  above, not generic design heuristics.
- `/ship` will find no root test script. Bootstrapping one is a real decision
  with real scope — ask before adding a test framework to the apps.
- `apps/mobile` is Expo. Browser-based `/qa` applies to `web` and `admin`; use
  Expo tooling or `/ios-qa` for the mobile app, not headless Chromium.

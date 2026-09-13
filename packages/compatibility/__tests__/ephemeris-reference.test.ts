import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * The independent cross-check, wired into the always-on gate.
 *
 * scripts/verify-ephemeris.ts implements lunar longitude from scratch (Meeus
 * ch.47) and compares it against astronomy-engine across two centuries. It
 * shares no code path with the engine, so it catches the class of bug unit
 * tests structurally cannot: a correct library called incorrectly.
 *
 * That is not hypothetical. This engine shipped `EclipticLongitude(Body.Moon)`
 * — heliocentric — for its entire history. Every test passed. Every number was
 * wrong by up to 8 degrees.
 */
describe('independent ephemeris agreement', () => {
    it('two implementations agree, and the known-bad call still fails', () => {
        const root = join(__dirname, '..', '..', '..');
        const out = execFileSync(
            'npx',
            ['tsx', join(root, 'scripts', 'verify-ephemeris.ts')],
            { cwd: root, encoding: 'utf8', timeout: 120000 }
        );
        expect(out).toContain('PASS — two independent implementations agree');
        // The sanity probe must still detect the pre-fix call. If this line
        // disappears the check has gone vacuous and proves nothing.
        expect(out).toMatch(/differs from the reference by \d+\.\d+°/);
    }, 120000);
});

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { encodePair, EMPTY_PERSON, type PersonInput } from '../lib/report';
import { lookupCity, displayName } from '../lib/cities';
import { track } from '../lib/events';

/**
 * The form. Staged 4 fields then 4, not 8 at once (design decision G4).
 *
 * Eight inputs before any value is shown is too much to ask a stranger, and
 * step 1 being about *you* means the first ask feels like progress rather than
 * an interrogation about someone else.
 */

type FieldErrors = Partial<Record<keyof PersonInput, string>>;

function validatePerson(p: PersonInput): FieldErrors {
    const e: FieldErrors = {};

    if (!p.name.trim()) e.name = 'A name is needed.';

    if (!p.date) {
        e.date = 'A date of birth is needed.';
    } else {
        const [y, m, d] = p.date.split('-').map(Number);
        const parsed = new Date(`${p.date}T00:00:00.000Z`);
        if (
            Number.isNaN(parsed.getTime()) ||
            parsed.getUTCFullYear() !== y ||
            parsed.getUTCMonth() + 1 !== m ||
            parsed.getUTCDate() !== d
        ) {
            const monthName =
                m && m >= 1 && m <= 12
                    ? new Date(Date.UTC(2000, m - 1, 1)).toLocaleString('en-GB', {
                          month: 'long',
                          timeZone: 'UTC',
                      })
                    : 'That month';
            e.date = `${monthName} does not have ${d} days in ${y}.`;
        } else if (parsed.getTime() > Date.now()) {
            e.date = 'That date is in the future.';
        } else if (y !== undefined && y < 1900) {
            e.date = 'Births before 1900 are not supported.';
        }
    }

    if (p.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(p.time)) {
        e.time = 'Time should look like 21:05.';
    }

    if (!p.city.trim()) {
        e.city = 'A city of birth is needed — we use it for the time zone.';
    } else {
        const hit = lookupCity(p.city);
        if (hit.kind === 'ambiguous') {
            e.city = `There is more than one place called ${p.city.trim()}. Which one?`;
        } else if (hit.kind === 'not-found') {
            e.city = hit.suggestions.length
                ? `We do not have that yet. Did you mean ${hit.suggestions
                      .map(displayName)
                      .join(', ')}?`
                : 'We do not have that city yet.';
        }
    }

    return e;
}

function PersonFields({
    person,
    onChange,
    errors,
    idPrefix,
    nameLabel,
}: {
    person: PersonInput;
    onChange: (p: PersonInput) => void;
    errors: FieldErrors;
    idPrefix: string;
    nameLabel: string;
}) {
    const [timeUnknown, setTimeUnknown] = useState(false);
    const set = (k: keyof PersonInput) => (v: string) => onChange({ ...person, [k]: v });

    const cityHit = person.city.trim() ? lookupCity(person.city) : null;

    return (
        <>
            <div className="field">
                <label htmlFor={`${idPrefix}-name`}>{nameLabel}</label>
                <input
                    id={`${idPrefix}-name`}
                    className="input"
                    value={person.name}
                    autoComplete="off"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? `${idPrefix}-name-err` : undefined}
                    onChange={(e) => set('name')(e.target.value)}
                />
                {errors.name && (
                    <p className="hint bad" id={`${idPrefix}-name-err`} role="alert">
                        {errors.name}
                    </p>
                )}
            </div>

            <div className="row2" style={{ marginTop: 18 }}>
                <div className="field" style={{ marginTop: 0 }}>
                    <label htmlFor={`${idPrefix}-date`}>Date of birth</label>
                    <input
                        id={`${idPrefix}-date`}
                        className="input num"
                        type="date"
                        value={person.date}
                        aria-invalid={Boolean(errors.date)}
                        aria-describedby={errors.date ? `${idPrefix}-date-err` : undefined}
                        onChange={(e) => set('date')(e.target.value)}
                    />
                </div>
                <div className="field" style={{ marginTop: 0 }}>
                    <label htmlFor={`${idPrefix}-time`}>Time of birth</label>
                    <input
                        id={`${idPrefix}-time`}
                        className="input num"
                        type="time"
                        value={person.time}
                        disabled={timeUnknown}
                        aria-invalid={Boolean(errors.time)}
                        onChange={(e) => set('time')(e.target.value)}
                    />
                </div>
            </div>
            {errors.date && (
                <p className="hint bad" id={`${idPrefix}-date-err`} role="alert">
                    {errors.date}
                </p>
            )}
            {errors.time && (
                <p className="hint bad" role="alert">
                    {errors.time}
                </p>
            )}

            <button
                type="button"
                className="textlink"
                aria-pressed={timeUnknown}
                onClick={() => {
                    const next = !timeUnknown;
                    setTimeUnknown(next);
                    if (next) set('time')('');
                }}
            >
                {timeUnknown ? 'I do know the birth time' : "I don't know the birth time"}
            </button>
            {timeUnknown && (
                <p className="hint">
                    We will assume noon and say so plainly on the report. The nakshatra, and
                    several gunas, may change once the exact time is known.
                </p>
            )}

            <div className="field">
                <label htmlFor={`${idPrefix}-city`}>City of birth</label>
                <input
                    id={`${idPrefix}-city`}
                    className="input"
                    value={person.city}
                    list={`${idPrefix}-cities`}
                    autoComplete="off"
                    aria-invalid={Boolean(errors.city)}
                    aria-describedby={`${idPrefix}-city-hint`}
                    onChange={(e) => set('city')(e.target.value)}
                />
                <datalist id={`${idPrefix}-cities`}>
                    {cityHit?.kind === 'ambiguous' &&
                        cityHit.candidates.map((c) => (
                            <option key={displayName(c)} value={displayName(c)} />
                        ))}
                </datalist>
                <p
                    className={`hint${errors.city ? ' bad' : ''}`}
                    id={`${idPrefix}-city-hint`}
                    role={errors.city ? 'alert' : undefined}
                >
                    {errors.city ?? 'We use this for the time zone. Nothing is stored.'}
                </p>
            </div>
        </>
    );
}

export default function FormPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [a, setA] = useState<PersonInput>(EMPTY_PERSON);
    const [b, setB] = useState<PersonInput>(EMPTY_PERSON);
    const [errA, setErrA] = useState<FieldErrors>({});
    const [errB, setErrB] = useState<FieldErrors>({});
    const [busy, setBusy] = useState(false);

    function next() {
        const e = validatePerson(a);
        setErrA(e);
        if (Object.keys(e).length === 0) {
            setStep(2);
            window.scrollTo({ top: 0 });
        }
    }

    function submit() {
        const e = validatePerson(b);
        setErrB(e);
        if (Object.keys(e).length > 0) {
            if (e.city) track({ name: 'geocode_miss', city: b.city.slice(0, 40) });
            return;
        }
        if (!a.time || !b.time) track({ name: 'birthtime_missing' });
        setBusy(true);
        router.push(`/report?${encodePair(a, b)}`);
    }

    return (
        <main className="sheet">
            <div className="eyebrow">Guna Milan · Ashtakoota</div>

            {step === 1 ? (
                <>
                    <p className="verdict">
                        Check two birth charts against each other, the way your family would.
                    </p>

                    <div style={{ marginTop: 28 }}>
                        <span className="flabel" id="step1">
                            About you
                        </span>
                        <p className="progress">Step 1 of 2</p>
                        <PersonFields
                            person={a}
                            onChange={setA}
                            errors={errA}
                            idPrefix="a"
                            nameLabel="Your name"
                        />

                        <fieldset
                            style={{ border: 0, padding: 0, margin: '22px 0 0' }}
                        >
                            <legend
                                style={{
                                    fontSize: 15,
                                    color: 'var(--ink-2)',
                                    padding: 0,
                                    marginBottom: 8,
                                }}
                            >
                                In this match you are the
                            </legend>
                            <div style={{ display: 'flex', gap: 22 }}>
                                {(['groom', 'bride'] as const).map((r) => (
                                    <label
                                        key={r}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 9,
                                            minHeight: 44,
                                            fontSize: 19,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={r}
                                            checked={(a.role ?? 'groom') === r}
                                            onChange={() => setA({ ...a, role: r })}
                                            style={{ width: 20, height: 20, accentColor: 'var(--ink)' }}
                                        />
                                        {r}
                                    </label>
                                ))}
                            </div>
                            <p className="hint">
                                Several gunas are traditionally counted from the groom&rsquo;s chart
                                to the bride&rsquo;s. We ask so our numbers match the ones your
                                astrologer will get.
                            </p>
                        </fieldset>
                    </div>

                    <button className="cta" onClick={next}>
                        Next — their details
                    </button>
                    <p className="note">Two charts, eight gunas, one page. Free.</p>
                </>
            ) : (
                <>
                    <p className="progress" style={{ marginTop: 18 }}>
                        Step 2 of 2 · their details
                    </p>

                    {/* Partial state: step 1 is never re-entered. */}
                    <div className="band ok" role="status">
                        <b>Your details are still here.</b>{' '}
                        {a.name}, {a.date}
                        {a.city ? `, ${a.city}` : ''}.{' '}
                        <button
                            type="button"
                            className="textlink"
                            style={{ minHeight: 0, color: 'inherit' }}
                            onClick={() => setStep(1)}
                        >
                            Change
                        </button>
                    </div>

                    <div style={{ marginTop: 22 }}>
                        <span className="flabel">About them</span>
                        <PersonFields
                            person={b}
                            onChange={setB}
                            errors={errB}
                            idPrefix="b"
                            nameLabel="Their name"
                        />
                    </div>

                    <button className="cta" onClick={submit} disabled={busy}>
                        {busy ? 'Calculating…' : 'Calculate'}
                    </button>
                    <button
                        type="button"
                        className="cta2"
                        onClick={() => {
                            setStep(1);
                            window.scrollTo({ top: 0 });
                        }}
                    >
                        Back
                    </button>
                </>
            )}

            <div className="foot">
                <span className="wordmark">Prema</span>
                <a href="/legal/privacy">Privacy</a>
                <a href="/legal/terms">Terms</a>
                <span>prema.in</span>
            </div>
        </main>
    );
}

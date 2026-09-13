/**
 * Koota explanations — the trust bundle.
 *
 * Written from scratch. `explanation-engine.ts` in the compatibility package
 * does NOT do this: it ranks the seven blended dimensions (scorers this product
 * puts out of scope) and its entire astrology output is four threshold strings
 * on the total. The per-koota strings in `ashtakoota.ts` are debug output
 * ("Vashya compatibility score: 2/2"), not something a parent reads.
 *
 * REGISTER. The reader is often a mother in her fifties who takes this
 * seriously and did not ask for a lecture. So:
 *   - explain what the koota is FOR, not what the algorithm did
 *   - never be mystical, never be dismissive
 *   - name the traditional meaning plainly and stop
 *   - no hedging about whether astrology "works"; that is not ours to litigate
 *
 * TRANSLATIONS. Hindi and Marathi are structured for below but deliberately
 * NOT shipped. Machine-translated religious terminology reads as cheap and
 * would cost exactly the trust this bundle exists to buy. English only until a
 * human translator has reviewed them (TODOS.md).
 */

export interface KootaCopy {
    /** English name, matching what the engine returns. */
    koota: string;
    devanagari: string;
    /** What this koota is for, in one sentence. */
    about: string;
    /** What a full score means. */
    strong: string;
    /** What a zero means. Never alarming, never dismissive. */
    weak: string;
    /**
     * What a partial score means, for the kootas that can award one.
     * A partial is NOT a failure and must not be described as one.
     * Omitted for kootas that only ever score full or zero.
     */
    partial?: string;
}

export const KOOTA_COPY: Record<string, KootaCopy> = {
    Varna: {
        koota: 'Varna',
        devanagari: 'वर्ण',
        about:
            'Varna looks at temperament in work and duty — how each person approaches responsibility.',
        strong: 'Their working natures sit comfortably together.',
        weak:
            'Their working natures differ. Traditionally this is the smallest of the eight and is rarely treated as an obstacle on its own.',
    },
    Vashya: {
        koota: 'Vashya',
        devanagari: 'वश्य',
        about:
            'Vashya is about mutual influence — how naturally each person gives way to the other.',
        strong: 'Neither is likely to dominate the other.',
        partial: 'Broadly workable, with one tending to lead a little more.',
        weak: 'One is traditionally read as holding much more sway than the other.',
    },
    Tara: {
        koota: 'Tara',
        devanagari: 'तारा',
        about:
            'Tara compares birth stars, and is read for health and fortune through the marriage.',
        strong: 'The birth stars are counted as favourable in both directions.',
        partial:
            'Favourable counting one way but not the other. This is common and is not usually treated as an obstacle.',
        weak: 'The count is unfavourable in both directions.',
    },
    Yoni: {
        koota: 'Yoni',
        devanagari: 'योनि',
        about:
            'Yoni concerns physical compatibility, read through the animal symbol of each birth star.',
        strong: 'The symbols are traditionally held to be well matched.',
        partial: 'The symbols are neither especially matched nor opposed.',
        weak: 'The symbols are traditionally held to be opposed.',
    },
    'Graha Maitri': {
        koota: 'Graha Maitri',
        devanagari: 'ग्रह मैत्री',
        about:
            'Graha Maitri asks whether the planets ruling each moon sign are friendly to one another. It is read for mental and emotional understanding.',
        strong: 'The ruling planets are friends.',
        partial: 'The ruling planets are neutral toward one another rather than friendly.',
        weak: 'The ruling planets are not friendly to each other.',
    },
    Gana: {
        koota: 'Gana',
        devanagari: 'गण',
        about:
            'Gana sorts each birth star into one of three temperaments — Deva, Manushya or Rakshasa — and asks whether they sit well together.',
        strong: 'The temperaments are compatible.',
        partial: 'The temperaments differ but are not among the pairings tradition flags.',
        weak:
            'The temperaments are traditionally considered opposed. Manushya with Rakshasa is the pairing usually flagged.',
    },
    Bhakoot: {
        koota: 'Bhakoot',
        devanagari: 'भकूट',
        about:
            'Bhakoot measures the distance between the two moon signs. It carries seven points, the second largest weight, and is read for prosperity and family life.',
        strong: 'The signs fall in an auspicious relationship.',
        weak:
            'The signs fall in a relationship traditionally called Bhakoot dosha. Many astrologers hold it cancelled when the two signs share a ruling planet.',
    },
    Nadi: {
        koota: 'Nadi',
        devanagari: 'नाड़ी',
        about:
            'Nadi concerns constitution and health, and carries the most weight of the eight at eight points.',
        strong: 'The two fall in different nadis, which is what tradition asks for.',
        weak:
            'Both fall in the same nadi, which is called Nadi dosha. It is the one most families ask about, and several traditional cancellations exist — an astrologer will check whether any apply here.',
    },
};

/** The two verdicts families actually act on, explained at length. */
export const DOSHA_COPY = {
    bhakoot: {
        clear: {
            title: 'No Bhakoot dosha',
            body:
                'The two moon signs fall in a relationship tradition treats as favourable. Nothing here needs remedying.',
        },
        present: {
            title: 'Bhakoot dosha',
            body:
                'The two moon signs fall in a relationship traditionally called Bhakoot dosha, read for prosperity and family life. It is commonly held to be cancelled when both signs share the same ruling planet, and some astrologers weigh it lightly when the rest of the chart is strong. An astrologer will tell you whether a cancellation applies here.',
        },
    },
    nadi: {
        clear: {
            title: 'Nadi is clear',
            body:
                'The two fall in different nadis, which is what tradition asks for. This is the heaviest of the eight kootas and it is satisfied.',
        },
        present: {
            title: 'Nadi dosha',
            body:
                'Both charts fall in the same nadi. This is the koota families ask about most, and it carries the largest weight. Several traditional cancellations exist — among them the two sharing a moon sign, or sharing a birth star with different padas. Whether any applies is a judgement for an astrologer, not for a calculator.',
        },
    },
} as const;

/**
 * Language scaffolding.
 *
 * English is complete. Hindi and Marathi are intentionally absent rather than
 * machine-translated: getting religious terminology subtly wrong reads as
 * careless in exactly the register where carelessness is most expensive.
 * Tamil is deferred separately — it needs a second embedded font.
 */
export const LANGUAGES = {
    en: { label: 'English', ready: true },
    hi: { label: 'हिन्दी', ready: false },
    mr: { label: 'मराठी', ready: false },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export function copyFor(koota: string): KootaCopy | undefined {
    return KOOTA_COPY[koota];
}

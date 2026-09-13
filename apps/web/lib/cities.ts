/**
 * City -> coordinates + IANA zone.
 *
 * Bundled deliberately. `tz-lookup` is a multi-hundred-KB geodata blob that
 * returns 'Asia/Kolkata' for effectively the entire wedge, so the zone lives
 * here beside the coordinates instead (eng amendment E14).
 *
 * A miss is a visible failure, never a silent guess — see `lookupCity`.
 */

export interface City {
    /** Canonical display name, e.g. "Nashik, Maharashtra". */
    name: string;
    state: string;
    lat: number;
    lon: number;
    /** IANA zone. Every Indian city is Asia/Kolkata; the field exists so a
     *  non-Indian city can be added without a schema change. */
    tz: string;
}

export const CITIES: City[] = [
    { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lon: 72.8777, tz: 'Asia/Kolkata' },
    { name: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' },
    { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' },
    { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lon: 78.4867, tz: 'Asia/Kolkata' },
    { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714, tz: 'Asia/Kolkata' },
    { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata' },
    { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' },
    { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, tz: 'Asia/Kolkata' },
    { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, tz: 'Asia/Kolkata' },
    { name: 'Surat', state: 'Gujarat', lat: 21.1702, lon: 72.8311, tz: 'Asia/Kolkata' },
    { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, tz: 'Asia/Kolkata' },
    { name: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lon: 80.3319, tz: 'Asia/Kolkata' },
    { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lon: 79.0882, tz: 'Asia/Kolkata' },
    { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577, tz: 'Asia/Kolkata' },
    { name: 'Thane', state: 'Maharashtra', lat: 19.2183, lon: 72.9781, tz: 'Asia/Kolkata' },
    { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126, tz: 'Asia/Kolkata' },
    { name: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lon: 83.2185, tz: 'Asia/Kolkata' },
    { name: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376, tz: 'Asia/Kolkata' },
    { name: 'Vadodara', state: 'Gujarat', lat: 22.3072, lon: 73.1812, tz: 'Asia/Kolkata' },
    { name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lon: 77.4538, tz: 'Asia/Kolkata' },
    { name: 'Ludhiana', state: 'Punjab', lat: 30.901, lon: 75.8573, tz: 'Asia/Kolkata' },
    { name: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lon: 78.0081, tz: 'Asia/Kolkata' },
    { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lon: 73.7898, tz: 'Asia/Kolkata' },
    { name: 'Faridabad', state: 'Haryana', lat: 28.4089, lon: 77.3178, tz: 'Asia/Kolkata' },
    { name: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lon: 77.7064, tz: 'Asia/Kolkata' },
    { name: 'Rajkot', state: 'Gujarat', lat: 22.3039, lon: 70.8022, tz: 'Asia/Kolkata' },
    { name: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lon: 82.9739, tz: 'Asia/Kolkata' },
    { name: 'Srinagar', state: 'Jammu and Kashmir', lat: 34.0837, lon: 74.7973, tz: 'Asia/Kolkata' },
    { name: 'Aurangabad', state: 'Maharashtra', lat: 19.8762, lon: 75.3433, tz: 'Asia/Kolkata' },
    { name: 'Dhanbad', state: 'Jharkhand', lat: 23.7957, lon: 86.4304, tz: 'Asia/Kolkata' },
    { name: 'Amritsar', state: 'Punjab', lat: 31.634, lon: 74.8723, tz: 'Asia/Kolkata' },
    { name: 'Allahabad', state: 'Uttar Pradesh', lat: 25.4358, lon: 81.8463, tz: 'Asia/Kolkata' },
    { name: 'Ranchi', state: 'Jharkhand', lat: 23.3441, lon: 85.3096, tz: 'Asia/Kolkata' },
    { name: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lon: 76.9558, tz: 'Asia/Kolkata' },
    { name: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1815, lon: 79.9864, tz: 'Asia/Kolkata' },
    { name: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lon: 78.1828, tz: 'Asia/Kolkata' },
    { name: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5062, lon: 80.648, tz: 'Asia/Kolkata' },
    { name: 'Jodhpur', state: 'Rajasthan', lat: 26.2389, lon: 73.0243, tz: 'Asia/Kolkata' },
    { name: 'Madurai', state: 'Tamil Nadu', lat: 9.9252, lon: 78.1198, tz: 'Asia/Kolkata' },
    { name: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lon: 81.6296, tz: 'Asia/Kolkata' },
    { name: 'Kota', state: 'Rajasthan', lat: 25.2138, lon: 75.8648, tz: 'Asia/Kolkata' },
    { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lon: 76.7794, tz: 'Asia/Kolkata' },
    { name: 'Guwahati', state: 'Assam', lat: 26.1445, lon: 91.7362, tz: 'Asia/Kolkata' },
    { name: 'Mysuru', state: 'Karnataka', lat: 12.2958, lon: 76.6394, tz: 'Asia/Kolkata' },
    { name: 'Thiruvananthapuram', state: 'Kerala', lat: 8.5241, lon: 76.9366, tz: 'Asia/Kolkata' },
    { name: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673, tz: 'Asia/Kolkata' },
    { name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lon: 85.8245, tz: 'Asia/Kolkata' },
    { name: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lon: 78.0322, tz: 'Asia/Kolkata' },
    { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lon: 77.391, tz: 'Asia/Kolkata' },
    { name: 'Gurugram', state: 'Haryana', lat: 28.4595, lon: 77.0266, tz: 'Asia/Kolkata' },
    { name: 'Tiruchirappalli', state: 'Tamil Nadu', lat: 10.7905, lon: 78.7047, tz: 'Asia/Kolkata' },
    { name: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lon: 78.146, tz: 'Asia/Kolkata' },
    { name: 'Warangal', state: 'Telangana', lat: 17.9689, lon: 79.5941, tz: 'Asia/Kolkata' },
    { name: 'Guntur', state: 'Andhra Pradesh', lat: 16.3067, lon: 80.4365, tz: 'Asia/Kolkata' },
    { name: 'Jalandhar', state: 'Punjab', lat: 31.326, lon: 75.5762, tz: 'Asia/Kolkata' },
    { name: 'Udaipur', state: 'Rajasthan', lat: 24.5854, lon: 73.7125, tz: 'Asia/Kolkata' },
    { name: 'Mangaluru', state: 'Karnataka', lat: 12.9141, lon: 74.856, tz: 'Asia/Kolkata' },
    { name: 'Siliguri', state: 'West Bengal', lat: 26.7271, lon: 88.3953, tz: 'Asia/Kolkata' },
    { name: 'Cuttack', state: 'Odisha', lat: 20.4625, lon: 85.8828, tz: 'Asia/Kolkata' },
    { name: 'Ajmer', state: 'Rajasthan', lat: 26.4499, lon: 74.6399, tz: 'Asia/Kolkata' },
    { name: 'Bareilly', state: 'Uttar Pradesh', lat: 28.367, lon: 79.4304, tz: 'Asia/Kolkata' },
    { name: 'Kolhapur', state: 'Maharashtra', lat: 16.705, lon: 74.2433, tz: 'Asia/Kolkata' },
    { name: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lon: 79.4192, tz: 'Asia/Kolkata' },
    { name: 'Shimla', state: 'Himachal Pradesh', lat: 31.1048, lon: 77.1734, tz: 'Asia/Kolkata' },
    { name: 'Panaji', state: 'Goa', lat: 15.4909, lon: 73.8278, tz: 'Asia/Kolkata' },
];

export type CityLookup =
    | { kind: 'found'; city: City }
    | { kind: 'ambiguous'; candidates: City[] }
    | { kind: 'not-found'; query: string; suggestions: City[] };

function norm(s: string): string {
    return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Resolve a typed city name.
 *
 * Never guesses. A miss returns `not-found` with suggestions so the UI can say
 * so out loud — a silently wrong birth place produces a silently wrong chart,
 * which is the failure this product cannot survive.
 */
export function lookupCity(query: string): CityLookup {
    const q = norm(query);
    if (!q) return { kind: 'not-found', query, suggestions: [] };

    // "Nashik, Maharashtra" — an explicit state disambiguates.
    const [namePart, statePart] = q.split(',').map((p) => p.trim());
    const exact = CITIES.filter((c) => norm(c.name) === namePart);

    if (exact.length === 1) return { kind: 'found', city: exact[0]! };
    if (exact.length > 1) {
        if (statePart) {
            const byState = exact.filter((c) => norm(c.state) === statePart);
            if (byState.length === 1) return { kind: 'found', city: byState[0]! };
        }
        return { kind: 'ambiguous', candidates: exact };
    }

    const prefix = CITIES.filter((c) => norm(c.name).startsWith(namePart ?? ''));
    if (prefix.length === 1) return { kind: 'found', city: prefix[0]! };
    if (prefix.length > 1) return { kind: 'ambiguous', candidates: prefix.slice(0, 6) };

    const contains = CITIES.filter((c) => norm(c.name).includes(namePart ?? ''));
    return { kind: 'not-found', query, suggestions: contains.slice(0, 5) };
}

export function displayName(c: City): string {
    return `${c.name}, ${c.state}`;
}

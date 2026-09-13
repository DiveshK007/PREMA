import type { UserProfile, CompatibilityResult } from '../types';
import type { MatchingConfig } from '../config/matching-config';

/**
 * Recommendation candidate with exposure details
 */
export interface RecommendationCandidate {
  userId: string;
  compatibilityResult: CompatibilityResult;
  exposureCount: number; // how many times this user has been shown recently
  lastShownAt?: Date;
}

/**
 * Result representing daily recommendations
 */
export interface DailyRecommendation {
  userId: string; // the user receiving recommendations
  candidates: RecommendationCandidate[];
  algorithmVersion: string;
  generatedAt: Date;
}

/**
 * Rank candidates by score and exposure penalty.
 *
 * @param candidates Unsorted candidate list
 * @param config The matching configuration
 * @returns Sorted candidates
 */
export function rankCandidates(
  candidates: RecommendationCandidate[],
  config: MatchingConfig
): RecommendationCandidate[] {
  // Sort descending by effective score
  return [...candidates].sort((a, b) => {
    let scoreA = a.compatibilityResult.score;
    let scoreB = b.compatibilityResult.score;

    if (a.exposureCount > 3) {
      scoreA -= (a.exposureCount - 3) * 5;
    }
    
    if (b.exposureCount > 3) {
      scoreB -= (b.exposureCount - 3) * 5;
    }

    return scoreB - scoreA;
  });
}

/**
 * Applies diversity rules to select final recommendation subset.
 *
 * @param candidates Sorted candidate list
 * @param maxRecommendations Maximum recommendations to return
 * @returns Subset of candidates applying rules
 */
export function applyDiversityRules(
  candidates: RecommendationCandidate[],
  maxRecommendations: number
): RecommendationCandidate[] {
  if (candidates.length <= maxRecommendations) {
    return candidates; // not enough to enforce strict diversity rules
  }

  const selected: RecommendationCandidate[] = [];
  const reserve70to80: RecommendationCandidate[] = [];

  for (const candidate of candidates) {
    const score = candidate.compatibilityResult.score;
    if (score >= 70 && score <= 80) {
      reserve70to80.push(candidate);
    }
  }

  let has70to80 = false;
  
  for (const candidate of candidates) {
    if (selected.length >= maxRecommendations) break;
    
    // Check if we need to reserve the last slot for a 70-80 candidate
    const needsDiverseSlot = (!has70to80 && reserve70to80.length > 0 && selected.length === maxRecommendations - 1);
    
    const score = candidate.compatibilityResult.score;
    const is70to80 = (score >= 70 && score <= 80);

    if (needsDiverseSlot && !is70to80) {
      continue; // Skip this high score, waiting for diverse
    }

    selected.push(candidate);
    if (is70to80) {
      has70to80 = true;
    }
  }

  return selected;
}

/**
 * Full daily recommendation generation pipeline.
 *
 * @param userId User receiving the recommendations
 * @param candidates Candidates available
 * @param config Matching configuration
 * @returns Final DailyRecommendation list
 */
export function generateDailyRecommendations(
  userId: string,
  candidates: RecommendationCandidate[],
  config: MatchingConfig
): DailyRecommendation {
  const ranked = rankCandidates(candidates, config);

  // discoveryThreshold was declared in matching-config.ts and types.ts and read
  // nowhere, so "curated discovery" was a claim rather than a behaviour. Wire
  // it here: a candidate below the threshold is not shown at all, which is what
  // curation means.
  const threshold = config.discoveryThreshold ?? 0;
  const aboveThreshold = ranked.filter(
    (c) => c.compatibilityResult.score >= threshold
  );

  const maxRecommendations = config.maxRecommendations || 5;
  const diverse = applyDiversityRules(aboveThreshold, maxRecommendations);

  return {
    userId,
    candidates: diverse,
    algorithmVersion: '1.0',
    generatedAt: new Date(),
  };
}

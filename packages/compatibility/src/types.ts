// =============================================================================
// PREMA Compatibility Engine — Core Types
// =============================================================================
// All shared type definitions for the compatibility system.
// Every module imports from this file for consistency.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums & Unions
// ---------------------------------------------------------------------------

export type ConfidenceLevel = 'low' | 'moderate' | 'strong' | 'insufficient_data';

export type RelationshipIntention =
  | 'casual'
  | 'long_term'
  | 'marriage_oriented'
  | 'open_to_either'
  | 'not_sure';

export type ChildrenPreference =
  | 'wants_children'
  | 'does_not_want_children'
  | 'open_to_children'
  | 'has_children_wants_more'
  | 'has_children_no_more'
  | 'not_sure';

export type MarriageTimeline =
  | 'within_1_year'
  | 'within_2_3_years'
  | 'within_5_years'
  | 'no_timeline'
  | 'not_applicable';

export type NumerologyMode = 'disabled' | 'metadata_only' | 'small_weight';

export type MatchEventType =
  | 'impression'
  | 'like'
  | 'pass'
  | 'mutual_match'
  | 'conversation_started'
  | 'date_scheduled';

// ---------------------------------------------------------------------------
// User Profile Types
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  firstName: string;
  age: number;
  gender: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  relationshipIntention: RelationshipIntention;
  isVerified: boolean;
  isActive: boolean;
  isSafetyRestricted: boolean;
  blockedUserIds: string[];
}

export interface UserBirthData {
  userId: string;
  dateOfBirth: Date;
  exactBirthTime?: string; // HH:mm format, null if unknown
  birthPlaceCity?: string;
  birthPlaceLat?: number;
  birthPlaceLon?: number;
  /**
   * IANA time zone of the birth place, e.g. 'Asia/Kolkata'.
   *
   * Required to place `exactBirthTime` on the sky correctly. Carried in the
   * city dataset alongside lat/lon rather than resolved from coordinates at
   * runtime. Defaults to Asia/Kolkata when absent; the zone actually applied
   * is reported back on MoonPosition.timeZoneUsed.
   */
  birthTimeZone?: string;
}

export interface UserPreferences {
  userId: string;
  targetGender: string[];
  minAge: number;
  maxAge: number;
  maxDistanceKm: number;
  relationshipIntention?: RelationshipIntention;
  childrenPreference?: ChildrenPreference;
  marriageTimeline?: MarriageTimeline;
}

// ---------------------------------------------------------------------------
// Personality & Communication Profiles
// ---------------------------------------------------------------------------

/**
 * Normalized personality traits, each 0.0–1.0.
 */
export interface PersonalityProfile {
  userId: string;
  communicationDirectness: number;
  socialEnergy: number;
  independence: number;
  conflictAvoidance: number;
  emotionalOpenness: number;
  adventurePreference: number;
  routinePreference: number;
  decisionMaking: number; // 0 = intuitive, 1 = analytical
  affectionStyle: number; // 0 = reserved, 1 = expressive
}

/**
 * Communication style preferences, each 0.0–1.0.
 */
export interface CommunicationProfile {
  userId: string;
  directness: number;         // 0 = indirect, 1 = very direct
  frequencyPreference: number; // 0 = minimal, 1 = constant
  conflictStyle: number;       // 0 = avoidant, 1 = confrontational
  responseExpectation: number; // 0 = relaxed, 1 = expects quick replies
  emotionalOpenness: number;   // 0 = guarded, 1 = very open
  reassuranceNeed: number;     // 0 = independent, 1 = needs frequent reassurance
  affectionCommunication: number; // 0 = reserved, 1 = very affectionate
  disagreementHandling: number;   // 0 = compromise-first, 1 = debate-first
}

// ---------------------------------------------------------------------------
// Values & Lifestyle Profiles
// ---------------------------------------------------------------------------

/**
 * Core value dimensions, each 0.0–1.0 representing importance/intensity.
 */
export interface ValuesProfile {
  userId: string;
  familyImportance: number;
  marriageExpectation: number;
  childrenExpectation: ChildrenPreference;
  careerPriority: number;
  financialAttitude: number;  // 0 = frugal/saver, 1 = generous/spender
  lifestylePriority: number;
  religionSpirituality: number;
  socialValues: number;       // 0 = traditional, 1 = progressive
  personalIndependence: number;
}

export interface LifestyleProfile {
  userId: string;
  foodPreference: number;     // 0 = strict diet, 1 = adventurous eater
  travelFrequency: number;    // 0 = homebody, 1 = frequent traveler
  sleepSchedule: number;      // 0 = early bird, 1 = night owl
  exerciseFrequency: number;  // 0 = sedentary, 1 = very active
  socialActivity: number;     // 0 = introverted, 1 = very social
  alcoholPreference: number;  // 0 = never, 1 = regularly
  smokingPreference: number;  // 0 = never, 1 = regularly
  workStyle: number;          // 0 = strict 9-5, 1 = flexible/entrepreneur
  weekendStyle: number;       // 0 = quiet/home, 1 = active/out
  spendingStyle: number;      // 0 = frugal, 1 = generous
}

// ---------------------------------------------------------------------------
// Relationship Goals
// ---------------------------------------------------------------------------

export interface RelationshipGoalsProfile {
  userId: string;
  intention: RelationshipIntention;
  marriageTimeline: MarriageTimeline;
  childrenPreference: ChildrenPreference;
  familyInvolvement: number;  // 0 = independent, 1 = very family-involved
  relocationWillingness: number; // 0 = not willing, 1 = very willing
  longDistanceWillingness: number; // 0 = not willing, 1 = very willing
}

// ---------------------------------------------------------------------------
// Interests
// ---------------------------------------------------------------------------

export interface InterestsProfile {
  userId: string;
  interests: string[]; // normalized interest tags
}

// ---------------------------------------------------------------------------
// Compatibility Results
// ---------------------------------------------------------------------------

export interface CompatibilityBreakdown {
  astrology: number;
  numerology: number;
  personality: number;
  communication: number;
  values: number;
  lifestyle: number;
  relationshipGoals: number;
  interests: number;
}

export interface CompatibilityResult {
  userAId: string;
  userBId: string;

  score: number; // 0–100, integer
  confidence: ConfidenceLevel;

  breakdown: CompatibilityBreakdown;

  strengths: string[];
  frictionPoints: string[];
  reasons: string[];

  // Versioning
  algorithmVersion: string;
  astrologyMethodologyVersion: string;
  numerologyMethodologyVersion: string;
  weightsVersion: string;
  generatedAt: Date;
}

export interface HardFilterResult {
  pass: boolean;
  rejectionReasons: string[];
}

// ---------------------------------------------------------------------------
// Matching Configuration
// ---------------------------------------------------------------------------

export interface MatchingConfig {
  algorithmVersion: string;
  weightsVersion: string;

  // Layer weights (must sum to 1.0)
  astrologyWeight: number;
  personalityWeight: number;
  communicationWeight: number;
  valuesWeight: number;
  relationshipGoalsWeight: number;
  lifestyleWeight: number;
  interestsWeight: number;

  // Numerology
  numerologyMode: NumerologyMode;
  numerologyWeight: number; // only used when mode is 'small_weight'

  // Discovery
  discoveryThreshold: number; // minimum score for curated discovery
  maxRecommendations: number;

  // Astrology sub-weights
  astrologySubWeights: {
    gunaMilan: number;     // default 0.70
    vedicSignals: number;  // default 0.20
    manglik: number;       // default 0.10
  };
}

// ---------------------------------------------------------------------------
// Outcome / Learning Types
// ---------------------------------------------------------------------------

export interface MatchEvent {
  id: string;
  userAId: string;
  userBId: string;
  eventType: MatchEventType;
  compatibilityScoreAtEvent: number;
  algorithmVersion: string;
  createdAt: Date;
}

export interface PostDateFeedback {
  id: string;
  userId: string;      // the user giving feedback
  matchUserId: string;  // the match they went on a date with
  conversation: number; // 1–5
  comfort: number;      // 1–5
  humor: number;        // 1–5
  attraction: number;   // 1–5
  valuesAlignment: number; // 1–5
  communication: number;   // 1–5
  wouldMeetAgain: 'yes' | 'maybe' | 'no';
  compatibilityScoreAtDate: number;
  algorithmVersion: string;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Legacy compatibility — re-export old types for backward compatibility
// ---------------------------------------------------------------------------

/** @deprecated Use UserProfile + PersonalityProfile + ValuesProfile instead */
export interface UserTraits {
  id: string;
  astrologyScore?: number;
  personalityTraits: string[];
  values: string[];
  lifestyle: string[];
  relationshipGoals: string;
}

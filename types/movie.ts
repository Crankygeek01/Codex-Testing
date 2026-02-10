export type Mood =
  | "feel-good"
  | "funny"
  | "cozy"
  | "inspiring"
  | "thrilling"
  | "emotional";

export type PlatformKey = "netflix" | "prime" | "disney" | "hulu" | "max" | "appletv";

export interface Constraints {
  maxRuntime: number;
  mood: Mood;
  platform: PlatformKey;
  genreId?: number;
  minRating?: number;
  yearFrom?: number;
  yearTo?: number;
}

export interface CandidateMovie {
  id: number;
  title: string;
  overview: string;
  releaseDate?: string;
  runtime?: number;
  voteAverage: number;
  popularity: number;
  genreIds: number[];
  posterPath?: string;
  providers: string[];
}

export interface RankedMovie extends CandidateMovie {
  matchScore: number;
  whyThisMatches: string;
}

export interface RecommendationResponse {
  region: string;
  totalCandidates: number;
  recommendations: RankedMovie[];
}

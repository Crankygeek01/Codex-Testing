import { fetchRecommendationsFromTmdb, DEFAULT_REGION } from "@/lib/tmdb";
import { rankMovies } from "@/lib/ranking";
import type { Constraints, Mood, PlatformKey, RecommendationResponse } from "@/types/movie";
import { NextResponse } from "next/server";

const MOODS: Mood[] = ["feel-good", "funny", "cozy", "inspiring", "thrilling", "emotional"];
const PLATFORMS: PlatformKey[] = ["netflix", "prime", "disney", "hulu", "max", "appletv"];

const toNumber = (value: string | null): number | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mood = searchParams.get("mood") as Mood | null;
  const platform = searchParams.get("platform") as PlatformKey | null;
  const maxRuntime = toNumber(searchParams.get("maxRuntime"));

  if (!mood || !MOODS.includes(mood)) {
    return NextResponse.json({ error: "Invalid mood" }, { status: 400 });
  }
  if (!platform || !PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }
  if (!maxRuntime || maxRuntime <= 0) {
    return NextResponse.json({ error: "maxRuntime must be a positive number" }, { status: 400 });
  }

  const constraints: Constraints = {
    mood,
    platform,
    maxRuntime,
    genreId: toNumber(searchParams.get("genreId")),
    minRating: toNumber(searchParams.get("minRating")),
    yearFrom: toNumber(searchParams.get("yearFrom")),
    yearTo: toNumber(searchParams.get("yearTo"))
  };

  const region = searchParams.get("region") ?? DEFAULT_REGION;

  try {
    const candidates = await fetchRecommendationsFromTmdb(constraints, region);
    const ranked = rankMovies(candidates, constraints);
    const payload: RecommendationResponse = {
      region,
      totalCandidates: ranked.length,
      recommendations: ranked.slice(0, 12)
    };
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch recommendations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

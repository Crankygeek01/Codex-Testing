import type { CandidateMovie, Constraints, PlatformKey } from "@/types/movie";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const DEFAULT_REGION = "US";

const PLATFORM_PROVIDER_IDS: Record<PlatformKey, number> = {
  netflix: 8,
  prime: 9,
  disney: 337,
  hulu: 15,
  max: 1899,
  appletv: 350
};

export const PLATFORM_LABELS: Record<PlatformKey, string> = {
  netflix: "Netflix",
  prime: "Prime Video",
  disney: "Disney+",
  hulu: "Hulu",
  max: "Max",
  appletv: "Apple TV+"
};

export const MOOD_GENRE_HINTS: Record<string, number[]> = {
  "feel-good": [35, 10751, 10749],
  funny: [35],
  cozy: [10751, 16, 14],
  inspiring: [18, 36],
  thrilling: [53, 28, 80],
  emotional: [18, 10749]
};

interface TmdbDiscoverMovie {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  vote_average: number;
  popularity: number;
  genre_ids: number[];
  poster_path?: string;
}

interface TmdbDiscoverResponse {
  results: TmdbDiscoverMovie[];
}

interface TmdbMovieDetails {
  id: number;
  runtime: number | null;
}

interface TmdbProviderItem {
  provider_name: string;
}

interface TmdbWatchProviders {
  results?: Record<
    string,
    {
      flatrate?: TmdbProviderItem[];
      rent?: TmdbProviderItem[];
      buy?: TmdbProviderItem[];
    }
  >;
}

const getApiKey = (): string => {
  const key = process.env.TMDB_API_KEY;
  if (!key) {
    throw new Error("TMDB_API_KEY is not configured.");
  }
  return key;
};

const tmdbFetch = async <T>(path: string, query: Record<string, string>): Promise<T> => {
  const key = getApiKey();
  const params = new URLSearchParams({ ...query, api_key: key });
  const response = await fetch(`${TMDB_BASE_URL}${path}?${params.toString()}`, {
    next: { revalidate: 60 }
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed for ${path} with status ${response.status}`);
  }

  return (await response.json()) as T;
};

const getMovieDetails = async (movieId: number): Promise<number | undefined> => {
  try {
    const details = await tmdbFetch<TmdbMovieDetails>(`/movie/${movieId}`, {});
    return details.runtime ?? undefined;
  } catch {
    return undefined;
  }
};

const getMovieProviders = async (movieId: number, region: string): Promise<string[]> => {
  try {
    const providerResponse = await tmdbFetch<TmdbWatchProviders>(`/movie/${movieId}/watch/providers`, {});
    const entry = providerResponse.results?.[region];
    const names = [entry?.flatrate ?? [], entry?.rent ?? [], entry?.buy ?? []]
      .flat()
      .map((provider) => provider.provider_name);
    return Array.from(new Set(names));
  } catch {
    return [];
  }
};

export const fetchRecommendationsFromTmdb = async (
  constraints: Constraints,
  region: string = DEFAULT_REGION
): Promise<CandidateMovie[]> => {
  const providerId = PLATFORM_PROVIDER_IDS[constraints.platform];
  const moodGenres = MOOD_GENRE_HINTS[constraints.mood] ?? [];
  const discoverWithGenres = Array.from(new Set([...(constraints.genreId ? [constraints.genreId] : []), ...moodGenres]));

  const discoverResponse = await tmdbFetch<TmdbDiscoverResponse>("/discover/movie", {
    include_adult: "false",
    include_video: "false",
    language: "en-US",
    sort_by: "popularity.desc",
    watch_region: region,
    with_watch_providers: String(providerId),
    with_watch_monetization_types: "flatrate",
    "vote_count.gte": "80",
    ...(discoverWithGenres.length > 0 ? { with_genres: discoverWithGenres.join("|") } : {}),
    ...(constraints.minRating ? { "vote_average.gte": String(constraints.minRating) } : {}),
    ...(constraints.yearFrom ? { "primary_release_date.gte": `${constraints.yearFrom}-01-01` } : {}),
    ...(constraints.yearTo ? { "primary_release_date.lte": `${constraints.yearTo}-12-31` } : {})
  });

  const seeded = discoverResponse.results.slice(0, 20);
  const details = await Promise.allSettled(
    seeded.map(async (movie) => {
      const [runtime, providers] = await Promise.all([
        getMovieDetails(movie.id),
        getMovieProviders(movie.id, region)
      ]);

      return {
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        releaseDate: movie.release_date,
        runtime,
        voteAverage: movie.vote_average,
        popularity: movie.popularity,
        genreIds: movie.genre_ids,
        posterPath: movie.poster_path,
        providers
      } satisfies CandidateMovie;
    })
  );

  return details
    .filter((item) => item.status === "fulfilled")
    .map((item) => item.value as CandidateMovie);
};

import { MOOD_GENRE_HINTS, PLATFORM_LABELS } from "@/lib/tmdb";
import type { CandidateMovie, Constraints, RankedMovie } from "@/types/movie";

const normalize = (value: number, max: number): number => {
  if (max <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(1, value / max));
};

const calcRecencyScore = (releaseDate?: string): number => {
  if (!releaseDate) {
    return 0;
  }
  const year = Number.parseInt(releaseDate.slice(0, 4), 10);
  if (!Number.isFinite(year)) {
    return 0;
  }
  const currentYear = new Date().getFullYear();
  const distance = Math.max(0, currentYear - year);
  return Math.max(0, 1 - distance / 25);
};

const genreAffinity = (movieGenres: number[], mood: Constraints["mood"]): number => {
  const hints = new Set(MOOD_GENRE_HINTS[mood] ?? []);
  if (hints.size === 0 || movieGenres.length === 0) {
    return 0;
  }
  const overlap = movieGenres.filter((id) => hints.has(id)).length;
  return overlap / hints.size;
};

const buildWhy = (movie: CandidateMovie, constraints: Constraints): string => {
  const parts: string[] = [];
  if (movie.runtime && movie.runtime <= constraints.maxRuntime) {
    parts.push(`runtime fits under ${constraints.maxRuntime} min`);
  }
  if (movie.voteAverage >= (constraints.minRating ?? 0)) {
    parts.push(`strong TMDB rating (${movie.voteAverage.toFixed(1)})`);
  }
  if (movie.providers.includes(PLATFORM_LABELS[constraints.platform])) {
    parts.push(`available on ${PLATFORM_LABELS[constraints.platform]}`);
  }
  const moodMention = constraints.mood.replace("-", " ");
  parts.push(`matches the ${moodMention} vibe`);
  return parts.join("; ");
};

export const rankMovies = (movies: CandidateMovie[], constraints: Constraints): RankedMovie[] => {
  const deduped = Array.from(new Map(movies.map((movie) => [movie.id, movie])).values());

  const filtered = deduped.filter((movie) => {
    const runtimeMatch = !movie.runtime || movie.runtime <= constraints.maxRuntime;
    const genreMatch = !constraints.genreId || movie.genreIds.includes(constraints.genreId);
    const minRatingMatch = !constraints.minRating || movie.voteAverage >= constraints.minRating;
    const year = movie.releaseDate ? Number.parseInt(movie.releaseDate.slice(0, 4), 10) : undefined;
    const yearFromMatch = !constraints.yearFrom || (year !== undefined && year >= constraints.yearFrom);
    const yearToMatch = !constraints.yearTo || (year !== undefined && year <= constraints.yearTo);

    return runtimeMatch && genreMatch && minRatingMatch && yearFromMatch && yearToMatch;
  });

  const maxPopularity = Math.max(...filtered.map((movie) => movie.popularity), 1);

  return filtered
    .map((movie) => {
      const runtimeScore = movie.runtime ? normalize(constraints.maxRuntime - movie.runtime + 15, constraints.maxRuntime) : 0.4;
      const moodScore = genreAffinity(movie.genreIds, constraints.mood);
      const ratingScore = normalize(movie.voteAverage, 10);
      const popularityScore = normalize(movie.popularity, maxPopularity);
      const recencyScore = calcRecencyScore(movie.releaseDate);
      const matchScore = Number(
        (runtimeScore * 0.2 + moodScore * 0.35 + ratingScore * 0.25 + popularityScore * 0.1 + recencyScore * 0.1).toFixed(4)
      );

      return {
        ...movie,
        matchScore,
        whyThisMatches: buildWhy(movie, constraints)
      } satisfies RankedMovie;
    })
    .sort((a, b) => b.matchScore - a.matchScore || b.voteAverage - a.voteAverage || b.popularity - a.popularity);
};

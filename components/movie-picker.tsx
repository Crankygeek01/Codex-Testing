"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Mood, PlatformKey, RankedMovie } from "@/types/movie";
import { PLATFORM_LABELS } from "@/lib/tmdb";

const moods: { value: Mood; label: string }[] = [
  { value: "feel-good", label: "Feel-good" },
  { value: "funny", label: "Funny" },
  { value: "cozy", label: "Cozy" },
  { value: "inspiring", label: "Inspiring" },
  { value: "thrilling", label: "Thrilling" },
  { value: "emotional", label: "Emotional" }
];

const platforms: { value: PlatformKey; label: string }[] = [
  { value: "netflix", label: "Netflix" },
  { value: "prime", label: "Prime Video" },
  { value: "disney", label: "Disney+" },
  { value: "hulu", label: "Hulu" },
  { value: "max", label: "Max" },
  { value: "appletv", label: "Apple TV+" }
];

const genres = [
  { id: "", label: "Any genre" },
  { id: "28", label: "Action" },
  { id: "35", label: "Comedy" },
  { id: "18", label: "Drama" },
  { id: "10749", label: "Romance" },
  { id: "10751", label: "Family" },
  { id: "53", label: "Thriller" }
];

interface ApiResponse {
  recommendations: RankedMovie[];
  totalCandidates: number;
  region: string;
  error?: string;
}

export function MoviePicker() {
  const [maxRuntime, setMaxRuntime] = useState(120);
  const [mood, setMood] = useState<Mood>("feel-good");
  const [platform, setPlatform] = useState<PlatformKey>("netflix");
  const [genreId, setGenreId] = useState("");
  const [minRating, setMinRating] = useState(6.5);
  const [yearFrom, setYearFrom] = useState(2010);
  const [yearTo, setYearTo] = useState(new Date().getFullYear());

  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [error, setError] = useState<string>("");
  const [pool, setPool] = useState<RankedMovie[]>([]);
  const [visibleIds, setVisibleIds] = useState<number[]>([]);

  const visibleMovies = useMemo(() => {
    const idSet = new Set(visibleIds);
    return pool.filter((movie) => idSet.has(movie.id));
  }, [pool, visibleIds]);

  const swapMovie = (movieId: number) => {
    const next = pool.find((movie) => !visibleIds.includes(movie.id));
    if (!next) {
      return;
    }
    setVisibleIds((current) => current.map((id) => (id === movieId ? next.id : id)));
  };

  const fetchRecommendations = async () => {
    setStatus("loading");
    setError("");

    const query = new URLSearchParams({
      maxRuntime: String(maxRuntime),
      mood,
      platform,
      minRating: String(minRating),
      yearFrom: String(yearFrom),
      yearTo: String(yearTo)
    });

    if (genreId) {
      query.set("genreId", genreId);
    }

    const response = await fetch(`/api/recommendations?${query.toString()}`);
    const data = (await response.json()) as ApiResponse;

    if (!response.ok) {
      setStatus("error");
      setError(data.error ?? "Unexpected error");
      return;
    }

    setPool(data.recommendations);
    setVisibleIds(data.recommendations.slice(0, 5).map((movie) => movie.id));
    setStatus("success");
  };

  return (
    <main className="mx-auto w-full max-w-6xl p-6 md:p-10">
      <h1 className="text-3xl font-bold">Movie Picker with Constraints</h1>
      <p className="mt-2 text-slate-300">Pick by runtime, mood, and platform — then swap picks until something feels right.</p>

      <section className="mt-8 grid gap-4 rounded-xl border border-slate-700 bg-slate-900/70 p-4 md:grid-cols-3">
        <label className="text-sm">
          Max runtime (minutes)
          <input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" min={60} max={240} value={maxRuntime} onChange={(event) => setMaxRuntime(Number(event.target.value))} />
        </label>

        <label className="text-sm">
          Mood
          <select className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" value={mood} onChange={(event) => setMood(event.target.value as Mood)}>
            {moods.map((entry) => (
              <option key={entry.value} value={entry.value}>{entry.label}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Platform
          <select className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" value={platform} onChange={(event) => setPlatform(event.target.value as PlatformKey)}>
            {platforms.map((entry) => (
              <option key={entry.value} value={entry.value}>{entry.label}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Genre (optional)
          <select className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" value={genreId} onChange={(event) => setGenreId(event.target.value)}>
            {genres.map((entry) => (
              <option key={entry.id || "any"} value={entry.id}>{entry.label}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Minimum TMDB rating ({minRating.toFixed(1)})
          <input className="mt-2 w-full" type="range" min={0} max={9} step={0.1} value={minRating} onChange={(event) => setMinRating(Number(event.target.value))} />
        </label>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <label>
            Year from
            <input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" value={yearFrom} onChange={(event) => setYearFrom(Number(event.target.value))} />
          </label>
          <label>
            Year to
            <input className="mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2" type="number" value={yearTo} onChange={(event) => setYearTo(Number(event.target.value))} />
          </label>
        </div>

        <button className="rounded bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 md:col-span-3" onClick={fetchRecommendations} disabled={status === "loading"}>
          {status === "loading" ? "Finding movies..." : "Get recommendations"}
        </button>
      </section>

      {status === "error" && <p className="mt-5 rounded border border-rose-500 bg-rose-950/40 p-3 text-rose-300">{error}</p>}
      {status === "success" && visibleMovies.length === 0 && <p className="mt-5 rounded border border-amber-500 bg-amber-950/40 p-3 text-amber-300">No matches found. Try a wider runtime or lower rating.</p>}

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleMovies.map((movie) => (
          <article key={movie.id} className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
            <div className="relative h-56 w-full bg-slate-800">
              {movie.posterPath ? (
                <Image src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`} alt={movie.title} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">No poster</div>
              )}
            </div>
            <div className="space-y-2 p-4">
              <h2 className="text-lg font-semibold">{movie.title}</h2>
              <p className="text-sm text-slate-300">{movie.releaseDate?.slice(0, 4) ?? "N/A"} • {movie.runtime ?? "?"} min • ⭐ {movie.voteAverage.toFixed(1)}</p>
              <div className="flex flex-wrap gap-2">
                {movie.providers.length === 0 ? (
                  <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">Provider data unavailable</span>
                ) : (
                  movie.providers.map((provider) => (
                    <span key={provider} className={`rounded px-2 py-1 text-xs ${provider === PLATFORM_LABELS[platform] ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-300"}`}>
                      {provider}
                    </span>
                  ))
                )}
              </div>
              <p className="text-sm text-slate-300 line-clamp-3">{movie.overview}</p>
              <p className="text-sm text-indigo-200">Why this matches: {movie.whyThisMatches}</p>
              <p className="text-xs text-slate-400">Match score: {(movie.matchScore * 100).toFixed(1)}%</p>
              <button className="w-full rounded border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800" onClick={() => swapMovie(movie.id)}>
                Swap this pick
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

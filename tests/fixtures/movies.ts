import type { CandidateMovie } from "@/types/movie";

export const fixtureMovies: CandidateMovie[] = [
  {
    id: 1,
    title: "Joy Ride",
    overview: "A warm-hearted comedy road trip.",
    releaseDate: "2022-05-15",
    runtime: 105,
    voteAverage: 7.4,
    popularity: 78,
    genreIds: [35, 10749],
    posterPath: "/one.jpg",
    providers: ["Netflix"]
  },
  {
    id: 2,
    title: "Too Long Epic",
    overview: "An epic adventure.",
    releaseDate: "2020-01-01",
    runtime: 165,
    voteAverage: 8.1,
    popularity: 95,
    genreIds: [28, 12],
    posterPath: "/two.jpg",
    providers: ["Netflix"]
  },
  {
    id: 3,
    title: "Family Spark",
    overview: "Inspirational family drama.",
    releaseDate: "2023-03-09",
    runtime: 110,
    voteAverage: 7.8,
    popularity: 64,
    genreIds: [10751, 18],
    posterPath: "/three.jpg",
    providers: ["Netflix", "Hulu"]
  },
  {
    id: 4,
    title: "Old Classic",
    overview: "Beloved older film.",
    releaseDate: "1996-07-03",
    runtime: 98,
    voteAverage: 7.2,
    popularity: 50,
    genreIds: [35],
    posterPath: "/four.jpg",
    providers: ["Netflix"]
  }
];

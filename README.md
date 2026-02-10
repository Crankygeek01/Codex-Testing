# Movie Picker with Constraints

A production-style Next.js + TypeScript app that recommends movies based on runtime, mood, platform, genre, rating, and year constraints.

## Features

- Constraint form for max runtime, mood, platform, optional genre, minimum rating, and year range.
- TMDB-backed recommendations through a server API route.
- Provider-aware discovery with TMDB watch-provider filters (default region is `US`).
- Local ranking logic combining runtime fit, mood affinity, rating, popularity, and recency.
- "Swap this pick" behavior to replace individual cards with the next unseen ranked movie.
- Graceful loading, empty, and error states.
- Unit + integration-ish tests.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
3. Add your key:
   ```bash
   TMDB_API_KEY=your_key_here
   ```
4. Run locally:
   ```bash
   npm run dev
   ```

## Getting a TMDB API key

1. Create a TMDB account at [themoviedb.org](https://www.themoviedb.org/).
2. Navigate to API settings in your account profile.
3. Generate a v3 API key and place it in `.env.local` as `TMDB_API_KEY`.

## Testing

```bash
npm test
```

## Architecture overview

- `app/page.tsx`: main UI shell.
- `components/movie-picker.tsx`: client-side form, fetch flow, swap behavior, and cards.
- `app/api/recommendations/route.ts`: parses constraints, fetches TMDB candidates, ranks results.
- `lib/tmdb.ts`: TMDB discover/details/provider requests and platform mapping.
- `lib/ranking.ts`: pure ranking logic and `whyThisMatches` explanation generation.
- `types/movie.ts`: shared type definitions.
- `tests/`: unit tests for ranking and a mocked API route test.

## Known limitations

- Watch provider availability varies by region and can lag behind streaming catalog changes.
- The app defaults region to `US` in the API route unless another region is provided.
- Some movies may have missing runtime/provider metadata from TMDB; these are handled best-effort.

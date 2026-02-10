import { rankMovies } from "@/lib/ranking";
import { fixtureMovies } from "@/tests/fixtures/movies";

describe("rankMovies", () => {
  it("filters out movies over max runtime", () => {
    const ranked = rankMovies(fixtureMovies, {
      maxRuntime: 120,
      mood: "feel-good",
      platform: "netflix"
    });

    expect(ranked.find((movie) => movie.id === 2)).toBeUndefined();
  });

  it("favors mood-aligned genres", () => {
    const ranked = rankMovies(fixtureMovies, {
      maxRuntime: 150,
      mood: "feel-good",
      platform: "netflix"
    });

    expect(ranked[0]?.id).toBe(1);
  });

  it("produces deterministic ordering for same input", () => {
    const constraints = {
      maxRuntime: 130,
      mood: "cozy" as const,
      platform: "netflix" as const
    };

    const firstRun = rankMovies(fixtureMovies, constraints).map((movie) => movie.id);
    const secondRun = rankMovies(fixtureMovies, constraints).map((movie) => movie.id);

    expect(firstRun).toEqual(secondRun);
  });
});

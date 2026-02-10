import { GET } from "@/app/api/recommendations/route";
import * as tmdb from "@/lib/tmdb";

vi.mock("@/lib/tmdb", async () => {
  const actual = await vi.importActual<typeof import("@/lib/tmdb")>("@/lib/tmdb");
  return {
    ...actual,
    fetchRecommendationsFromTmdb: vi.fn()
  };
});

describe("GET /api/recommendations", () => {
  it("returns ranked recommendations", async () => {
    const mockedFetch = vi.mocked(tmdb.fetchRecommendationsFromTmdb);
    mockedFetch.mockResolvedValueOnce([
      {
        id: 9,
        title: "Mock Movie",
        overview: "A mocked result",
        releaseDate: "2021-01-01",
        runtime: 100,
        voteAverage: 8,
        popularity: 50,
        genreIds: [35],
        providers: ["Netflix"],
        posterPath: "/x.jpg"
      }
    ]);

    const request = new Request(
      "http://localhost:3000/api/recommendations?maxRuntime=120&mood=feel-good&platform=netflix&minRating=6"
    );
    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.recommendations).toHaveLength(1);
    expect(payload.recommendations[0].title).toBe("Mock Movie");
  });
});

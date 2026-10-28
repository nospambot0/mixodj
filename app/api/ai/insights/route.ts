import { NextResponse } from "next/server";

type Title = {
  id: string;
  title: string;
  year?: string;
  genre?: string;
  description?: string;
  poster?: string;
  url?: string;
  sourceType?: string;
  surl?: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const movie = body?.movie as Title | undefined;
    const catalogue = Array.isArray(body?.catalogue) ? body.catalogue as Title[] : [];

    if (!movie || typeof movie.id !== "string" || typeof movie.title !== "string") {
      return NextResponse.json({ message: "A valid title is required." }, { status: 400 });
    }

    // Deterministic, metadata-grounded fallback. No third-party AI service or key is
    // required; this avoids inventing plot details from a title or playback URL.
    const description = typeof movie.description === "string" ? movie.description.trim() : "";
    const summary = description
      ? description
      : `No synopsis is available for ${movie.title} yet. Add a verified description in Manage to improve its story summary.`;

    const genre = (movie.genre || "").trim().toLowerCase();
    const recommendations = catalogue
      .filter((item) => item && typeof item.id === "string" && item.id !== movie.id && typeof item.title === "string")
      .map((item) => {
        const sameGenre = genre && (item.genre || "").trim().toLowerCase() === genre;
        const sameYear = movie.year && item.year && movie.year === item.year;
        const hasDescription = !!item.description?.trim();
        return { item, score: (sameGenre ? 3 : 0) + (sameYear ? 1 : 0) + (hasDescription ? 0.25 : 0) };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ item }) => ({
        id: item.id,
        title: item.title,
        year: item.year || "",
        genre: item.genre || "",
        description: item.description || "",
        poster: item.poster || "",
        url: item.url || "",
        sourceType: item.sourceType,
        surl: item.surl
      }));

    return NextResponse.json({ summary, recommendations, mode: "metadata" });
  } catch {
    return NextResponse.json({ message: "Could not prepare title insights." }, { status: 400 });
  }
}

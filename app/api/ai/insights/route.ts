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

    const description = typeof movie.description === "string" ? movie.description.trim().slice(0, 1500) : "";
    let summary = description || `No synopsis is available for ${movie.title} yet. Add a verified description in Manage to improve its story summary.`;
    let mode: "ai" | "metadata" = "metadata";

    // Optional server-side AI enhancement. Only catalogue metadata is sent; stream
    // URLs, share links, secrets and playback data are deliberately excluded.
    if (process.env.OPENAI_API_KEY && (description || movie.genre || movie.year)) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            temperature: 0.4,
            max_tokens: 180,
            messages: [
              {
                role: "system",
                content: "Write a concise, spoiler-conscious streaming catalogue summary using only supplied metadata. Never invent plot events, characters, or facts. If the supplied description is empty or insufficient, say that a verified synopsis is not available. Return JSON with one string field named summary."
              },
              {
                role: "user",
                content: JSON.stringify({
                  title: movie.title.slice(0, 160),
                  year: (movie.year || "").slice(0, 8),
                  genre: (movie.genre || "").slice(0, 100),
                  verifiedDescription: description
                })
              }
            ],
            response_format: { type: "json_object" }
          }),
          signal: AbortSignal.timeout(8000)
        });
        if (response.ok) {
          const data = await response.json();
          const raw = data?.choices?.[0]?.message?.content;
          if (typeof raw === "string") {
            const parsed = JSON.parse(raw);
            if (typeof parsed.summary === "string" && parsed.summary.trim()) {
              summary = parsed.summary.trim().slice(0, 700);
              mode = "ai";
            }
          }
        }
      } catch {
        // Fall back to the verified catalogue description if the AI provider is down.
      }
    }

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

    return NextResponse.json({ summary, recommendations, mode });
  } catch {
    return NextResponse.json({ message: "Could not prepare title insights." }, { status: 400 });
  }
}

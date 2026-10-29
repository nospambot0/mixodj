import { NextResponse } from "next/server";
import { isValidAdminSession } from "../admin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractImdbId(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  const match = value.trim().match(/(?:^|[^a-z0-9])(tt\d{5,10})(?:[^0-9]|$)/i);
  return match ? match[1].toLowerCase() : null;
}

export async function POST(request: Request) {
  if (!isValidAdminSession(request)) {
    return NextResponse.json({ message: "Admin sign-in required. Sign in and try again." }, { status: 401 });
  }
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ message: "IMDb lookup is not configured yet. Add OMDB_API_KEY in Vercel Environment Variables, then redeploy." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const imdbId = extractImdbId(body?.url);
  if (!imdbId) {
    return NextResponse.json({ message: "Paste a valid IMDb title URL, such as https://www.imdb.com/title/tt0133093/." }, { status: 400 });
  }

  try {
    const endpoint = new URL("https://www.omdbapi.com/");
    endpoint.searchParams.set("i", imdbId);
    endpoint.searchParams.set("apikey", apiKey);
    const response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("Movie metadata provider is temporarily unavailable.");
    const data = await response.json();
    if (data?.Response === "False") {
      return NextResponse.json({ message: data.Error || "No title was found for that IMDb ID." }, { status: 404 });
    }
    const title = typeof data.Title === "string" ? data.Title.trim().slice(0, 120) : "";
    const yearMatch = typeof data.Year === "string" ? data.Year.match(/\d{4}/) : null;
    const poster = typeof data.Poster === "string" && /^https?:\/\//i.test(data.Poster) && data.Poster !== "N/A" ? data.Poster : "";
    if (!title) return NextResponse.json({ message: "The metadata provider returned no title for this IMDb link." }, { status: 404 });
    return NextResponse.json({ imdbId, title, year: yearMatch?.[0] || "", poster }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError"
      ? "IMDb lookup timed out. Please try again."
      : "Could not fetch IMDb details right now. Check the link and try again.";
    return NextResponse.json({ message }, { status: 502 });
  }
}

import { NextResponse } from "next/server";
import { isValidAdminSession } from "../admin/auth";
import seedMovies from "../../../data/movies.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const REPO = "nospambot0/mixodj";
const BRANCH = "main";
type Movie = { id: string; title: string; url: string; sourceType?: "terabox"; surl?: string; year?: string; genre?: string; description?: string; poster?: string; addedAt?: string };

function githubHeaders() {
  const token = process.env.GAWKROOM_GITHUB_TOKEN;
  if (!token) throw new Error("Missing GAWKROOM_GITHUB_TOKEN in Vercel Environment Variables.");
  return { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" };
}
async function github(path: string, init?: RequestInit) {
  const response = await fetch(`https://api.github.com/repos/${REPO}/${path}`, { ...init, headers: { ...githubHeaders(), ...(init?.headers || {}) }, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || `GitHub API returned ${response.status}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return data;
}
function isHttpUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4096) return false;
  try { const u = new URL(value); return u.protocol === "https:" || u.protocol === "http:"; } catch { return false; }
}
function isImageData(value: string) {
  const match = value.match(/^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return null;
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > 1024 * 1024) return null;
  const ext = match[1] === "jpeg" ? "jpg" : match[1];
  return { ext, base64: match[2] };
}
export async function GET() {
  try {
    const data = await github(`contents/data/movies.json?ref=${BRANCH}`);
    const decoded = Buffer.from(String(data.content || ""), "base64").toString("utf8");
    const movies = JSON.parse(decoded);
    return NextResponse.json({ movies: Array.isArray(movies) ? movies : [] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ movies: seedMovies, readOnly: true }, { headers: { "Cache-Control": "no-store" } });
  }
}
export async function POST(request: Request) {
  if (!isValidAdminSession(request)) return NextResponse.json({ message: "Admin sign-in required. Sign in and try again." }, { status: 401 });
  let body: { movies?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Invalid JSON request." }, { status: 400 }); }
  if (!Array.isArray(body.movies) || body.movies.length > 500) return NextResponse.json({ message: "Catalogue must be a list of no more than 500 titles." }, { status: 400 });
  const movies: Movie[] = [];
  for (const raw of body.movies) {
    if (!raw || typeof raw !== "object") return NextResponse.json({ message: "Invalid movie entry." }, { status: 400 });
    const m = raw as Movie;
    if (typeof m.id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(m.id) || typeof m.title !== "string" || !m.title.trim() || m.title.length > 120 || !isHttpUrl(m.url)) {
      return NextResponse.json({ message: "Each title needs a valid ID, title, and HTTP(S) video URL." }, { status: 400 });
    }
    if (typeof m.poster === "string" && m.poster && !(isHttpUrl(m.poster) || m.poster.startsWith("/uploads/") || m.poster.startsWith("data:image/"))) {
      return NextResponse.json({ message: "Poster artwork must be an uploaded image or a valid HTTP(S) URL." }, { status: 400 });
    }
    movies.push({ ...m, title: m.title.trim(), year: String(m.year || "").slice(0, 4), genre: String(m.genre || "Drama").slice(0, 40), description: String(m.description || "").slice(0, 500) });
  }
  try {
    const ref = await github(`git/ref/heads/${BRANCH}`);
    const parentSha = ref.object.sha as string;
    const parent = await github(`git/commits/${parentSha}`);
    const treeElements: Array<{ path: string; mode: string; type: string; sha: string }> = [];
    for (const movie of movies) {
      if (typeof movie.poster === "string" && movie.poster.startsWith("data:image/")) {
        const image = isImageData(movie.poster);
        if (!image) return NextResponse.json({ message: "Artwork must be a valid PNG, JPG, WEBP or GIF file no larger than 1 MB." }, { status: 400 });
        const path = `public/uploads/${movie.id}.${image.ext}`;
        const blob = await github("git/blobs", { method: "POST", body: JSON.stringify({ content: image.base64, encoding: "base64" }) });
        treeElements.push({ path, mode: "100644", type: "blob", sha: blob.sha });
        movie.poster = `/uploads/${movie.id}.${image.ext}`;
      }
    }
    const jsonBlob = await github("git/blobs", { method: "POST", body: JSON.stringify({ content: JSON.stringify(movies, null, 2) + "\n", encoding: "utf-8" }) });
    treeElements.push({ path: "data/movies.json", mode: "100644", type: "blob", sha: jsonBlob.sha });
    const tree = await github("git/trees", { method: "POST", body: JSON.stringify({ base_tree: parent.tree.sha, tree: treeElements }) });
    const commit = await github("git/commits", { method: "POST", body: JSON.stringify({ message: "Update public GAWKROOM catalogue", tree: tree.sha, parents: [parentSha] }) });
    await github(`git/refs/heads/${BRANCH}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) });
    return NextResponse.json({ ok: true, movies, commit: commit.html_url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub update failed.";
    const status = (error as Error & { status?: number }).status;
    return NextResponse.json({ message: status === 409 || status === 422 ? "GitHub main changed while saving. Refresh the page and try again." : message }, { status: status === 401 || status === 403 ? 503 : 502 });
  }
}

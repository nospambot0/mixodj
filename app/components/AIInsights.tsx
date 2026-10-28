"use client";

import { useEffect, useState } from "react";

type Title = {
  id: string;
  title: string;
  url: string;
  sourceType?: "terabox";
  surl?: string;
  year?: string;
  genre?: string;
  description?: string;
  poster?: string;
  addedAt?: string;
};

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  if (name === "play") return <svg {...common}><path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none"/></svg>;
  return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 3v18M17 3v18M3 8h4m-4 8h4m10-8h4m-4 8h4"/></svg>;
}

function validImage(value?: string) {
  if (!value) return false;
  if (value.startsWith("data:image/") || value.startsWith("/uploads/")) return true;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:"; } catch { return false; }
}

export default function AIInsights({ movie, catalogue, onPlay }: { movie: Title; catalogue: Title[]; onPlay: (movie: Title) => void }) {
  const [summary, setSummary] = useState("");
  const [recommendations, setRecommendations] = useState<Title[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSummary("");
    setRecommendations([]);
    fetch("/api/ai/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        movie: { id: movie.id, title: movie.title, year: movie.year, genre: movie.genre, description: movie.description },
        catalogue: catalogue.map((item) => ({
          id: item.id, title: item.title, year: item.year, genre: item.genre,
          description: item.description, poster: item.poster, url: item.url,
          sourceType: item.sourceType, surl: item.surl
        }))
      })
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error("Insights unavailable");
      if (!cancelled) {
        setSummary(typeof data.summary === "string" ? data.summary : "");
        setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
      }
    }).catch(() => {
      if (!cancelled) {
        setSummary(movie.description?.trim() || "A verified synopsis isn't available yet. Add a description to this title to improve its story summary.");
        const genre = (movie.genre || "").trim().toLowerCase();
        setRecommendations(catalogue.filter((item) => item.id !== movie.id && genre && (item.genre || "").trim().toLowerCase() === genre).slice(0, 4));
      }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [movie, catalogue]);

  return <section className="ai-insights" aria-live="polite">
    <div className="ai-insights-heading"><span className="ai-spark">✦</span><div><span className="section-kicker">REELROOM INTELLIGENCE</span><h3>Made for your next watch</h3></div><span className="ai-label">AI PICKS</span></div>
    <div className="ai-summary"><strong>Story snapshot</strong>{loading ? <p className="ai-muted">Preparing a summary from the title's available information…</p> : <p>{summary || "A summary isn't available yet."}</p>}</div>
    <div className="ai-recommendations-heading"><strong>Because you’re watching {movie.title}</strong><span>{loading ? "FINDING TITLES…" : recommendations.length ? "PICKS FOR YOU" : "MORE PICKS COMING SOON"}</span></div>
    {recommendations.length > 0 ? <div className="ai-recommendations">{recommendations.slice(0, 4).map((item) => <button className="ai-recommendation" key={item.id} onClick={() => onPlay(item)}><span className="ai-rec-art">{validImage(item.poster) ? <img src={item.poster} alt="" loading="lazy"/> : <Icon name="film" size={22}/>}<span className="ai-rec-play"><Icon name="play" size={14}/></span></span><span className="ai-rec-title">{item.title}</span><span className="ai-rec-meta">{item.year || "FEATURE"} · {item.genre || "FILM"}</span></button>)}</div> : !loading ? <p className="ai-muted">Add more titles and genre details to improve recommendations.</p> : null}
    <p className="ai-disclaimer">Summaries use catalogue descriptions; recommendations are ranked from available metadata.</p>
  </section>;
}

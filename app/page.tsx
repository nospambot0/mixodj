"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import seedMovies from "../data/movies.json";

type Movie = { id: string; title: string; url: string; sourceType?: "terabox"; surl?: string; year?: string; genre?: string; description?: string; poster?: string; addedAt?: string };
function getTeraBoxShareId(value: string): string | null {
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    if (!(host.includes("terabox") || host.includes("terashare") || host.includes("terafileshare") || host.includes("freeterabox") || host.includes("1024tera"))) return null;
    const queryId = u.searchParams.get("surl") || u.searchParams.get("shorturl");
    if (queryId) return queryId.trim();
    const match = u.pathname.match(/\/s\/([^/?#]+)/i);
    return match?.[1] || null;
  } catch { return null; }
}
const STORE = "reelroom-movies-v1";
const PROGRESS = "reelroom-progress-v1";
const gradients = ["poster-violet", "poster-blue", "poster-rose", "poster-green", "poster-gold"];
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
  if (name === "play") return <svg {...common}><path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none"/></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
  if (name === "film") return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 3v18M17 3v18M3 8h4m-4 8h4m10-8h4m-4 8h4"/></svg>;
  if (name === "upload") return <svg {...common}><path d="M12 16V4m-5 5 5-5 5 5"/><path d="M4 16v4h16v-4"/></svg>;
  if (name === "close") return <svg {...common}><path d="m6 6 12 12M18 6 6 18"/></svg>;
  if (name === "external") return <svg {...common}><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}
function safeHttpUrl(value: string) { try { const u = new URL(value); return u.protocol === "https:" || u.protocol === "http:"; } catch { return false; } }
export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [selected, setSelected] = useState<Movie | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [year, setYear] = useState("");
  const [category, setCategory] = useState("Drama");
  const [description, setDescription] = useState("");
  const [poster, setPoster] = useState("");
  const [notice, setNotice] = useState("");
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [customIds, setCustomIds] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef(progress);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  const loadLocal = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE) || "[]");
      const localProgress = JSON.parse(localStorage.getItem(PROGRESS) || "{}");
      const local = Array.isArray(stored) ? stored.filter((m: Movie) => m && m.id && safeHttpUrl(m.url)) : [];
      const base = (seedMovies as Movie[]).filter(m => m && m.id && safeHttpUrl(m.url));
      const merged = [...local, ...base.filter(m => !local.some((x: Movie) => x.id === m.id))];
      setMovies(merged); setProgress(localProgress && typeof localProgress === "object" ? localProgress : {});
      setCustomIds(local.map((m: Movie) => m.id));
    } catch { setMovies((seedMovies as Movie[]).filter(m => m && m.id && safeHttpUrl(m.url))); }
  }, []);
  useEffect(() => { loadLocal(); }, [loadLocal]);
  const genres = useMemo(() => ["All", ...Array.from(new Set(movies.map(m => m.genre || "Uncategorized"))).sort()], [movies]);
  const filtered = useMemo(() => movies.filter(m => (genre === "All" || (m.genre || "Uncategorized") === genre) && (m.title + " " + m.year + " " + m.genre + " " + m.description).toLowerCase().includes(query.toLowerCase())), [movies, query, genre]);
  const resume = movies.filter(m => (progress[m.id] || 0) > 0.01 && (progress[m.id] || 0) < 0.98);
  function saveProgress(id: string, value: number) {
    setProgress(prev => { const next = { ...prev, [id]: value }; try { localStorage.setItem(PROGRESS, JSON.stringify(next)); } catch {} return next; });
  }
  function watch(movie: Movie) { setSelected(movie); setNotice(""); }
  useEffect(() => {
    if (!selected || !videoRef.current) return;
    const movie = selected;
    const video = videoRef.current;
    let cancelled = false;
    const onLoaded = () => { const p = progressRef.current[movie.id]; if (p && p > 0.01 && p < 0.98 && video.duration && Number.isFinite(video.duration)) video.currentTime = p * video.duration; };
    const onVideoError = () => {
      if (cancelled) return;
      const code = video.error?.code;
      const detail = code === 2 ? "network error" : code === 3 ? "decode error" : code === 4 ? "unsupported source or playlist" : "unknown media error";
      setNotice(`Video playback failed (${detail}${code ? `, code ${code}` : ""}). The TeraBox share opens, so the remaining issue may be the gateway's HLS playlist or media segments. Try the stream test links below.`);
    };
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("error", onVideoError);
    async function startPlayback() {
      if (movie.sourceType === "terabox" || movie.surl) {
        setNotice("TeraBox playback is not connected yet. The Netflix-style catalogue UI is ready while you choose a streaming provider.");
        return;
      }
      video.src = movie.url;
      video.load();
    }
    void startPlayback();
    return () => { cancelled = true; video.removeEventListener("loadedmetadata", onLoaded); video.removeEventListener("error", onVideoError); video.pause(); video.removeAttribute("src"); video.load(); };
  }, [selected]);
  function addMovie(e: React.FormEvent) {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!title.trim() || !safeHttpUrl(cleanUrl)) { setNotice("Enter a movie title and a valid HTTP(S) video or TeraBox share URL."); return; }
    if (poster.trim() && !safeHttpUrl(poster.trim())) { setNotice("Poster URL must start with http:// or https://."); return; }
    const surl = getTeraBoxShareId(cleanUrl);
    const looksLikeTeraBox = /terabox|terashare|terafileshare|freeterabox|1024tera/i.test(cleanUrl);
    if (looksLikeTeraBox && !surl) { setNotice("Could not find a TeraBox share ID. Use a link such as https://terabox.com/s/SHARE_ID."); return; }
    const movie: Movie = { id: crypto.randomUUID(), title: title.trim().slice(0, 120), url: cleanUrl, ...(surl ? { sourceType: "terabox" as const, surl } : {}), year: year.trim().slice(0, 4), genre: category, description: description.trim().slice(0, 500), poster: poster.trim(), addedAt: new Date().toISOString() };
    const local = [...movies.filter(m => customIds.includes(m.id)), movie];
    try { localStorage.setItem(STORE, JSON.stringify(local)); } catch { setNotice("Browser storage is full. Try a shorter catalogue."); return; }
    setMovies([...local, ...(seedMovies as Movie[]).filter(m => !local.some(x => x.id === m.id))]);
    setCustomIds(local.map(m => m.id)); setTitle(""); setUrl(""); setYear(""); setDescription(""); setPoster(""); setNotice("Movie link added on this device."); setAdminOpen(false);
  }
  function exportMovies() {
    const data = JSON.stringify(movies.filter(m => customIds.includes(m.id)), null, 2);
    const blob = new Blob([data], { type: "application/json" }); const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "reelroom-movies.json"; a.click(); URL.revokeObjectURL(a.href);
  }
  async function importMovies(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data)) throw new Error("The file must contain a JSON array.");
      const incoming = data.filter((m: Movie) => m && typeof m.title === "string" && safeHttpUrl(m.url)).map((m: Movie) => ({ ...m, id: m.id || crypto.randomUUID() }));
      const merged = [...incoming, ...movies.filter(m => customIds.includes(m.id) && !incoming.some((x: Movie) => x.id === m.id))];
      localStorage.setItem(STORE, JSON.stringify(merged)); loadLocal(); setNotice(`Imported ${incoming.length} movie link(s).`);
    } catch (err: any) { setNotice(err?.message || "Could not import that JSON file."); }
    e.target.value = "";
  }
  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" aria-label="Reelroom home"><span className="brand-mark"><Icon name="film" size={22}/></span><span>reelroom<span className="brand-dot">.</span></span></a>
      <nav className="desktop-nav"><a className="nav-active" href="#library">Home</a><a href="#trending">Trending</a><a href="#continue">Continue watching</a><a href="#library">My List</a></nav>
      <div className="top-actions"><label className="searchbox"><Icon name="search" size={18}/><input aria-label="Search movies" placeholder="Search titles…" value={query} onChange={e => setQuery(e.target.value)}/><kbd>⌘ K</kbd></label><button className="avatar-button" aria-label="Add movie link" onClick={() => setAdminOpen(true)}>+</button></div>
    </header>
    <section className="hero netflix-hero">
      <div className="hero-backdrop" aria-hidden="true"><div className="hero-glow"/><div className="hero-vignette"/></div>
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> REELROOM ORIGINAL EXPERIENCE</div><span className="hero-overline">YOUR NEXT OBSESSION STARTS HERE</span><h1>Stories worth<br/><em>staying in for.</em></h1><p>Discover your next favourite. Build your watchlist, pick up where you left off, and make movie night yours.</p><div className="hero-buttons"><a className="primary-cta" href="#library"><Icon name="play" size={17}/> Explore titles</a><button className="secondary-cta" onClick={() => setAdminOpen(true)}><Icon name="plus" size={17}/> Add to My List</button></div><div className="hero-foot"><span><i className="live-dot"/> PERSONAL CINEMA</span><span>{movies.length} {movies.length === 1 ? "TITLE" : "TITLES"} TO EXPLORE</span></div></div>
      <div className="hero-feature-card" aria-hidden="true"><div className="feature-card-art"><span className="feature-orb"/><span className="feature-ridge ridge-one"/><span className="feature-ridge ridge-two"/><span className="feature-card-number">01</span><span className="feature-card-caption">A REELROOM FEATURE</span></div></div>
    </section>
    {notice && <div className="notice" role="status">{notice}</div>}
    {resume.length > 0 && <section className="content-section netflix-row-section" id="continue"><div className="section-heading"><div><h2>Continue watching <span className="heading-chevron">›</span></h2><span className="section-kicker">PICK UP WHERE YOU LEFT OFF</span></div><span className="section-count">{resume.length} IN PROGRESS</span></div><div className="movie-row">{resume.map((m, i) => <MovieCard key={m.id} movie={m} index={i} progress={progress[m.id] || 0} onClick={() => watch(m)}/>)}</div></section>}
    <section className="content-section library-section netflix-row-section" id="library"><div className="section-heading"><div><h2>{query ? "Search results" : "Popular on Reelroom"} <span className="heading-chevron">›</span></h2><span className="section-kicker">{query ? `MATCHES FOR “${query}”` : "HANDPICKED FOR YOUR NEXT MOVIE NIGHT"}</span></div><span className="section-count">{filtered.length} TITLES</span></div>
      <div className="filter-row"><div className="mobile-search"><Icon name="search" size={18}/><input placeholder="Search your library" value={query} onChange={e => setQuery(e.target.value)}/></div><div className="genre-tabs" role="group" aria-label="Filter by genre">{genres.map(g => <button key={g} className={genre === g ? "genre-tab selected" : "genre-tab"} onClick={() => setGenre(g)}>{g}</button>)}</div></div>
      {filtered.length ? <div className="movie-grid">{filtered.map((m, i) => <MovieCard key={m.id} movie={m} index={i} progress={progress[m.id] || 0} onClick={() => watch(m)}/>)}</div> : <div className="empty-state netflix-empty"><div className="empty-icon"><Icon name="film" size={30}/></div><h3>{movies.length ? "No matching titles" : "Your screen is ready for a story"}</h3><p>{movies.length ? "Try another title or choose a different genre." : "Your movie rows will appear here when you add titles or import your catalogue."}</p>{!movies.length && <button className="primary-cta" onClick={() => setAdminOpen(true)}><Icon name="plus" size={17}/> Add your first movie</button>}</div>}
    </section>
    <section className="library-tools"><div><span className="section-kicker">YOUR CATALOGUE</span><h3>Move your movie list between devices</h3><p>Links and saved progress stay in this browser. Export or import your custom movie list as JSON.</p></div><div className="tool-buttons"><button className="secondary-cta" onClick={exportMovies}><Icon name="external" size={15}/> Export links</button><label className="secondary-cta import-button"><Icon name="upload" size={15}/> Import JSON<input type="file" accept="application/json,.json" onChange={importMovies}/></label></div></section>
    <footer className="footer"><a className="brand footer-brand" href="#"><span className="brand-mark"><Icon name="film" size={18}/></span><span>reelroom<span className="brand-dot">.</span></span></a><span>GOOD STORIES DESERVE THE BIG SCREEN.</span><button onClick={() => setAdminOpen(true)}>Add video link</button></footer>
    <div className="mobile-bottom-nav"><a className="bottom-active" href="#"><Icon name="film" size={19}/><span>Discover</span></a><a href="#library"><Icon name="search" size={19}/><span>Library</span></a><button onClick={() => setAdminOpen(true)}><Icon name="plus" size={19}/><span>Add link</span></button></div>
    {selected && <div className="modal-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="player-modal" role="dialog" aria-modal="true" aria-label={selected.title} onClick={e => e.stopPropagation()}><div className="player-top"><div><span className="section-kicker">NOW PLAYING</span><h2>{selected.title}</h2></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Close player"><Icon name="close"/></button></div><video ref={videoRef} className="video-player" controls playsInline preload="metadata" onTimeUpdate={e => { const v = e.currentTarget; if (v.duration && Number.isFinite(v.duration)) saveProgress(selected.id, v.currentTime / v.duration); }} onEnded={() => saveProgress(selected.id, 1)} onError={() => { if (selected.sourceType !== "terabox") setNotice("Playback failed. Use a direct, browser-playable video URL or add a TeraBox share link."); }}/>{notice && <div className="notice player-notice" role="alert">{notice}</div>}<div className="player-details"><span>{selected.year || "YEAR N/A"} · {selected.genre || "FILM"}</span><p>{selected.description || "Enjoy the movie."}</p><a className="external-link" href={selected.url} target="_blank" rel="noreferrer">Open source link <Icon name="external" size={14}/></a></div></section></div>}
    {adminOpen && <div className="modal-backdrop" role="presentation" onClick={() => setAdminOpen(false)}><section className="upload-modal" role="dialog" aria-modal="true" aria-label="Add a movie link" onClick={e => e.stopPropagation()}><div className="player-top"><div><span className="section-kicker">THE LIBRARY KEEPS GROWING</span><h2>Add a movie link</h2></div><button className="icon-button" onClick={() => setAdminOpen(false)} aria-label="Close form"><Icon name="close"/></button></div><p className="modal-intro">Add a title to your personal Reelroom catalogue. Streaming support can be connected later when you choose a provider.</p><form onSubmit={addMovie} className="upload-form"><label>Movie title<input value={title} onChange={e => setTitle(e.target.value)} required maxLength={120} placeholder="Give this story a name"/></label><label>Video URL or TeraBox share link<input type="url" value={url} onChange={e => setUrl(e.target.value)} required placeholder="https://terabox.com/s/… or https://…/movie.mp4" autoCapitalize="none" autoCorrect="off"/></label><div className="form-two"><label>Release year<input value={year} onChange={e => setYear(e.target.value)} inputMode="numeric" maxLength={4} placeholder="2026"/></label><label>Genre<select value={category} onChange={e => setCategory(e.target.value)}>{["Drama","Action","Comedy","Documentary","Animation","Thriller","Sci-Fi","Romance","Family","Other"].map(g => <option key={g}>{g}</option>)}</select></label></div><label>Description<textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={500} rows={3} placeholder="A short synopsis (optional)"/></label><label>Poster image URL <span className="optional">(optional, HTTPS)</span><input type="url" value={poster} onChange={e => setPoster(e.target.value)} placeholder="https://…"/></label><button className="primary-cta upload-submit" type="submit"><Icon name="plus" size={17}/> Add to this device</button></form><p className="privacy-note">Custom titles are saved in this browser only. Streaming is intentionally unconfigured while you choose a provider. To share titles with every visitor, add them to <code>data/movies.json</code> in GitHub and redeploy.</p></section></div>}
  </main>;
}
function MovieCard({ movie, index, progress, onClick }: { movie: Movie; index: number; progress: number; onClick: () => void }) {
  return <button className="movie-card" onClick={onClick}><div className={`poster ${gradients[index % gradients.length]}`}>{movie.poster && safeHttpUrl(movie.poster) ? <img src={movie.poster} alt="" loading="lazy"/> : <div className="poster-art"><span className="poster-orb"/><span className="poster-lines"/><span className="poster-stamp">RR</span></div>}<span className="poster-topline">REELROOM <span>№ {String(index + 1).padStart(2, "0")}</span></span><span className="poster-play"><Icon name="play" size={21}/></span>{progress > 0.01 && progress < 1 && <span className="progress-track"><i style={{ width: `${Math.min(100, progress * 100)}%` }}/></span>}</div><div className="movie-meta"><div className="movie-title">{movie.title}</div><div className="movie-subtitle">{movie.year || "FEATURE"} <span>·</span> {movie.genre || "FILM"}</div></div></button>;
}
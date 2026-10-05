"use client";

import { useEffect, useMemo, useState } from "react";
import DJPlayer from "./dj-player";

type Track = { id: string; title: string; artist?: string; youtubeId: string; addedAt: number };
type DJState = { running: boolean; current: Track | null; queue: Track[]; history: Record<string, number>; updatedAt: number };

const DEMO = [
  { title: "Neon Nights", energy: 42, bpm: 118, key: "8A", genre: "Groove" },
  { title: "City Pulse", energy: 61, bpm: 122, key: "8B", genre: "Dance" },
  { title: "After Hours", energy: 78, bpm: 124, key: "9A", genre: "House" },
  { title: "No Sleep", energy: 91, bpm: 128, key: "9B", genre: "EDM" },
];

function getYouTubeId(value: string) {
  try {
    const u = new URL(value);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0];
    if (u.hostname.endsWith("youtube.com")) return u.searchParams.get("v");
  } catch {}
  return null;
}

async function command(action: string, extra: Record<string, unknown> = {}) {
  const res = await fetch("/api/dj", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
  });
  return res.json();
}

export default function Home() {
  const [dj, setDj] = useState<DJState>({ running: false, current: null, queue: [], history: {}, updatedAt: 0 });
  const [url, setUrl] = useState("");
  const [notice, setNotice] = useState("Ready for Auto DJ.");
  const [state, setState] = useState("starting");

  async function refresh() {
    try {
      const res = await fetch("/api/dj", { cache: "no-store" });
      setDj(await res.json());
    } catch { setNotice("DJ server is temporarily unavailable."); }
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 2000);
    return () => window.clearInterval(timer);
  }, []);

  async function run(action: string, extra: Record<string, unknown> = {}, message?: string) {
    const next = await command(action, extra);
    setDj(next);
    if (message) setNotice(message);
  }

  async function addUrl(playNow = false) {
    const id = getYouTubeId(url.trim());
    if (!id) { setNotice("Enter a valid YouTube URL."); return; }
    await run(playNow ? "playNow" : "add", {
      youtubeId: id,
      title: playNow ? "Now Playing" : "Queued YouTube track",
    }, playNow ? "Playing the selected YouTube track." : "Track added to the DJ queue.");
    setUrl("");
  }

  const current = dj.current;
  const next = dj.queue[0];
  const target = useMemo(() => ({
    starting: [20, 40], building: [40, 65], intense: [70, 90],
    party: [80, 100], chill: [15, 45], peak: [85, 100], closing: [25, 55]
  } as Record<string, number[]>)[state], [state]);

  return <main>
    <header className="topbar">
      <div className="brand"><span className="brandmark">MX</span><div><b>MIXODJ</b><small>AUTONOMOUS DJ</small></div></div>
      <div className={dj.running ? "live liveOn" : "live"}><i/> {dj.running ? "AUTO DJ ACTIVE" : "STOPPED"}</div>
    </header>

    <section className="hero">
      <div>
        <p className="eyebrow">REAL PLAYBACK · SERVER QUEUE · NO DATABASE</p>
        <h1>Let the room<br/><em>move itself.</em></h1>
        <p className="sub">MixoDJ now has a real server-side queue. Connected clients poll the same DJ state, while the player automatically advances through the queue.</p>
        <button className={dj.running ? "primary running" : "primary"} onClick={() => run(dj.running ? "stop" : "start", {}, dj.running ? "Auto DJ stopped." : "Auto DJ started.")}>
          {dj.running ? "■ STOP AUTO DJ" : "▶ START AUTO DJ"}
        </button>
      </div>

      <div className="deck">
        <div className="decktop"><span>NOW PLAYING</span><span>{current ? "LIVE" : "NO TRACK"}</span></div>
        <DJPlayer youtubeId={current?.youtubeId ?? null} running={dj.running && !!current} onEnded={() => run("syncEnded", {}, "Track finished — advancing the queue.")}/>
        <h2>{current?.title ?? "Nothing playing"}</h2>
        <p>{current?.artist ?? "Add a YouTube track to begin"}</p>
        <div className="meters">
          <div><label>QUEUE</label><b>{dj.queue.length}</b></div>
          <div><label>CROWD</label><b>{state.toUpperCase()}</b></div>
          <div><label>NEXT</label><b>{next?.title ?? "AUTO SELECT"}</b></div>
        </div>
      </div>
    </section>

    <section className="states">
      <div className="sectionhead"><div><span className="eyebrow">TARGET STATE</span><h3>Tell the DJ what the room feels like</h3></div><span className="muted">Target energy: {target[0]}–{target[1]}</span></div>
      <div className="stategrid">
        {Object.keys({starting:1,building:1,intense:1,party:1,chill:1,peak:1,closing:1}).map(k =>
          <button key={k} className={state === k ? "state selected" : "state"} onClick={() => { setState(k); setNotice("Target changed to " + k + "."); }}>
            <span>✦</span><strong>{k.replace(/^./, x => x.toUpperCase())}</strong><small>{({starting:"20–40",building:"40–65",intense:"70–90",party:"80–100",chill:"15–45",peak:"85–100",closing:"25–55"} as any)[k]} energy</small><p>Steer upcoming selections toward this crowd energy.</p>
          </button>
        )}
      </div>
    </section>

    <section className="grid">
      <div className="panel">
        <div className="sectionhead"><div><span className="eyebrow">UP NEXT</span><h3>Live queue</h3></div>
          <button className="ghost" onClick={() => run("next", {}, "Skipped to the next queued track.")}>SKIP →</button>
        </div>
        {dj.queue.length ? dj.queue.slice(0, 8).map((t, i) =>
          <div className="track" key={t.id}><span className="num">{String(i + 1).padStart(2, "0")}</span><div><b>{t.title}</b><small>{t.artist ?? "YouTube"}</small></div><span className="tag">QUEUED</span></div>
        ) : <p className="notice">Queue is empty. Add a YouTube URL below.</p>}
        <button className="ghost" onClick={() => run("clear", {}, "Queue cleared.")}>CLEAR QUEUE</button>
      </div>

      <div className="panel">
        <div className="sectionhead"><div><span className="eyebrow">MUSIC INGESTION</span><h3>Add real music</h3></div></div>
        <div className="import"><input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste YouTube URL…"/><button onClick={() => addUrl(false)}>ADD</button></div>
        <div className="import"><button onClick={() => addUrl(true)}>PLAY NOW</button></div>
        <p className="hint">The URL is converted to a YouTube video ID and controlled by the server-side DJ queue. No database is used.</p>
        <div className="pipeline"><span>URL</span><i>→</i><span>QUEUE</span><i>→</i><span>PLAY</span><i>→</i><span>NEXT</span></div>
      </div>
    </section>

    <section className="logic">
      <span className="eyebrow">DJ BRAIN</span><h3>24-hour repeat protection is ready for the server queue.</h3>
      <div className="logicgrid">
        <div><b>01</b><strong>Server queue</strong><p>One consolidated API controls playback state and queue actions.</p></div>
        <div><b>02</b><strong>Automatic advance</strong><p>When YouTube reports END, the server moves to the next track.</p></div>
        <div><b>03</b><strong>24h memory</strong><p>Played video IDs are held in server memory and rejected from repeat selection for 24 hours.</p></div>
        <div><b>04</b><strong>No database</strong><p>Everything runs with lightweight in-memory state for this first working version.</p></div>
      </div>
    </section>

    <footer><span>MIXODJ / AUTONOMOUS MUSIC SYSTEM</span><span>DATABASE-FREE · 24H REPEAT PROTECTION · CONTINUOUS PLAYBACK</span></footer>
    <p className="notice" style={{textAlign:"center"}}>{notice}</p>
  </main>;
}

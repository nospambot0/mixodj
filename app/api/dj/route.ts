import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Track = { id: string; title: string; artist?: string; youtubeId: string; addedAt: number };
type DJState = { running: boolean; current: Track | null; queue: Track[]; history: Record<string, number>; updatedAt: number };

declare global { var __mixoDJState: DJState | undefined; }

const state: DJState = globalThis.__mixoDJState ?? {
  running: false, current: null, queue: [], history: {}, updatedAt: Date.now()
};
globalThis.__mixoDJState = state;

function clean() {
  const cutoff = Date.now() - 86400000;
  for (const [id, time] of Object.entries(state.history)) if (time < cutoff) delete state.history[id];
}
function reply() {
  clean(); state.updatedAt = Date.now();
  return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
}

export async function GET() { return reply(); }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action;
  if (action === "start") state.running = true;
  else if (action === "stop") state.running = false;
  else if (action === "clear") state.queue = [];
  else if (action === "add" || action === "playNow") {
    const youtubeId = String(body.youtubeId || "");
    if (!youtubeId) return NextResponse.json({ error: "youtubeId required" }, { status: 400 });
    const track: Track = {
      id: crypto.randomUUID(), youtubeId,
      title: String(body.title || "YouTube track"),
      artist: body.artist ? String(body.artist) : undefined,
      addedAt: Date.now()
    };
    if (action === "playNow") {
      if (state.current) state.queue.unshift(state.current);
      state.current = track; state.running = true;
    } else if (state.current?.youtubeId !== youtubeId && !state.queue.some(t => t.youtubeId === youtubeId)) {
      state.queue.push(track);
    }
  } else if (action === "next" || action === "syncEnded") {
    if (state.current) state.history[state.current.youtubeId] = Date.now();
    state.current = state.queue.shift() || null;
    if (!state.current) state.running = false;
  } else return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  return reply();
}

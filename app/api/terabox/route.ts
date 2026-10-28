import { NextResponse } from "next/server";

const API_URL = "https://xapiverse.com/api/terabox";
const ALLOWED_HOSTS = ["terabox.com", "terabox.app", "terasharefile.com", "terashare.com", "teraboxapp.com", "1024tera.com", "freeterabox.com", "teraboxlink.com", "teraboxshare.com"];

function isTeraBoxUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith("." + host));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const key = process.env.XAPIVERSE_KEY;
  if (!key) {
    return NextResponse.json({ status: "error", message: "TeraBox extraction is not configured. Add XAPIVERSE_KEY in Vercel Environment Variables." }, { status: 503 });
  }

  let body: { url?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", message: "Send a valid JSON body containing a TeraBox URL." }, { status: 400 });
  }

  if (!isTeraBoxUrl(body.url)) {
    return NextResponse.json({ status: "error", message: "Enter a valid HTTPS TeraBox share link." }, { status: 400 });
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "xAPIverse-Key": key },
      body: JSON.stringify({ url: body.url }),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json({ status: "error", message: data?.message || `TeraBox provider returned HTTP ${response.status}.` }, { status: 502 });
    }
    return NextResponse.json(data ?? { status: "error", message: "The extraction provider returned an unreadable response." }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "error", message: "Could not reach the TeraBox extraction provider. Please try again." }, { status: 502 });
  }
}

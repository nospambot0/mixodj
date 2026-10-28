import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
const COOKIE = "gawkroom_admin";
const MAX_AGE = 60 * 60 * 8;

function signature(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}
export async function POST(request: Request) {
  const expectedPassword = process.env.GAWKROOM_ADMIN_PASSWORD;
  const secret = process.env.GAWKROOM_SESSION_SECRET;
  if (!expectedPassword || !secret) {
    return NextResponse.json({ message: "Admin authentication is not configured. Add GAWKROOM_ADMIN_PASSWORD and GAWKROOM_SESSION_SECRET in Vercel." }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const supplied = typeof body?.password === "string" ? body.password : "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(expectedPassword);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ message: "Incorrect admin password." }, { status: 401 });
  }
  const expires = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  const value = expires + "." + signature(expires, secret);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: MAX_AGE });
  return response;
}
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}

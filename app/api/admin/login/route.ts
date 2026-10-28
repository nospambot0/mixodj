import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const COOKIE = "gawkroom_admin";
const REMEMBER_AGE = 60 * 60 * 24 * 30;
const SESSION_AGE = 60 * 60 * 8;

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
  const rememberMe = body?.rememberMe !== false;
  const maxAge = rememberMe ? REMEMBER_AGE : SESSION_AGE;
  const expires = String(Math.floor(Date.now() / 1000) + maxAge);
  const value = expires + "." + signature(expires, secret);
  const response = NextResponse.json({ ok: true, rememberMe });
  response.cookies.set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return response;
}
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}

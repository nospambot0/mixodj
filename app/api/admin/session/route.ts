import { NextResponse } from "next/server";
import { isValidAdminSession } from "../auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authenticated = isValidAdminSession(request);
  return NextResponse.json({ authenticated }, {
    status: authenticated ? 200 : 401,
    headers: { "Cache-Control": "no-store, private" },
  });
}

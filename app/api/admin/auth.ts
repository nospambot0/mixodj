import { createHmac, timingSafeEqual } from "node:crypto";

export function isValidAdminSession(request: Request) {
  const secret = process.env.GAWKROOM_SESSION_SECRET;
  const cookie = request.headers.get("cookie") || "";
  const raw = cookie.split(";").map((v) => v.trim()).find((v) => v.startsWith("gawkroom_admin="))?.slice("gawkroom_admin=".length);
  if (!secret || !raw) return false;
  let decoded = "";
  try { decoded = decodeURIComponent(raw); } catch { return false; }
  const [expires, supplied] = decoded.split(".");
  if (!expires || !supplied || !/^\d+$/.test(expires) || Number(expires) < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac("sha256", secret).update(expires).digest("hex");
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

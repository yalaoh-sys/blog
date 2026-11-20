import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, HttpError, readJson } from "@/lib/api";
import { createAdminSession, SESSION_COOKIE } from "@/lib/auth/session";

// 로그인 실패 레이트리밋 (서버리스 인스턴스 단위의 best-effort)
const failures = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

function clientKey(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  try {
    return !!origin && new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!sameOrigin(req)) throw new HttpError(403, "잘못된 요청 출처입니다.");
    const key = clientKey(req);
    const now = Date.now();
    const f = failures.get(key);
    if (f && f.resetAt > now && f.count >= LIMIT) {
      throw new HttpError(429, "로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.");
    }

    const { idToken } = z.object({ idToken: z.string().min(10) }).parse(await readJson(req));

    let session;
    try {
      session = await createAdminSession(idToken);
    } catch {
      session = null;
    }
    if (!session) {
      const cur = f && f.resetAt > now ? f : { count: 0, resetAt: now + WINDOW_MS };
      cur.count += 1;
      failures.set(key, cur);
      throw new HttpError(403, "관리자 권한이 없는 계정입니다.");
    }
    failures.delete(key);

    const res = NextResponse.json({ ok: true, uid: session.uid, email: session.email });
    res.cookies.set(SESSION_COOKIE, session.cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(session.expiresIn / 1000),
    });
    return res;
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return errorResponse(new HttpError(403, "잘못된 요청 출처입니다."));
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

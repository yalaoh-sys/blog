import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { ConfigError } from "@/lib/firebase/admin";
import { SESSION_COOKIE, verifyAdminCookie } from "@/lib/auth/session";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** CSRF: 변경 요청은 동일 출처(Origin)만 허용 */
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

type Ctx<P> = { params: Promise<P> };

/** /api/admin/* 공용: Origin 검사 → 세션·화이트리스트 재검증 → 에러 JSON 매핑 */
export function adminRoute<P = Record<string, never>>(
  handler: (req: NextRequest, ctx: { params: P; uid: string }) => Promise<unknown>,
) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      if (req.method !== "GET" && !sameOrigin(req)) {
        throw new HttpError(403, "잘못된 요청 출처입니다.");
      }
      const cookie = req.cookies.get(SESSION_COOKIE)?.value;
      const decoded = await verifyAdminCookie(cookie, true);
      if (!decoded) throw new HttpError(401, "로그인이 필요합니다.");
      const params = await ctx.params;
      const result = await handler(req, { params, uid: decoded.uid });
      return result instanceof Response ? result : NextResponse.json(result ?? { ok: true });
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  if (e instanceof ZodError) {
    return NextResponse.json(
      { error: e.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 },
    );
  }
  if (e instanceof ConfigError) {
    return NextResponse.json({ error: e.message }, { status: 503 });
  }
  console.error(e);
  return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
}

export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, "JSON 본문이 올바르지 않습니다.");
  }
}

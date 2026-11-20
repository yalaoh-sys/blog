import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "__admin_session";

/**
 * 1차 관문: 세션 쿠키가 없으면 관리자 영역 차단.
 * 실제 검증(서명·화이트리스트)은 서버 레이아웃/API 에서 다시 수행한다.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasCookie = Boolean(req.cookies.get(COOKIE)?.value);

  if (pathname.startsWith("/api/admin")) {
    if (pathname === "/api/admin/session" && req.method === "POST") {
      return NextResponse.next();
    }
    if (!hasCookie) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }
  if (!hasCookie) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

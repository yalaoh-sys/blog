import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE = "__admin_session";

export function sessionMaxAgeMs(): number {
  const days = Number(process.env.ADMIN_SESSION_DAYS ?? 5);
  const clamped = Math.min(14, Math.max(1 / 24, Number.isFinite(days) ? days : 5));
  return Math.round(clamped * 24 * 60 * 60 * 1000);
}

/** 이메일 + (설정된 경우) UID 화이트리스트 검사 */
export function isAllowedAdmin(token: DecodedIdToken): boolean {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email || !token.email || token.email.toLowerCase() !== email) return false;
  if (token.email_verified !== true) return false;
  const uid = process.env.ADMIN_UID?.trim();
  if (uid && token.uid !== uid) return false;
  return true;
}

/** ID Token → 세션 쿠키. 허용 계정이 아니면 null. Custom Claim 도 부여한다. */
export async function createAdminSession(idToken: string) {
  const auth = adminAuth();
  const decoded = await auth.verifyIdToken(idToken, true);
  if (!isAllowedAdmin(decoded)) return null;
  if (decoded.admin !== true) {
    await auth.setCustomUserClaims(decoded.uid, { admin: true });
  }
  const expiresIn = sessionMaxAgeMs();
  const cookie = await auth.createSessionCookie(idToken, { expiresIn });
  return { cookie, expiresIn, uid: decoded.uid, email: decoded.email! };
}

export async function verifyAdminCookie(
  cookie: string | undefined,
  checkRevoked: boolean,
): Promise<DecodedIdToken | null> {
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, checkRevoked);
    return isAllowedAdmin(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

/** 서버 컴포넌트/레이아웃용: 관리자가 아니면 로그인으로 보낸다. */
export async function requireAdmin(): Promise<DecodedIdToken> {
  const jar = await cookies();
  const decoded = await verifyAdminCookie(jar.get(SESSION_COOKIE)?.value, false);
  if (!decoded) redirect("/admin/login");
  return decoded;
}

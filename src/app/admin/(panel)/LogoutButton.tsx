"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    try {
      await signOut(clientAuth());
    } catch {
      /* 클라이언트 세션이 없어도 무시 */
    }
    router.replace("/admin/login");
    router.refresh();
  }
  return (
    <button className="btn" onClick={logout}>
      로그아웃
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { clientAuth, isClientConfigured } from "@/lib/firebase/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const configured = isClientConfigured();

  async function login() {
    setBusy(true);
    setError("");
    const auth = clientAuth();
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: await cred.user.getIdToken() }),
      });
      if (!res.ok) {
        // 허용되지 않은 계정: 즉시 로그아웃 + 안내
        await signOut(auth);
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "로그인에 실패했습니다.");
        return;
      }
      // Custom Claim(admin) 반영을 위해 토큰 갱신 (Storage 업로드용)
      await cred.user.getIdToken(true);
      router.replace("/admin");
      router.refresh();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
        Firebase 환경변수가 설정되지 않았습니다. <code>docs/SETUP.md</code> 를 참고해{" "}
        <code>.env.local</code> 을 채운 뒤 개발 서버를 다시 시작하세요.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <button className="btn btn-primary w-full py-2.5" onClick={login} disabled={busy}>
        {busy ? "확인 중…" : "Google 로 로그인"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

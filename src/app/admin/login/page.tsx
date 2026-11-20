import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-neutral-200 p-8 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold">관리자 로그인</h1>
          <p className="mt-1 text-sm text-neutral-500">허용된 Google 계정만 접근할 수 있습니다.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}

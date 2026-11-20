import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listPosts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const posts = await listPosts();
  const count = (s: string) => posts.filter((p) => p.status === s).length;
  const drafts = posts.filter((p) => p.status === "draft").slice(0, 5);

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">대시보드</h1>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["발행", count("published")],
          ["임시저장", count("draft")],
          ["예약", count("scheduled")],
          ["휴지통", count("trashed")],
        ].map(([label, n]) => (
          <div key={label} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-xs text-neutral-500">{label}</p>
            <p className="text-2xl font-bold">{n}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">임시저장 글</h2>
          <Link href="/admin/posts/new" className="btn btn-primary">
            새 글 작성
          </Link>
        </div>
        {drafts.length === 0 ? (
          <p className="text-sm text-neutral-500">임시저장 글이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {drafts.map((p) => (
              <li key={p.id} className="py-2">
                <Link href={`/admin/posts/${p.id}`} className="hover:underline">
                  {p.title || "(제목 없음)"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg bg-neutral-50 p-4 text-sm dark:bg-neutral-900">
        <p className="font-semibold">내 계정 UID</p>
        <code className="break-all">{admin.uid}</code>
        <p className="mt-1 text-xs text-neutral-500">
          이 값을 <code>ADMIN_UID</code> 환경변수에 넣으면 이메일 + UID 이중 검증이 적용됩니다.
        </p>
      </section>
    </div>
  );
}

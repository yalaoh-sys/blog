"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PostStatus } from "@/lib/types";

interface Row {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  categoryId: string;
  viewCount: number;
  updatedAt: number;
}

const STATUS_LABEL: Record<PostStatus, string> = {
  published: "발행",
  draft: "임시저장",
  scheduled: "예약",
  private: "비공개",
  trashed: "휴지통",
};

export function PostList({ posts, categories }: { posts: Row[]; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<"all" | PostStatus>("all");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "views">("recent");
  const [error, setError] = useState("");
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "-";

  const filtered = useMemo(() => {
    const list = posts.filter(
      (p) =>
        (status === "all" ? p.status !== "trashed" : p.status === status) &&
        (!category || p.categoryId === category) &&
        (!q || p.title.toLowerCase().includes(q.toLowerCase())),
    );
    return list.sort((a, b) => (sort === "views" ? b.viewCount - a.viewCount : b.updatedAt - a.updatedAt));
  }, [posts, status, category, q, sort]);

  async function trash(p: Row) {
    if (!confirm(`'${p.title || "(제목 없음)"}' 글을 휴지통으로 이동할까요?`)) return;
    setError("");
    const res = await fetch(`/api/admin/posts/${p.id}`, { method: "DELETE" });
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "삭제에 실패했습니다.");
    router.refresh();
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">글</h1>
        <Link href="/admin/posts/new" className="btn btn-primary">
          새 글 작성
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="제목 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[10rem]" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">전체(휴지통 제외)</option>
          {(Object.keys(STATUS_LABEL) as PostStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select className="input max-w-[10rem]" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">모든 카테고리</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="input max-w-[8rem]" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="recent">최신순</option>
          <option value="views">조회수순</option>
        </select>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutral-500">글이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-neutral-500">
              <tr>
                <th className="py-2">제목</th>
                <th>상태</th>
                <th>카테고리</th>
                <th>조회</th>
                <th>수정일</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 pr-2">
                    {p.status === "trashed" ? (
                      <span className="text-neutral-400">{p.title || "(제목 없음)"}</span>
                    ) : (
                      <Link href={`/admin/posts/${p.id}`} className="hover:underline">
                        {p.title || "(제목 없음)"}
                      </Link>
                    )}
                  </td>
                  <td>{STATUS_LABEL[p.status]}</td>
                  <td>{catName(p.categoryId)}</td>
                  <td>{p.viewCount}</td>
                  <td className="whitespace-nowrap">{new Date(p.updatedAt).toLocaleDateString("ko-KR")}</td>
                  <td className="text-right">
                    {p.status !== "trashed" && (
                      <button className="btn btn-danger" onClick={() => trash(p)}>
                        삭제
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

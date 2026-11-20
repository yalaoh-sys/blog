"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";
import { UNCATEGORIZED_ID, type Category } from "@/lib/types";

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "요청에 실패했습니다.");
  return data;
}

export function CategoryManager({
  initial,
  counts,
}: {
  initial: Category[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);

  const roots = initial.filter((c) => !c.parentId);
  const childrenOf = (id: string) => initial.filter((c) => c.parentId === id);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const create = () =>
    run(async () => {
      await api("/api/admin/categories", "POST", {
        name,
        slug: slugify(name) || `cat-${Date.now()}`,
        parentId: parentId || null,
      });
      setName("");
    });

  const move = (c: Category, dir: -1 | 1) =>
    run(async () => {
      const siblings = initial.filter((x) => x.parentId === c.parentId && x.id !== UNCATEGORIZED_ID);
      const i = siblings.findIndex((x) => x.id === c.id);
      const other = siblings[i + dir];
      if (!other) return;
      await api(`/api/admin/categories/${c.id}`, "PATCH", { order: other.order });
      await api(`/api/admin/categories/${other.id}`, "PATCH", { order: c.order });
    });

  const remove = (c: Category) => {
    const n = counts[c.id] ?? 0;
    const msg = n
      ? `'${c.name}' 카테고리의 글 ${n}개가 "미분류"로 이동됩니다. 삭제할까요?`
      : `'${c.name}' 카테고리를 삭제할까요?`;
    if (!confirm(msg)) return;
    return run(() => api(`/api/admin/categories/${c.id}`, "DELETE"));
  };

  const save = () =>
    editing &&
    run(async () => {
      await api(`/api/admin/categories/${editing.id}`, "PATCH", {
        name: editing.name,
        slug: editing.slug,
        description: editing.description,
        visible: editing.visible,
        seo: editing.seo,
      });
      setEditing(null);
    });

  const row = (c: Category, depth: number) => (
    <li key={c.id} className="flex items-center gap-2 py-2" style={{ paddingLeft: depth * 24 }}>
      <span className="flex-1">
        {depth > 0 && "└ "}
        <span className={c.visible ? "" : "text-neutral-400 line-through"}>{c.name}</span>
        <span className="ml-2 text-xs text-neutral-500">
          /{c.slug} · {counts[c.id] ?? 0}개
        </span>
      </span>
      {c.id !== UNCATEGORIZED_ID && (
        <>
          <button className="btn" disabled={busy} onClick={() => move(c, -1)} aria-label="위로">
            ↑
          </button>
          <button className="btn" disabled={busy} onClick={() => move(c, 1)} aria-label="아래로">
            ↓
          </button>
        </>
      )}
      <button className="btn" onClick={() => setEditing(c)}>
        수정
      </button>
      {c.id !== UNCATEGORIZED_ID && (
        <button className="btn btn-danger" disabled={busy} onClick={() => remove(c)}>
          삭제
        </button>
      )}
    </li>
  );

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          className="input max-w-xs"
          placeholder="새 카테고리 이름"
          value={name}
          maxLength={50}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && create()}
        />
        <select className="input max-w-[12rem]" value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">대분류</option>
          {roots
            .filter((c) => c.id !== UNCATEGORIZED_ID)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} 하위
              </option>
            ))}
        </select>
        <button className="btn btn-primary" disabled={busy || !name.trim()} onClick={create}>
          추가
        </button>
      </div>

      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {roots.map((r) => (
          <Fragment key={r.id}>
            {row(r, 0)}
            {childrenOf(r.id).map((c) => row(c, 1))}
          </Fragment>
        ))}
      </ul>

      {editing && (
        <div className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="font-semibold">카테고리 수정</h2>
          <div>
            <label className="label">이름</label>
            <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </div>
          <div>
            <label className="label">slug (변경 시 301 리다이렉트 기록)</label>
            <input
              className="input"
              value={editing.slug}
              disabled={editing.id === UNCATEGORIZED_ID}
              onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">설명</label>
            <textarea className="input" rows={2} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">SEO 제목</label>
              <input className="input" value={editing.seo.title} onChange={(e) => setEditing({ ...editing, seo: { ...editing.seo, title: e.target.value } })} />
            </div>
            <div>
              <label className="label">SEO 설명</label>
              <input className="input" value={editing.seo.description} onChange={(e) => setEditing({ ...editing, seo: { ...editing.seo, description: e.target.value } })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editing.visible} onChange={(e) => setEditing({ ...editing, visible: e.target.checked })} />
            공개 사이트에 노출
          </label>
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={save}>
              저장
            </button>
            <button className="btn" onClick={() => setEditing(null)}>
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import rehypeSanitize from "rehype-sanitize";
import "@uiw/react-md-editor/markdown-editor.css";
import { slugify } from "@/lib/slug";
import { uploadImage } from "@/lib/upload";
import { EMPTY_GEO, EMPTY_SEO, type Category, type Post, type PostGeo, type PostSeo } from "@/lib/types";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <div className="h-[520px] animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-900" />,
});

type FormStatus = "draft" | "published" | "scheduled" | "private";

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnailUrl: string;
  categoryId: string;
  tags: string;
  status: FormStatus;
  scheduledAt: string; // datetime-local
  seo: PostSeo;
  geo: PostGeo;
}

const toLocalInput = (ms: number | null) => {
  if (!ms) return "";
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
};

function initialForm(post: Post | null, categories: Category[]): FormState {
  return {
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    thumbnailUrl: post?.thumbnailUrl ?? "",
    categoryId: post?.categoryId ?? categories.find((c) => c.id === "uncategorized")?.id ?? categories[0]?.id ?? "",
    tags: (post?.tags ?? []).join(", "),
    status: post && post.status !== "trashed" ? post.status : "draft",
    scheduledAt: toLocalInput(post?.scheduledAt ?? null),
    seo: post?.seo ?? EMPTY_SEO,
    geo: post?.geo ?? EMPTY_GEO,
  };
}

function toPayload(f: FormState) {
  return {
    title: f.title,
    slug: f.slug,
    excerpt: f.excerpt,
    content: f.content,
    thumbnailUrl: f.thumbnailUrl,
    categoryId: f.categoryId,
    tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean),
    status: f.status,
    scheduledAt: f.status === "scheduled" && f.scheduledAt ? new Date(f.scheduledAt).getTime() : null,
    seo: f.seo,
    geo: { tldr: f.geo.tldr, faq: f.geo.faq.filter((x) => x.q.trim() && x.a.trim()) },
  };
}

export function PostEditor({ categories, post }: { categories: Category[]; post: Post | null }) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(post?.id ?? null);
  const [form, setForm] = useState<FormState>(() => initialForm(post, categories));
  const [slugTouched, setSlugTouched] = useState(Boolean(post));
  const [slugTaken, setSlugTaken] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploads, setUploads] = useState<Record<string, number>>({});
  const [backup, setBackup] = useState<FormState | null>(null);

  const [savedSnap, setSavedSnap] = useState(() => JSON.stringify(initialForm(post, categories)));
  const lastSaved = useRef(savedSnap);
  const formRef = useRef(form);
  const idRef = useRef(id);
  const savingRef = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    formRef.current = form;
    idRef.current = id;
  });

  const backupKey = `post-backup:${post?.id ?? "new"}`;
  const dirty = JSON.stringify(form) !== savedSnap;

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  // 제목 입력 시 slug 자동 생성 (직접 수정하기 전까지)
  const onTitle = (title: string) =>
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));

  // slug 중복 검사 (디바운스)
  useEffect(() => {
    if (!form.slug) return;
    const t = setTimeout(async () => {
      const qs = new URLSearchParams({ slug: form.slug, ...(id ? { exclude: id } : {}) });
      const res = await fetch(`/api/admin/posts/check-slug?${qs}`).catch(() => null);
      if (res?.ok) setSlugTaken((await res.json()).taken);
    }, 400);
    return () => clearTimeout(t);
  }, [form.slug, id]);

  // 로컬 백업 확인 (localStorage 는 마운트 이후에만 접근)
  useEffect(() => {
    queueMicrotask(() => {
    try {
      const raw = localStorage.getItem(backupKey);
      if (raw) {
        const b = JSON.parse(raw) as { at: number; form: FormState };
        if (b.at > (post?.updatedAt ?? 0) && JSON.stringify(b.form) !== lastSaved.current) setBackup(b.form);
      }
    } catch {
      /* 무시 */
    }
    });
  }, [backupKey, post?.updatedAt]);

  // 이탈 경고
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const save = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (savingRef.current) return;
      const f = formRef.current;
      if (!f.title.trim() || !f.slug.trim()) {
        if (!opts?.silent) setMsg({ type: "err", text: "제목과 slug 를 입력하세요." });
        return;
      }
      savingRef.current = true;
      setSaving(true);
      try {
        const currentId = idRef.current;
        const res = await fetch(currentId ? `/api/admin/posts/${currentId}` : "/api/admin/posts", {
          method: currentId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload(f)),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "저장에 실패했습니다.");
        lastSaved.current = JSON.stringify(f);
        setSavedSnap(lastSaved.current);
        try {
          localStorage.removeItem(backupKey);
        } catch {
          /* 무시 */
        }
        if (!currentId && data.id) {
          setId(data.id);
          idRef.current = data.id;
          window.history.replaceState(null, "", `/admin/posts/${data.id}`);
        }
        setMsg({ type: "ok", text: opts?.silent ? "자동 저장됨" : "저장되었습니다." });
      } catch (e) {
        setMsg({ type: "err", text: (e as Error).message });
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [backupKey],
  );

  // 30초 주기: 로컬 백업 + (임시저장 상태일 때만) 서버 자동 저장.
  // 발행/예약/비공개 글은 공개 콘텐츠가 의도치 않게 바뀌지 않도록 수동 저장만 허용한다.
  useEffect(() => {
    const t = setInterval(() => {
      const f = formRef.current;
      if (JSON.stringify(f) === lastSaved.current) return;
      try {
        localStorage.setItem(backupKey, JSON.stringify({ at: Date.now(), form: f }));
      } catch {
        /* 무시 */
      }
      if (f.status === "draft") void save({ silent: true });
    }, 30_000);
    return () => clearInterval(t);
  }, [backupKey, save]);

  // ---- 이미지 업로드 ----
  function insertAtCursor(text: string) {
    const ta = boxRef.current?.querySelector("textarea");
    setForm((f) => {
      const pos = ta ? [ta.selectionStart, ta.selectionEnd] : [f.content.length, f.content.length];
      const content = f.content.slice(0, pos[0]) + text + f.content.slice(pos[1]);
      return { ...f, content };
    });
  }

  async function handleFiles(files: File[], target: "body" | "thumb") {
    for (const file of files) {
      const key = `${file.name}-${Math.random().toString(36).slice(2, 7)}`;
      setUploads((u) => ({ ...u, [key]: 0 }));
      try {
        const { url, alt } = await uploadImage(file, (pct) => setUploads((u) => ({ ...u, [key]: pct })));
        if (target === "thumb") set("thumbnailUrl", url);
        else insertAtCursor(`\n![${alt}](${url})\n`);
      } catch (e) {
        setMsg({ type: "err", text: (e as Error).message });
      } finally {
        setUploads((u) => {
          const { [key]: _removed, ...rest } = u;
          void _removed;
          return rest;
        });
      }
    }
  }

  const imageFiles = (list: FileList | null | undefined) =>
    Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));

  const seoLen = useMemo(
    () => ({ t: form.seo.title.length, d: form.seo.description.length }),
    [form.seo.title, form.seo.description],
  );
  const uploading = Object.keys(uploads).length > 0;
  const catLabel = (c: Category) => (c.parentId ? "└ " : "") + c.name;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{id ? "글 수정" : "새 글 작성"}</h1>
        <div className="flex items-center gap-3">
          {msg && (
            <span role="status" className={`text-sm ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
              {msg.text}
            </span>
          )}
          {dirty && <span className="text-xs text-amber-600">저장되지 않은 변경</span>}
          <button className="btn btn-primary" disabled={saving || uploading} onClick={() => save()}>
            {saving ? "저장 중…" : form.status === "published" ? "발행(저장)" : "저장"}
          </button>
        </div>
      </div>

      {backup && (
        <div className="flex items-center gap-3 rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          저장되지 않은 로컬 백업이 있습니다.
          <button className="btn" onClick={() => { setForm(backup); setBackup(null); }}>
            복원
          </button>
          <button className="btn" onClick={() => { try { localStorage.removeItem(backupKey); } catch {} setBackup(null); }}>
            버리기
          </button>
        </div>
      )}

      <div>
        <label className="label" htmlFor="title">제목</label>
        <input id="title" className="input text-lg" value={form.title} maxLength={200} onChange={(e) => onTitle(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="slug">slug</label>
          <input
            id="slug"
            className="input"
            value={form.slug}
            onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }}
          />
          {form.slug && slugTaken && <p className="mt-1 text-xs text-red-600">이미 사용 중인 slug 입니다.</p>}
        </div>
        <div>
          <label className="label" htmlFor="category">카테고리</label>
          <select id="category" className="input" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{catLabel(c)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="status">상태</label>
          <select id="status" className="input" value={form.status} onChange={(e) => set("status", e.target.value as FormStatus)}>
            <option value="draft">임시저장</option>
            <option value="published">발행</option>
            <option value="scheduled">예약발행</option>
            <option value="private">비공개</option>
          </select>
        </div>
        {form.status === "scheduled" ? (
          <div>
            <label className="label" htmlFor="scheduledAt">예약 시각</label>
            <input id="scheduledAt" type="datetime-local" className="input" value={form.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} />
            <p className="mt-1 text-xs text-neutral-500">예약발행 실행(Vercel Cron)은 후속 마일스톤에서 연결됩니다.</p>
          </div>
        ) : (
          <div>
            <label className="label" htmlFor="tags">태그 (쉼표 구분)</label>
            <input id="tags" className="input" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
          </div>
        )}
      </div>

      {form.status === "scheduled" && (
        <div>
          <label className="label" htmlFor="tags2">태그 (쉼표 구분)</label>
          <input id="tags2" className="input" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
        </div>
      )}

      <div>
        <label className="label" htmlFor="excerpt">요약 (excerpt)</label>
        <textarea id="excerpt" className="input" rows={2} maxLength={300} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
      </div>

      <div>
        <label className="label">대표(썸네일) 이미지</label>
        <div className="flex gap-2">
          <input className="input" placeholder="이미지 URL" value={form.thumbnailUrl} onChange={(e) => set("thumbnailUrl", e.target.value)} />
          <button className="btn shrink-0" onClick={() => thumbRef.current?.click()}>업로드</button>
          <input
            ref={thumbRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => { void handleFiles(imageFiles(e.target.files), "thumb"); e.target.value = ""; }}
          />
        </div>
        {form.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.thumbnailUrl} alt="썸네일 미리보기" className="mt-2 h-28 rounded-md object-cover" />
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="label !mb-0">본문 (마크다운)</label>
          <button className="btn" onClick={() => fileRef.current?.click()}>이미지 삽입</button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            onChange={(e) => { void handleFiles(imageFiles(e.target.files), "body"); e.target.value = ""; }}
          />
        </div>
        <div
          ref={boxRef}
          data-color-mode="light"
          onPasteCapture={(e) => {
            const files = imageFiles(e.clipboardData.files);
            if (files.length) { e.preventDefault(); void handleFiles(files, "body"); }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const files = imageFiles(e.dataTransfer.files);
            if (files.length) { e.preventDefault(); void handleFiles(files, "body"); }
          }}
        >
          <MDEditor
            value={form.content}
            onChange={(v) => set("content", v ?? "")}
            height={520}
            preview="live"
            previewOptions={{ rehypePlugins: [[rehypeSanitize]] }}
          />
        </div>
        {uploading && (
          <ul className="mt-2 space-y-1 text-xs text-neutral-500" aria-live="polite">
            {Object.entries(uploads).map(([k, pct]) => (
              <li key={k}>업로드 중… {pct}%</li>
            ))}
          </ul>
        )}
        <p className="mt-1 text-xs text-neutral-500">이미지는 붙여넣기·드래그&드롭·버튼으로 추가할 수 있습니다 (jpg/png/webp/gif, 10MB 이하).</p>
      </div>

      <details className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800" open>
        <summary className="cursor-pointer font-semibold">SEO</summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="label">제목 ({seoLen.t}/60)</label>
            <input className="input" value={form.seo.title} onChange={(e) => set("seo", { ...form.seo, title: e.target.value })} />
          </div>
          <div>
            <label className="label">설명 ({seoLen.d}/155)</label>
            <textarea className="input" rows={2} value={form.seo.description} onChange={(e) => set("seo", { ...form.seo, description: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">canonical URL</label>
              <input className="input" value={form.seo.canonical} onChange={(e) => set("seo", { ...form.seo, canonical: e.target.value })} />
            </div>
            <div>
              <label className="label">OG 이미지 URL</label>
              <input className="input" value={form.seo.ogImage} onChange={(e) => set("seo", { ...form.seo, ogImage: e.target.value })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.seo.noindex} onChange={(e) => set("seo", { ...form.seo, noindex: e.target.checked })} />
            검색엔진 색인 제외 (noindex)
          </label>
          <div className="rounded-md bg-neutral-50 p-3 dark:bg-neutral-900">
            <p className="text-xs text-neutral-500">검색결과 미리보기</p>
            <p className="text-blue-700 dark:text-blue-400">{(form.seo.title || form.title || "제목").slice(0, 60)}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {(form.seo.description || form.excerpt || "설명이 여기에 표시됩니다.").slice(0, 155)}
            </p>
          </div>
        </div>
      </details>

      <details className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <summary className="cursor-pointer font-semibold">GEO (핵심 요약 · FAQ)</summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="label">핵심 요약 (TL;DR)</label>
            <textarea className="input" rows={3} value={form.geo.tldr} onChange={(e) => set("geo", { ...form.geo, tldr: e.target.value })} />
          </div>
          {form.geo.faq.map((item, i) => (
            <div key={i} className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <input
                className="input"
                placeholder="질문"
                value={item.q}
                onChange={(e) => set("geo", { ...form.geo, faq: form.geo.faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })}
              />
              <textarea
                className="input"
                rows={2}
                placeholder="답변"
                value={item.a}
                onChange={(e) => set("geo", { ...form.geo, faq: form.geo.faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })}
              />
              <button className="btn btn-danger" onClick={() => set("geo", { ...form.geo, faq: form.geo.faq.filter((_, j) => j !== i) })}>
                삭제
              </button>
            </div>
          ))}
          <button className="btn" onClick={() => set("geo", { ...form.geo, faq: [...form.geo.faq, { q: "", a: "" }] })}>
            FAQ 추가
          </button>
        </div>
      </details>

      <div className="flex gap-2 pb-10">
        <button className="btn btn-primary" disabled={saving || uploading} onClick={() => save()}>
          {saving ? "저장 중…" : "저장"}
        </button>
        <button
          className="btn"
          onClick={() => {
            if (dirty && !confirm("저장되지 않은 변경이 사라집니다. 나갈까요?")) return;
            router.push("/admin/posts");
          }}
        >
          목록으로
        </button>
      </div>
    </div>
  );
}

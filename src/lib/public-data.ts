import "server-only";
import { cache } from "react";
import { col, listCategories, toPost } from "@/lib/data";
import type { Category, Post } from "@/lib/types";

export const SITE_NAME = "블로그";
export const PAGE_SIZE = 10;
export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** 공개 글(published)만, 최신 발행순. 요청 단위로 캐시 */
export const getPublishedPosts = cache(async (): Promise<Post[]> => {
  const snap = await col.posts().where("status", "==", "published").get();
  return snap.docs
    .map((d) => toPost(d.id, d.data()))
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
});

export const getVisibleCategories = cache(async (): Promise<Category[]> => {
  const cats = await listCategories();
  return cats.filter((c) => c.visible);
});

export function decodeParam(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export function countByCategory(posts: Post[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of posts) counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1;
  return counts;
}

export function allTags(posts: Post[]): { tag: string; count: number }[] {
  const m = new Map<string, number>();
  for (const p of posts) for (const t of p.tags) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count);
}

export function paginate<T>(items: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  return { items: items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), current, totalPages };
}

export const fmtDate = (ms: number | null) =>
  ms ? new Date(ms).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }) : "";

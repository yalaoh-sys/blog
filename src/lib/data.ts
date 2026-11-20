import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import {
  EMPTY_GEO,
  EMPTY_SEO,
  UNCATEGORIZED_ID,
  type Category,
  type Post,
} from "@/lib/types";

export const col = {
  posts: () => adminDb().collection("posts"),
  categories: () => adminDb().collection("categories"),
  media: () => adminDb().collection("media"),
  redirects: () => adminDb().collection("redirects"),
};

export function toPost(id: string, d: FirebaseFirestore.DocumentData): Post {
  return {
    id,
    title: d.title ?? "",
    slug: d.slug ?? "",
    excerpt: d.excerpt ?? "",
    content: d.content ?? "",
    thumbnailUrl: d.thumbnailUrl ?? "",
    categoryId: d.categoryId ?? UNCATEGORIZED_ID,
    tags: d.tags ?? [],
    status: d.status ?? "draft",
    publishedAt: d.publishedAt ?? null,
    scheduledAt: d.scheduledAt ?? null,
    createdAt: d.createdAt ?? 0,
    updatedAt: d.updatedAt ?? 0,
    deletedAt: d.deletedAt ?? null,
    prevStatus: d.prevStatus ?? null,
    viewCount: d.viewCount ?? 0,
    commentCount: d.commentCount ?? 0,
    readingMinutes: d.readingMinutes ?? 1,
    seo: { ...EMPTY_SEO, ...(d.seo ?? {}) },
    geo: { ...EMPTY_GEO, ...(d.geo ?? {}) },
  };
}

export function toCategory(id: string, d: FirebaseFirestore.DocumentData): Category {
  return {
    id,
    name: d.name ?? "",
    slug: d.slug ?? "",
    description: d.description ?? "",
    parentId: d.parentId ?? null,
    order: d.order ?? 0,
    visible: d.visible ?? true,
    seo: { title: d.seo?.title ?? "", description: d.seo?.description ?? "" },
  };
}

/** "미분류" 기본 카테고리 보장 (삭제 불가) */
export async function ensureDefaultCategory(): Promise<void> {
  const ref = col.categories().doc(UNCATEGORIZED_ID);
  const snap = await ref.get();
  if (snap.exists) return;
  await ref.set({
    name: "미분류",
    slug: "uncategorized",
    description: "",
    parentId: null,
    order: 9999,
    visible: true,
    seo: { title: "", description: "" },
  });
}

export async function listCategories(): Promise<Category[]> {
  await ensureDefaultCategory();
  const snap = await col.categories().get();
  return snap.docs
    .map((d) => toCategory(d.id, d.data()))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "ko"));
}

/** 휴지통 제외 전체 글 (단일 운영자 규모 가정 — 메모리 필터) */
export async function listPosts(): Promise<Post[]> {
  const snap = await col.posts().orderBy("updatedAt", "desc").get();
  return snap.docs.map((d) => toPost(d.id, d.data()));
}

export async function getPost(id: string): Promise<Post | null> {
  const snap = await col.posts().doc(id).get();
  return snap.exists ? toPost(snap.id, snap.data()!) : null;
}

/** slug 중복 확인 (휴지통 글 포함 — TRS-07 slug 예약) */
export async function slugTaken(
  collection: "posts" | "categories",
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const snap = await adminDb().collection(collection).where("slug", "==", slug).limit(2).get();
  return snap.docs.some((d) => d.id !== excludeId);
}

export async function recordRedirect(from: string, to: string) {
  if (from === to) return;
  await col.redirects().add({ from, to, createdAt: Date.now() });
}

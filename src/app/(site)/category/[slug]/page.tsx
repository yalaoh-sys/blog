import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { PostCard } from "@/components/PostCard";
import { decodeParam, getPublishedPosts, getVisibleCategories, paginate } from "@/lib/public-data";

export const dynamic = "force-dynamic";

async function load(rawSlug: string) {
  const slug = decodeParam(rawSlug);
  const categories = await getVisibleCategories();
  const category = categories.find((c) => c.slug === slug);
  return category ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await load((await params).slug);
  if (!c) return {};
  return {
    title: c.seo.title || c.name,
    description: c.seo.description || c.description || `${c.name} 카테고리의 글 모음`,
    alternates: { canonical: `/category/${encodeURIComponent(c.slug)}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const category = await load((await params).slug);
  if (!category) notFound();
  const { page } = await searchParams;
  const posts = (await getPublishedPosts()).filter((p) => p.categoryId === category.id);
  const { items, current, totalPages } = paginate(posts, Number(page));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">{category.name}</h1>
      {category.description && <p className="mt-1 text-neutral-600 dark:text-neutral-400">{category.description}</p>}
      <p className="mb-8 mt-1 text-sm text-neutral-500">글 {posts.length}개</p>
      <div className="space-y-8">
        {items.length === 0 ? (
          <p className="py-10 text-center text-neutral-500">이 카테고리에는 아직 글이 없습니다.</p>
        ) : (
          items.map((p) => <PostCard key={p.id} post={p} categoryName={category.name} />)
        )}
      </div>
      <Pagination current={current} totalPages={totalPages} basePath={`/category/${encodeURIComponent(category.slug)}`} />
    </main>
  );
}

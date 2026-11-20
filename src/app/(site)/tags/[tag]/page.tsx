import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { PostCard } from "@/components/PostCard";
import { decodeParam, getPublishedPosts, getVisibleCategories, paginate } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const tag = decodeParam((await params).tag);
  return { title: `#${tag}`, alternates: { canonical: `/tags/${encodeURIComponent(tag)}` } };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const tag = decodeParam((await params).tag);
  const { page } = await searchParams;
  const [all, categories] = await Promise.all([getPublishedPosts(), getVisibleCategories()]);
  const posts = all.filter((p) => p.tags.includes(tag));
  if (posts.length === 0) notFound();
  const { items, current, totalPages } = paginate(posts, Number(page));
  const catName = (id: string) => categories.find((c) => c.id === id)?.name;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">#{tag}</h1>
      <p className="mb-8 mt-1 text-sm text-neutral-500">글 {posts.length}개</p>
      <div className="space-y-8">
        {items.map((p) => (
          <PostCard key={p.id} post={p} categoryName={catName(p.categoryId)} />
        ))}
      </div>
      <Pagination current={current} totalPages={totalPages} basePath={`/tags/${encodeURIComponent(tag)}`} />
    </main>
  );
}

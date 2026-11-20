import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/Pagination";
import { PostCard } from "@/components/PostCard";
import { allTags, countByCategory, getPublishedPosts, getVisibleCategories, paginate } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "전체 글", alternates: { canonical: "/posts" } };

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const [posts, categories] = await Promise.all([getPublishedPosts(), getVisibleCategories()]);
  const counts = countByCategory(posts);
  const catName = (id: string) => categories.find((c) => c.id === id)?.name;
  const { items, current, totalPages } = paginate(posts, Number(page));
  const tags = allTags(posts);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">전체 글 <span className="text-base font-normal text-neutral-500">{posts.length}</span></h1>

      <nav aria-label="카테고리" className="mb-8 flex flex-wrap gap-2">
        <span className="btn btn-primary">전체</span>
        {categories
          .filter((c) => counts[c.id])
          .map((c) => (
            <Link key={c.id} href={`/category/${encodeURIComponent(c.slug)}`} className="btn">
              {c.name} <span className="ml-1 text-neutral-500">{counts[c.id]}</span>
            </Link>
          ))}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_14rem]">
        <div className="space-y-8">
          {items.length === 0 ? (
            <p className="py-10 text-center text-neutral-500">아직 발행된 글이 없습니다.</p>
          ) : (
            items.map((p) => <PostCard key={p.id} post={p} categoryName={catName(p.categoryId)} />)
          )}
          <Pagination current={current} totalPages={totalPages} basePath="/posts" />
        </div>
        <aside aria-label="태그">
          <h2 className="mb-3 text-sm font-semibold">태그</h2>
          <ul className="flex flex-wrap gap-1.5">
            {tags.map(({ tag, count }) => (
              <li key={tag}>
                <Link
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs hover:bg-neutral-200 dark:bg-neutral-800"
                >
                  #{tag} {count}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}

import Link from "next/link";
import { PostCard } from "@/components/PostCard";
import { countByCategory, getPublishedPosts, getVisibleCategories } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [posts, categories] = await Promise.all([getPublishedPosts(), getVisibleCategories()]);
  const counts = countByCategory(posts);
  const catName = (id: string) => categories.find((c) => c.id === id)?.name;
  const latest = posts.slice(0, 5);

  return (
    <main className="mx-auto max-w-5xl px-4">
      <section className="py-14 text-center sm:py-20">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">만들고, 배우고, 기록합니다</h1>
        <p className="mx-auto mt-4 max-w-xl text-neutral-600 dark:text-neutral-400">
          개발, AI 협업, 블로그 운영에 대한 경험을 정리한 개인 블로그입니다.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/posts" className="btn btn-primary px-5 py-2">
            글 보러 가기
          </Link>
          <Link href="/about" className="btn px-5 py-2">
            소개
          </Link>
        </div>
      </section>

      <section aria-labelledby="latest" className="pb-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="latest" className="text-xl font-bold">
            최신 글
          </h2>
          <Link href="/posts" className="text-sm text-blue-600 hover:underline">
            전체 보기 →
          </Link>
        </div>
        {latest.length === 0 ? (
          <p className="py-10 text-center text-neutral-500">아직 발행된 글이 없습니다.</p>
        ) : (
          <div className="space-y-8">
            {latest.map((p) => (
              <PostCard key={p.id} post={p} categoryName={catName(p.categoryId)} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="cats" className="pb-16">
        <h2 id="cats" className="mb-4 text-xl font-bold">
          카테고리
        </h2>
        <ul className="flex flex-wrap gap-2">
          {categories
            .filter((c) => counts[c.id])
            .map((c) => (
              <li key={c.id}>
                <Link href={`/category/${encodeURIComponent(c.slug)}`} className="btn">
                  {c.name} <span className="ml-1 text-neutral-500">{counts[c.id]}</span>
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}

import Link from "next/link";
import { Thumb } from "@/components/Thumb";
import { fmtDate } from "@/lib/public-data";
import type { Post } from "@/lib/types";

export function PostCard({ post, categoryName }: { post: Post; categoryName?: string }) {
  const href = `/posts/${encodeURIComponent(post.slug)}`;
  return (
    <article className="group flex flex-col gap-4 sm:flex-row">
      <Link href={href} className="block shrink-0 sm:w-56" tabIndex={-1} aria-hidden="true">
        <Thumb src={post.thumbnailUrl} alt="" className="aspect-[1.91/1] w-full rounded-lg" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs text-neutral-500">
          {categoryName && <span className="mr-2 font-semibold text-blue-600">{categoryName}</span>}
          <time dateTime={post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined}>
            {fmtDate(post.publishedAt)}
          </time>
          <span className="mx-1.5">·</span>
          {post.readingMinutes}분 읽기
          <span className="mx-1.5">·</span>조회 {post.viewCount}
        </p>
        <h2 className="text-lg font-bold leading-snug group-hover:underline">
          <Link href={href}>{post.title}</Link>
        </h2>
        <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">{post.excerpt}</p>
        {post.tags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {post.tags.map((t) => (
              <li key={t}>
                <Link
                  href={`/tags/${encodeURIComponent(t)}`}
                  className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  #{t}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/Markdown";
import { Thumb } from "@/components/Thumb";
import { extractHeadings, Toc } from "@/components/Toc";
import { decodeParam, fmtDate, getPublishedPosts, getVisibleCategories, SITE_NAME, siteUrl } from "@/lib/public-data";

export const dynamic = "force-dynamic";

async function load(rawSlug: string) {
  const slug = decodeParam(rawSlug);
  const posts = await getPublishedPosts();
  const index = posts.findIndex((p) => p.slug === slug);
  return { posts, index, post: index >= 0 ? posts[index] : null };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { post } = await load((await params).slug);
  if (!post) return {};
  const path = `/posts/${encodeURIComponent(post.slug)}`;
  const description = post.seo.description || post.excerpt;
  const image = post.seo.ogImage || post.thumbnailUrl;
  return {
    title: post.seo.title || post.title,
    description,
    alternates: { canonical: post.seo.canonical || path },
    robots: post.seo.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title: post.seo.title || post.title,
      description,
      url: path,
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      modifiedTime: new Date(post.updatedAt).toISOString(),
      images: image ? [image] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { posts, index, post } = await load((await params).slug);
  if (!post) notFound();
  const categories = await getVisibleCategories();
  const category = categories.find((c) => c.id === post.categoryId);

  // 최신순 정렬이므로 index-1 이 다음(더 최신) 글, index+1 이 이전(더 오래된) 글
  const newer = posts[index - 1];
  const older = posts[index + 1];
  const related = posts
    .filter((p) => p.id !== post.id && (p.categoryId === post.categoryId || p.tags.some((t) => post.tags.includes(t))))
    .slice(0, 3);

  const url = `${siteUrl()}/posts/${encodeURIComponent(post.slug)}`;
  const jsonLd: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.seo.description || post.excerpt,
      datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      dateModified: new Date(post.updatedAt).toISOString(),
      mainEntityOfPage: url,
      image: post.thumbnailUrl ? `${siteUrl()}${post.thumbnailUrl}` : undefined,
      keywords: post.tags.join(", "),
      publisher: { "@type": "Organization", name: SITE_NAME },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "홈", item: siteUrl() },
        { "@type": "ListItem", position: 2, name: "글", item: `${siteUrl()}/posts` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];
  if (post.geo.faq.length > 0) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.geo.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  return (
    <main className="mx-auto max-w-[720px] px-4 py-10">
      {jsonLd.map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          // JSON-LD 내 "<" 이스케이프로 스크립트 조기 종료 방지
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, "\\u003c") }}
        />
      ))}

      <nav aria-label="경로" className="mb-4 text-xs text-neutral-500">
        <Link href="/posts" className="hover:underline">글</Link>
        {category && (
          <>
            {" / "}
            <Link href={`/category/${encodeURIComponent(category.slug)}`} className="hover:underline">
              {category.name}
            </Link>
          </>
        )}
      </nav>

      <article>
        <header>
          <h1 className="text-3xl font-extrabold leading-tight">{post.title}</h1>
          <p className="mt-3 text-sm text-neutral-500">
            <time dateTime={post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined}>
              {fmtDate(post.publishedAt)}
            </time>
            {post.updatedAt - (post.publishedAt ?? 0) > 24 * 60 * 60 * 1000 && (
              <> · 수정 <time dateTime={new Date(post.updatedAt).toISOString()}>{fmtDate(post.updatedAt)}</time></>
            )}
            <span className="mx-1.5">·</span>
            {post.readingMinutes}분 읽기
            <span className="mx-1.5">·</span>조회 {post.viewCount}
          </p>
          <Thumb src={post.thumbnailUrl} alt="" className="mt-6 aspect-[1.91/1] w-full rounded-xl" />
        </header>

        {post.geo.tldr && (
          <aside aria-label="핵심 요약" className="mt-8 rounded-lg border-l-4 border-blue-600 bg-blue-50 p-4 dark:bg-blue-950/40">
            <p className="mb-1 text-xs font-bold text-blue-700 dark:text-blue-300">핵심 요약</p>
            <p className="leading-7">{post.geo.tldr}</p>
          </aside>
        )}

        <div className="mt-8">
          <Toc headings={extractHeadings(post.content)} />
        </div>

        <div className="mt-8">
          <Markdown source={post.content} />
        </div>

        {post.geo.faq.length > 0 && (
          <section aria-labelledby="faq" className="mt-12">
            <h2 id="faq" className="mb-3 text-xl font-bold">
              자주 묻는 질문
            </h2>
            <dl className="space-y-4">
              {post.geo.faq.map((f) => (
                <div key={f.q} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                  <dt className="font-semibold">Q. {f.q}</dt>
                  <dd className="mt-1 text-neutral-700 dark:text-neutral-300">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {post.tags.length > 0 && (
          <ul className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <li key={t}>
                <Link href={`/tags/${encodeURIComponent(t)}`} className="rounded-full bg-neutral-100 px-3 py-1 text-sm hover:bg-neutral-200 dark:bg-neutral-800">
                  #{t}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>

      <nav aria-label="이전/다음 글" className="mt-12 grid gap-3 border-t border-neutral-200 pt-6 sm:grid-cols-2 dark:border-neutral-800">
        {older ? (
          <Link href={`/posts/${encodeURIComponent(older.slug)}`} className="rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">
            <span className="text-xs text-neutral-500">← 이전 글</span>
            <span className="mt-1 block font-semibold">{older.title}</span>
          </Link>
        ) : <span />}
        {newer ? (
          <Link href={`/posts/${encodeURIComponent(newer.slug)}`} className="rounded-lg border border-neutral-200 p-4 text-right hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">
            <span className="text-xs text-neutral-500">다음 글 →</span>
            <span className="mt-1 block font-semibold">{newer.title}</span>
          </Link>
        ) : <span />}
      </nav>

      {related.length > 0 && (
        <section aria-labelledby="related" className="mt-12">
          <h2 id="related" className="mb-3 text-lg font-bold">
            관련 글
          </h2>
          <ul className="space-y-2">
            {related.map((p) => (
              <li key={p.id}>
                <Link href={`/posts/${encodeURIComponent(p.slug)}`} className="hover:text-blue-600 hover:underline">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

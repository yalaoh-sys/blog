import Link from "next/link";

export function Pagination({ current, totalPages, basePath }: { current: number; totalPages: number; basePath: string }) {
  if (totalPages <= 1) return null;
  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);
  return (
    <nav aria-label="페이지 이동" className="mt-10 flex items-center justify-center gap-1">
      {current > 1 && (
        <Link href={href(current - 1)} className="btn">
          이전
        </Link>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === current ? "page" : undefined}
          className={`btn ${p === current ? "btn-primary" : ""}`}
        >
          {p}
        </Link>
      ))}
      {current < totalPages && (
        <Link href={href(current + 1)} className="btn">
          다음
        </Link>
      )}
    </nav>
  );
}

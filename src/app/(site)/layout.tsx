import Link from "next/link";
import { SITE_NAME } from "@/lib/public-data";

const MENU = [
  { href: "/", label: "홈" },
  { href: "/posts", label: "글" },
  { href: "/about", label: "소개" },
];

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-[var(--background)]/90 backdrop-blur dark:border-neutral-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold">
            {SITE_NAME}
          </Link>
          <nav aria-label="주 메뉴" className="flex gap-4 text-sm">
            {MENU.map((m) => (
              <Link key={m.href} href={m.href} className="hover:text-blue-600">
                {m.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-neutral-200 py-8 text-center text-xs text-neutral-500 dark:border-neutral-800">
        <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
        <p className="mt-1">방문 통계는 쿠키 없이 익명으로 수집될 예정입니다.</p>
      </footer>
    </>
  );
}

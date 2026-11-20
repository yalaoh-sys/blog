import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { LogoutButton } from "./LogoutButton";

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/posts", label: "글" },
  { href: "/admin/categories", label: "카테고리" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-neutral-200 p-4 md:w-56 md:border-b-0 md:border-r dark:border-neutral-800">
        <p className="mb-4 text-sm font-bold">블로그 관리자</p>
        <nav className="flex gap-2 md:flex-col">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
          <Link href="/" target="_blank" className="text-sm text-neutral-500 hover:underline">
            사이트 보기 ↗
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-neutral-500 sm:inline">{admin.email}</span>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

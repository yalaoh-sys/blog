import { listCategories, listPosts } from "@/lib/data";
import { CategoryManager } from "./CategoryManager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [categories, posts] = await Promise.all([listCategories(), listPosts()]);
  const counts: Record<string, number> = {};
  for (const p of posts) {
    if (p.status !== "trashed") counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1;
  }
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">카테고리</h1>
      <CategoryManager initial={categories} counts={counts} />
    </div>
  );
}

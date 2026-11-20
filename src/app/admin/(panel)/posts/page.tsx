import { listCategories, listPosts } from "@/lib/data";
import { PostList } from "./PostList";

export const dynamic = "force-dynamic";

export default async function PostsPage() {
  const [posts, categories] = await Promise.all([listPosts(), listCategories()]);
  // 목록에는 본문 전체를 보내지 않는다
  const rows = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    status: p.status,
    categoryId: p.categoryId,
    viewCount: p.viewCount,
    updatedAt: p.updatedAt,
  }));
  return <PostList posts={rows} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />;
}

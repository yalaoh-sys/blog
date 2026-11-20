import { notFound } from "next/navigation";
import { getPost, listCategories } from "@/lib/data";
import { PostEditor } from "../PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, categories] = await Promise.all([getPost(id), listCategories()]);
  if (!post || post.status === "trashed") notFound();
  return <PostEditor categories={categories} post={post} />;
}

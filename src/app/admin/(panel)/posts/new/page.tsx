import { listCategories } from "@/lib/data";
import { PostEditor } from "../PostEditor";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const categories = await listCategories();
  return <PostEditor categories={categories} post={null} />;
}

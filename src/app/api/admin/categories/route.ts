import { adminRoute, HttpError, readJson } from "@/lib/api";
import { col, listCategories, slugTaken } from "@/lib/data";
import { categoryInputSchema } from "@/lib/schemas";

export const POST = adminRoute(async (req) => {
  const input = categoryInputSchema.parse(await readJson(req));
  const all = await listCategories();

  if (input.parentId) {
    const parent = all.find((c) => c.id === input.parentId);
    if (!parent) throw new HttpError(400, "상위 카테고리를 찾을 수 없습니다.");
    if (parent.parentId) throw new HttpError(400, "카테고리는 최대 2단계까지 가능합니다.");
  }
  if (await slugTaken("categories", input.slug)) {
    throw new HttpError(409, "이미 사용 중인 slug 입니다.");
  }

  const maxOrder = Math.max(0, ...all.filter((c) => c.id !== "uncategorized").map((c) => c.order));
  const ref = await col.categories().add({ ...input, order: maxOrder + 1 });
  return { id: ref.id };
});

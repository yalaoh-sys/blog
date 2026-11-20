import { adminRoute, HttpError, readJson } from "@/lib/api";
import { col, listCategories, slugTaken } from "@/lib/data";
import { postInputSchema } from "@/lib/schemas";
import { readingMinutes } from "@/lib/slug";

export const POST = adminRoute(async (req) => {
  const input = postInputSchema.parse(await readJson(req));

  const cats = await listCategories();
  if (!cats.some((c) => c.id === input.categoryId)) {
    throw new HttpError(400, "카테고리를 찾을 수 없습니다.");
  }
  if (await slugTaken("posts", input.slug)) {
    throw new HttpError(409, "이미 사용 중인 slug 입니다.");
  }
  if (input.status === "scheduled" && !input.scheduledAt) {
    throw new HttpError(400, "예약 발행 시각을 지정하세요.");
  }

  const now = Date.now();
  const ref = await col.posts().add({
    ...input,
    publishedAt: input.status === "published" ? now : null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    prevStatus: null,
    viewCount: 0,
    commentCount: 0,
    readingMinutes: readingMinutes(input.content),
  });
  return { id: ref.id };
});

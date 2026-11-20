import { adminRoute, readJson } from "@/lib/api";
import { col } from "@/lib/data";
import { mediaInputSchema } from "@/lib/schemas";

/** 클라이언트가 Storage 에 올린 뒤 메타데이터를 기록한다. */
export const POST = adminRoute(async (req) => {
  const input = mediaInputSchema.parse(await readJson(req));
  const ref = await col.media().add({
    ...input,
    usedInPosts: [],
    createdAt: Date.now(),
    deletedAt: null,
  });
  return { id: ref.id };
});

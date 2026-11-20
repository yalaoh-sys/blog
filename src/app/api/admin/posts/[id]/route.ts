import { adminRoute, HttpError, readJson } from "@/lib/api";
import { col, listCategories, recordRedirect, slugTaken, toPost } from "@/lib/data";
import { postInputSchema } from "@/lib/schemas";
import { readingMinutes } from "@/lib/slug";

/** 수정. status "trashed" 글의 수정은 거부(복원 후 수정). */
export const PATCH = adminRoute<{ id: string }>(async (req, { params }) => {
  const { id } = params;
  const input = postInputSchema.parse(await readJson(req));
  const ref = col.posts().doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "글을 찾을 수 없습니다.");
  const current = toPost(id, snap.data()!);
  if (current.status === "trashed") throw new HttpError(400, "휴지통의 글은 수정할 수 없습니다.");

  const cats = await listCategories();
  if (!cats.some((c) => c.id === input.categoryId)) {
    throw new HttpError(400, "카테고리를 찾을 수 없습니다.");
  }
  if (input.slug !== current.slug) {
    if (await slugTaken("posts", input.slug, id)) {
      throw new HttpError(409, "이미 사용 중인 slug 입니다.");
    }
    if (current.publishedAt) {
      await recordRedirect(`/posts/${current.slug}`, `/posts/${input.slug}`);
    }
  }
  if (input.status === "scheduled" && !input.scheduledAt) {
    throw new HttpError(400, "예약 발행 시각을 지정하세요.");
  }

  const now = Date.now();
  await ref.update({
    ...input,
    publishedAt:
      input.status === "published" && !current.publishedAt ? now : current.publishedAt,
    updatedAt: now,
    readingMinutes: readingMinutes(input.content),
  });
  return { ok: true, updatedAt: now };
});

/** 삭제 = 휴지통 이동(소프트 삭제). 완전 삭제는 M3 휴지통 화면에서 구현. */
export const DELETE = adminRoute<{ id: string }>(async (_req, { params, uid }) => {
  const ref = col.posts().doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "글을 찾을 수 없습니다.");
  const current = toPost(snap.id, snap.data()!);
  if (current.status === "trashed") return { ok: true };
  await ref.update({
    status: "trashed",
    prevStatus: current.status,
    deletedAt: Date.now(),
    deletedBy: uid,
  });
  return { ok: true };
});

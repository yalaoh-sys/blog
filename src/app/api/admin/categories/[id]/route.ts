import { z } from "zod";
import { adminRoute, HttpError, readJson } from "@/lib/api";
import { adminDb } from "@/lib/firebase/admin";
import { col, listCategories, recordRedirect, slugTaken } from "@/lib/data";
import { categoryInputSchema } from "@/lib/schemas";
import { UNCATEGORIZED_ID } from "@/lib/types";

const patchSchema = categoryInputSchema.partial().extend({
  order: z.number().int().optional(),
});

export const PATCH = adminRoute<{ id: string }>(async (req, { params }) => {
  const { id } = params;
  const patch = patchSchema.parse(await readJson(req));
  const all = await listCategories();
  const current = all.find((c) => c.id === id);
  if (!current) throw new HttpError(404, "카테고리를 찾을 수 없습니다.");

  if (id === UNCATEGORIZED_ID && (patch.parentId || patch.slug || patch.visible === false)) {
    throw new HttpError(400, "미분류 카테고리는 변경할 수 없습니다.");
  }
  if (patch.parentId !== undefined && patch.parentId !== null) {
    const parent = all.find((c) => c.id === patch.parentId);
    if (!parent || parent.id === id) throw new HttpError(400, "상위 카테고리가 올바르지 않습니다.");
    if (parent.parentId) throw new HttpError(400, "카테고리는 최대 2단계까지 가능합니다.");
    if (all.some((c) => c.parentId === id)) {
      throw new HttpError(400, "하위 카테고리가 있는 항목은 다른 카테고리의 하위로 이동할 수 없습니다.");
    }
  }
  if (patch.slug && patch.slug !== current.slug) {
    if (await slugTaken("categories", patch.slug, id)) {
      throw new HttpError(409, "이미 사용 중인 slug 입니다.");
    }
    await recordRedirect(`/category/${current.slug}`, `/category/${patch.slug}`);
  }

  await col.categories().doc(id).update(patch);
  return { ok: true };
});

export const DELETE = adminRoute<{ id: string }>(async (req, { params }) => {
  const { id } = params;
  if (id === UNCATEGORIZED_ID) throw new HttpError(400, "미분류 카테고리는 삭제할 수 없습니다.");

  const all = await listCategories();
  if (!all.some((c) => c.id === id)) throw new HttpError(404, "카테고리를 찾을 수 없습니다.");
  if (all.some((c) => c.parentId === id)) {
    throw new HttpError(400, "하위 카테고리를 먼저 삭제하거나 이동하세요.");
  }

  const moveTo = new URL(req.url).searchParams.get("moveTo") || UNCATEGORIZED_ID;
  if (moveTo === id || !all.some((c) => c.id === moveTo)) {
    throw new HttpError(400, "이동할 카테고리가 올바르지 않습니다.");
  }

  const db = adminDb();
  const posts = await col.posts().where("categoryId", "==", id).get();
  for (let i = 0; i < posts.docs.length; i += 400) {
    const batch = db.batch();
    posts.docs.slice(i, i + 400).forEach((d) => batch.update(d.ref, { categoryId: moveTo }));
    await batch.commit();
  }
  await col.categories().doc(id).delete();
  return { ok: true, moved: posts.size };
});

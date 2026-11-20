import { adminRoute } from "@/lib/api";
import { slugTaken } from "@/lib/data";

export const GET = adminRoute(async (req) => {
  const sp = new URL(req.url).searchParams;
  const slug = sp.get("slug")?.trim() ?? "";
  if (!slug) return { taken: false };
  return { taken: await slugTaken("posts", slug, sp.get("exclude") || undefined) };
});

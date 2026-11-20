import { z } from "zod";

export const postInputSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요").max(200),
  slug: z.string().trim().min(1, "slug를 입력하세요").max(120),
  excerpt: z.string().max(300).default(""),
  content: z.string().max(300_000).default(""),
  thumbnailUrl: z.string().max(2000).default(""),
  categoryId: z.string().min(1),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  status: z.enum(["draft", "published", "scheduled", "private"]),
  scheduledAt: z.number().int().nullable().default(null),
  seo: z
    .object({
      title: z.string().max(120).default(""),
      description: z.string().max(300).default(""),
      canonical: z.string().max(2000).default(""),
      ogImage: z.string().max(2000).default(""),
      noindex: z.boolean().default(false),
    })
    .default({
      title: "",
      description: "",
      canonical: "",
      ogImage: "",
      noindex: false,
    }),
  geo: z
    .object({
      tldr: z.string().max(1000).default(""),
      faq: z
        .array(
          z.object({ q: z.string().max(300), a: z.string().max(2000) }),
        )
        .max(20)
        .default([]),
    })
    .default({ tldr: "", faq: [] }),
});
export type PostInput = z.infer<typeof postInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력하세요").max(50),
  slug: z.string().trim().min(1).max(80),
  description: z.string().max(300).default(""),
  parentId: z.string().nullable().default(null),
  visible: z.boolean().default(true),
  seo: z
    .object({
      title: z.string().max(120).default(""),
      description: z.string().max(300).default(""),
    })
    .default({ title: "", description: "" }),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const mediaInputSchema = z.object({
  url: z.string().url(),
  storagePath: z.string().min(1).max(500),
  width: z.number().int().nonnegative(),
  height: z.number().int().nonnegative(),
  size: z.number().int().nonnegative(),
});

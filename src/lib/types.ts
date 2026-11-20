export const UNCATEGORIZED_ID = "uncategorized";

export type PostStatus =
  | "draft"
  | "published"
  | "scheduled"
  | "private"
  | "trashed";

export interface PostSeo {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  noindex: boolean;
}

export interface PostGeo {
  tldr: string;
  faq: { q: string; a: string }[];
}

/** 모든 시각은 epoch ms (직렬화 용이) */
export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnailUrl: string;
  categoryId: string;
  tags: string[];
  status: PostStatus;
  publishedAt: number | null;
  scheduledAt: number | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
  prevStatus: PostStatus | null;
  viewCount: number;
  commentCount: number;
  readingMinutes: number;
  seo: PostSeo;
  geo: PostGeo;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  order: number;
  visible: boolean;
  seo: { title: string; description: string };
}

export const EMPTY_SEO: PostSeo = {
  title: "",
  description: "",
  canonical: "",
  ogImage: "",
  noindex: false,
};

export const EMPTY_GEO: PostGeo = { tldr: "", faq: [] };

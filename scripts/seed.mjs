// 샘플 글 시드: content/posts/*.md → Firestore
// 실행: npm run seed   (.env.local 의 Firebase Admin 키 사용, 이미 있는 slug 는 건너뜀)
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const { FIREBASE_ADMIN_PROJECT_ID: projectId, FIREBASE_ADMIN_CLIENT_EMAIL: clientEmail } = process.env;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) {
  console.error("Firebase Admin 환경변수가 없습니다. .env.local 을 확인하세요.");
  process.exit(1);
}
initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore();

const CATEGORY_SLUGS = { AI: "ai", 개발: "dev", "블로그 운영": "blog-ops" };
const readingMinutes = (md) => Math.max(1, Math.ceil(md.replace(/\s+/g, "").length / 500));

// 카테고리 보장 (이름 기준)
const catSnap = await db.collection("categories").get();
const catIds = Object.fromEntries(catSnap.docs.map((d) => [d.data().name, d.id]));
let order = catSnap.size;
for (const name of Object.keys(CATEGORY_SLUGS)) {
  if (catIds[name]) continue;
  const ref = await db.collection("categories").add({
    name,
    slug: CATEGORY_SLUGS[name],
    description: "",
    parentId: null,
    order: ++order,
    visible: true,
    seo: { title: "", description: "" },
  });
  catIds[name] = ref.id;
  console.log(`카테고리 생성: ${name}`);
}

const dir = join(process.cwd(), "content", "posts");
const files = readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
const base = Date.now() - files.length * 2 * 24 * 60 * 60 * 1000; // 이틀 간격으로 과거 날짜 부여

for (const [i, file] of files.entries()) {
  const { data: fm, content } = matter(readFileSync(join(dir, file), "utf8"));
  const dup = await db.collection("posts").where("slug", "==", fm.slug).limit(1).get();
  if (!dup.empty) {
    console.log(`건너뜀(이미 존재): ${fm.slug}`);
    continue;
  }
  if (!catIds[fm.category]) throw new Error(`알 수 없는 카테고리: ${fm.category}`);
  const at = base + (i + 1) * 2 * 24 * 60 * 60 * 1000;
  await db.collection("posts").add({
    title: fm.title,
    slug: fm.slug,
    excerpt: fm.excerpt ?? "",
    content: content.trim(),
    thumbnailUrl: fm.thumbnail ?? "",
    categoryId: catIds[fm.category],
    tags: fm.tags ?? [],
    status: fm.status ?? "published",
    scheduledAt: null,
    publishedAt: at,
    createdAt: at,
    updatedAt: at,
    deletedAt: null,
    prevStatus: null,
    viewCount: 0,
    commentCount: 0,
    readingMinutes: readingMinutes(content),
    seo: { title: "", description: "", canonical: "", ogImage: "", noindex: false, ...(fm.seo ?? {}) },
    geo: { tldr: fm.geo?.tldr ?? "", faq: fm.geo?.faq ?? [] },
  });
  console.log(`글 생성: ${fm.slug}`);
}
console.log("완료");

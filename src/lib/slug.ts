/** 한글/영문/숫자를 유지하는 slug 생성 */
export function slugify(input: string): string {
  return input
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function readingMinutes(markdown: string): number {
  return Math.max(1, Math.ceil(markdown.replace(/\s+/g, "").length / 500));
}

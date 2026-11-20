import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "소개",
  description: "블로그 운영자 소개와 연락처",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-[720px] px-4 py-12">
      <h1 className="text-3xl font-bold">소개</h1>
      <div className="mt-6 space-y-4 leading-8">
        <p>
          안녕하세요. 개발과 AI 협업, 블로그 운영에 대해 배운 것을 기록하는 블로그입니다.
        </p>
        <p className="rounded-md bg-neutral-50 p-4 text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
          이 페이지는 임시 내용입니다. 이름, 직함, 경력, 포트폴리오·SNS 링크, 연락처는 추후 관리자의 프로필 설정에서
          편집할 수 있도록 연결할 예정입니다.
        </p>
      </div>
    </main>
  );
}

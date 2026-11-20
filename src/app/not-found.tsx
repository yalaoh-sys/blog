import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-5xl font-extrabold text-blue-600">404</p>
      <h1 className="text-xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-neutral-500">주소가 바뀌었거나 삭제된 글일 수 있습니다.</p>
      <Link href="/" className="btn btn-primary">
        홈으로
      </Link>
    </main>
  );
}

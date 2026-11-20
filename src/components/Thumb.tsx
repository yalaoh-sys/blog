"use client";

import { useState } from "react";

/** 이미지가 없거나 로드에 실패하면 그라데이션 플레이스홀더를 보여준다 */
export function Thumb({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`overflow-hidden bg-gradient-to-br from-blue-100 to-blue-300 dark:from-blue-950 dark:to-blue-800 ${className}`}
    >
      {src && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      )}
    </div>
  );
}

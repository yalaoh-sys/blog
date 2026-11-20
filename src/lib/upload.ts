import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { clientAuth, clientStorage } from "@/lib/firebase/client";

export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_BYTES = 10 * 1024 * 1024;
const MAX_EDGE = 2000;

async function resize(file: File): Promise<{ blob: Blob; width: number; height: number; ext: string }> {
  const bitmap = await createImageBitmap(file);
  // gif 는 애니메이션 보존을 위해 원본 유지
  if (file.type === "image/gif") {
    return { blob: file, width: bitmap.width, height: bitmap.height, ext: "gif" };
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.85));
  if (!blob) return { blob: file, width, height, ext: file.type.split("/")[1] };
  return { blob, width, height, ext: "webp" };
}

function uploadOnce(path: string, blob: Blob, onProgress: (pct: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const task = uploadBytesResumable(ref(clientStorage(), path), blob, {
      contentType: blob.type,
      cacheControl: "public,max-age=31536000,immutable",
    });
    task.on(
      "state_changed",
      (s) => onProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref)),
    );
  });
}

export async function uploadImage(
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ url: string; alt: string }> {
  if (process.env.NEXT_PUBLIC_UPLOADS_ENABLED !== "true") {
    throw new Error("이미지 업로드가 아직 활성화되지 않았습니다(Storage 미설정). 이미지 URL을 직접 입력하세요.");
  }
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("jpg/png/webp/gif 이미지만 업로드할 수 있습니다.");
  if (file.size > MAX_BYTES) throw new Error("파일당 최대 10MB 까지 업로드할 수 있습니다.");
  if (!clientAuth().currentUser) throw new Error("Firebase 로그인 세션이 만료되었습니다. 다시 로그인하세요.");

  const { blob, width, height, ext } = await resize(file);
  const now = new Date();
  const path = `uploads/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;

  // 실패 시 최대 2회 재시도
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url = await uploadOnce(path, blob, onProgress);
      await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, storagePath: path, width, height, size: blob.size }),
      });
      return { url, alt: file.name.replace(/\.[^.]+$/, "") };
    } catch (e) {
      lastErr = e;
      onProgress(0);
    }
  }
  throw new Error(`업로드에 실패했습니다: ${(lastErr as Error)?.message ?? "알 수 없는 오류"}`);
}

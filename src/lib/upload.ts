import imageCompression from "browser-image-compression";
import { api } from "@/client/api/client";

export async function compressImage(file: File): Promise<File> {
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1.2,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: "image/jpeg",
    });
    return new File([compressed], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export async function uploadImage(
  _bucket: "report-images" | "avatars",
  _userId: string,
  file: File,
): Promise<{ url: string; path: string }> {
  const compressed = await compressImage(file);
  const result = await api.upload<{ url: string; public_id: string }>("/uploads", compressed);
  return {
    url: result.url,
    path: result.public_id || "placeholder",
  };
}

export async function deleteStorageFile(_bucket: "report-images" | "avatars", _path: string) {
  // Cloudinary deletion handled by backend when records are deleted if configured
}

export function validateImage(file: File): string | null {
  if (!file.type.startsWith("image/")) return "الملف ليس صورة";
  if (file.size > 10 * 1024 * 1024) return "حجم الصورة أكبر من 10 ميجابايت";
  return null;
}

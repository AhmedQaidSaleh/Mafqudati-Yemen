import { useState, type ChangeEvent } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { uploadImage, validateImage } from "@/lib/upload";
import { toast } from "sonner";

export type UploadedImage = { url: string; path: string };

export function ImageUploader({
  userId,
  value,
  onChange,
  max = 6,
}: {
  userId: string;
  value: UploadedImage[];
  onChange: (imgs: UploadedImage[]) => void;
  max?: number;
}) {
  const [busy, setBusy] = useState(false);

  const handle = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    if (value.length + files.length > max) {
      toast.error(`الحد الأقصى ${max} صور`);
      return;
    }
    setBusy(true);
    const added: UploadedImage[] = [];
    for (const f of files) {
      const err = validateImage(f);
      if (err) {
        toast.error(err);
        continue;
      }
      try {
        const up = await uploadImage("report-images", userId, f);
        added.push(up);
      } catch (e) {
        toast.error("فشل رفع الصورة");
        console.error(e);
      }
    }
    onChange([...value, ...added]);
    setBusy(false);
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((img, i) => (
            <div
              key={img.path}
              className="relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary"
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 end-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {value.length < max && (
        <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/40 p-8 cursor-pointer hover:bg-secondary/60">
          {busy ? (
            <Loader2 className="size-8 text-primary animate-spin" />
          ) : (
            <UploadCloud className="size-8 text-primary" />
          )}
          <span className="text-sm font-bold text-primary-dark">أرفق صور المفقود</span>
          <span className="text-xs text-muted-foreground">حتى {max} صور - سيتم ضغطها تلقائياً</span>
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handle}
            disabled={busy}
          />
        </label>
      )}
    </div>
  );
}

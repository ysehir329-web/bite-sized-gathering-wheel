import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { uploadMenuPhoto } from "@/lib/menu.functions";
import { menuImage } from "@/lib/menu-images";
import { compressMenuPhoto, MENU_PHOTO_MAX_BYTES, MENU_PHOTO_SOURCE_MAX_BYTES } from "@/lib/menu-photo";

export function PhotoUploader({ value, onChange, onBusyChange }: { value: string; onChange: (image: string) => void; onBusyChange?: (busy: boolean) => void }) {
  const send = useServerFn(uploadMenuPhoto);
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Lütfen bir fotoğraf seçin."); return; }
    if (file.size > MENU_PHOTO_SOURCE_MAX_BYTES) { toast.error("Fotoğraf en fazla 15 MB olabilir."); return; }
    setUploading(true); onBusyChange?.(true);
    try {
      const blob = await compressMenuPhoto(file);
      if (blob.size > MENU_PHOTO_MAX_BYTES) { toast.error("Fotoğraf çok büyük. En fazla 2 MB olabilir; lütfen daha küçük bir fotoğraf seçin."); return; }
      const form = new FormData();
      form.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      const { url } = await send({ data: form });
      onChange(url);
      toast.success("Fotoğraf yüklendi.");
    } catch {
      toast.error("Fotoğraf yüklenemedi, tekrar deneyin.");
    } finally {
      setUploading(false); onBusyChange?.(false);
      if (input.current) input.current.value = "";
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragging(false);
    void upload(e.dataTransfer.files?.[0]);
  }

  const pick = () => input.current?.click();

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Ürün fotoğrafı</p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${dragging ? "border-primary bg-primary/10" : "border-border"}`}
      >
        {value ? (
          <>
            <img src={menuImage(value)} alt="Ürün fotoğrafı" className="aspect-[4/3] w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-end p-3">
              <Button type="button" size="sm" variant="secondary" disabled={uploading} onClick={pick}>
                <RefreshCw />Fotoğrafı değiştir
              </Button>
            </div>
          </>
        ) : (
          <button type="button" onClick={pick} disabled={uploading} className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 bg-card px-6 text-center transition-colors hover:bg-secondary">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary"><ImagePlus className="size-7" /></span>
            <span className="text-base font-medium">Fotoğraf yükle</span>
            <span className="text-xs text-muted-foreground">Telefonunuzdan veya bilgisayarınızdan bir fotoğraf seçin</span>
          </button>
        )}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-overlay backdrop-blur-sm">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="text-sm">Yükleniyor...</span>
          </div>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" aria-label="Fotoğraf yükle" className="sr-only" onChange={(e) => void upload(e.target.files?.[0])} />
    </div>
  );
}

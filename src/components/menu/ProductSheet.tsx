import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Heart, X } from "lucide-react";

export type ProductDetail = { id: string; name: string; categoryName?: string | undefined; price: number; old?: number | undefined; img: string; desc: string };

const roundButton = "flex size-9 items-center justify-center rounded-full bg-overlay text-foreground backdrop-blur-md";

// Small popup over the menu itself: the guest stays on the same page.
export function ProductSheet({ item, fav, onToggleFav, onClose }: { item: ProductDetail | null; fav: boolean; onToggleFav: () => void; onClose: () => void }) {
  return (
    <DialogPrimitive.Root open={item !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-card p-2.5 shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-90"
        >
          {item && <>
            <div className="relative">
              <img src={item.img} alt={item.name} className="aspect-square w-full rounded-2xl object-cover" />
              <DialogPrimitive.Close aria-label="Kapat" className={`absolute left-2 top-2 ${roundButton}`}><X className="size-4" /></DialogPrimitive.Close>
              <button type="button" onClick={onToggleFav} aria-label="Favori" className={`absolute right-2 top-2 ${roundButton}`}><Heart className={`size-4 ${fav ? "fill-primary text-primary" : ""}`} /></button>
            </div>
            <div className="px-2 pb-2 pt-3">
              <DialogPrimitive.Title className="text-lg font-semibold">{item.name}</DialogPrimitive.Title>
              {item.desc && <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>}
              <p className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-semibold text-primary">{item.price} Birr</span>
                {item.old && <span className="text-xs text-muted-foreground line-through">{item.old} Birr</span>}
              </p>
            </div>
          </>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CheckCircle2, MessageSquareText, Send, X } from "lucide-react";
import { toast } from "sonner";
import { sendComment } from "@/lib/menu.functions";
import { commentSchema } from "@/lib/menu-schema";
import { Button } from "@/components/ui/button";

const field = "w-full rounded-2xl bg-input px-4 py-3 text-base outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring";

// Guests write to the café privately: comments are never shown on the menu.
export function CommentBox() {
  const send = useServerFn(sendComment);
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = new FormData(e.currentTarget);
    const parsed = commentSchema.safeParse({ author_name: "", message: values.get("message") ?? "" });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Lütfen yorumunuzu yazın."); return; }
    setBusy(true);
    try { await send({ data: parsed.data }); setSent(true); }
    catch { toast.error("Yorum gönderilemedi, lütfen tekrar deneyin."); }
    finally { setBusy(false); }
  }

  return <>
    <Button type="button" size="icon" aria-label="Yorum yaz" title="Yorum yaz" onClick={() => { setSent(false); setOpen(true); }}
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-30 size-11 rounded-full shadow-lg [&_svg]:size-5">
      <MessageSquareText />
    </Button>

    <DialogPrimitive.Root open={open} onOpenChange={(o) => { if (!busy) setOpen(o); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content aria-describedby={undefined} className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-card p-5 shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <DialogPrimitive.Close aria-label="Kapat" className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-secondary text-foreground"><X className="size-4" /></DialogPrimitive.Close>
          {sent ? <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto size-12 text-success" strokeWidth={1.5} />
            <DialogPrimitive.Title className="mt-3 text-lg font-semibold">Teşekkürler!</DialogPrimitive.Title>
            <p className="mt-1 text-sm text-muted-foreground">Yorumunuz işletmeye iletildi.</p>
            <DialogPrimitive.Close asChild><Button variant="secondary" className="mt-5">Kapat</Button></DialogPrimitive.Close>
          </div> : <form onSubmit={submit} className="space-y-3">
            <DialogPrimitive.Title className="pr-10 text-lg font-semibold">Yorum yaz</DialogPrimitive.Title>
            <p className="-mt-1 text-xs text-muted-foreground">Yorumunuzu yalnızca işletme görür.</p>
            <textarea name="message" aria-label="Yorumunuz" required maxLength={1000} rows={5} placeholder="Yorumunuzu yazın..." className={`${field} resize-none`} />
            <Button type="submit" disabled={busy} className="h-11 w-full">
              <Send className="size-4" />{busy ? "Gönderiliyor..." : "Gönder"}
            </Button>
          </form>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  </>;
}

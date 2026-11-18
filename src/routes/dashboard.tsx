import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Coffee, LayoutGrid, UtensilsCrossed, QrCode, Plus, Pencil, Trash2, Download, Copy, Search, Eye, EyeOff, Check, ImageOff, MessageSquareText, MailOpen, Mail, FerrisWheel } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Tables } from "@/integrations/supabase/types";
import { dashboardQuery, commentsQuery } from "@/lib/menu-queries";
import { saveItem, saveCategory, deleteEntry, setItemAvailability, markComment, deleteComment } from "@/lib/menu.functions";
import { itemSchema } from "@/lib/menu-schema";
import { menuImage } from "@/lib/menu-images";
import { PhotoUploader } from "@/components/menu/PhotoUploader";
import { WheelPanel } from "@/components/menu/WheelPanel";
import { publishedMenuUrl, resolvedGuestMenuUrl } from "@/lib/menu-url";

export const Route = createFileRoute("/dashboard")({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery),
  head: () => ({ meta: [
    { title: "Yönetim Paneli — Kahve Menüsü" }, { name: "description", content: "Kategorilerinizi, ürünlerinizi, fiyatlarınızı ve menü QR kodunuzu yönetin." },
    { property: "og:title", content: "Kahve Menüsü Yönetim Paneli" }, { property: "og:description", content: "Menü ve kategori yönetimi." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { name: "robots", content: "noindex" },
  ] }), component: Dashboard,
});

type Item = Tables<"menu_items">;
type Category = Tables<"menu_categories">;
type Tab = "items" | "categories" | "comments" | "wheel" | "qr";
const field = "w-full rounded-xl border border-border bg-input px-3.5 py-3 text-base outline-none transition focus:border-primary focus:ring-1 focus:ring-ring sm:text-sm";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-sm font-medium">{label}</span>{hint && <span className="ml-1.5 text-xs text-muted-foreground">{hint}</span>}{children}</label>;
}

function Dashboard() {
  const [menuUrl, setMenuUrl] = useState<string | null>(publishedMenuUrl);
  useEffect(() => { setMenuUrl(resolvedGuestMenuUrl(window.location.origin)); }, []);
  const { data } = useSuspenseQuery(dashboardQuery);
  const client = useQueryClient();
  const saveProduct = useServerFn(saveItem); const saveCat = useServerFn(saveCategory); const remove = useServerFn(deleteEntry); const setAvailability = useServerFn(setItemAvailability);
  const comments = useQuery({ ...commentsQuery, refetchInterval: 30000 });
  const markRead = useServerFn(markComment); const removeComment = useServerFn(deleteComment);
  const [toggling, setToggling] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("items");
  const [search, setSearch] = useState(""); const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [category, setCategory] = useState<Partial<Category> | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; kind: "item" | "category"; name: string } | null>(null);
  const [saving, setSaving] = useState(false); const [photoBusy, setPhotoBusy] = useState(false); const qr = useRef<HTMLDivElement>(null);

  async function refresh() { await client.invalidateQueries({ queryKey: ["dashboard"] }); await client.invalidateQueries({ queryKey: ["menu"] }); }
  async function submitItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!editing) return;
    const values = new FormData(e.currentTarget);
    const parsed = itemSchema.safeParse({ id: editing.id, name: values.get("name"), category_id: values.get("category_id"), description: values.get("description") ?? "", price: Number(values.get("price")), old_price: values.get("old_price") ? Number(values.get("old_price")) : null, image: editing.image ?? "", available: editing.available ?? true, position: Number(values.get("position") ?? 0) });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Alanları kontrol edin."); return; }
    setSaving(true);
    try { await saveProduct({ data: parsed.data }); await refresh(); setEditing(null); toast.success("Ürün kaydedildi."); } catch (err) { toast.error(err instanceof Error ? err.message : "Kaydedilemedi."); } finally { setSaving(false); }
  }
  async function submitCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!category) return;
    const values = new FormData(e.currentTarget); setSaving(true);
    try { await saveCat({ data: { id: category.id, name: String(values.get("name")), position: Number(values.get("position")) } }); await refresh(); setCategory(null); toast.success("Kategori kaydedildi."); } catch { toast.error("Kategori kaydedilemedi."); } finally { setSaving(false); }
  }
  async function confirmDelete() {
    if (!deleting) return; setSaving(true);
    try { await remove({ data: deleting }); await refresh(); setDeleting(null); toast.success("Silindi."); } catch (err) { toast.error(err instanceof Error ? err.message : "Silinemedi."); } finally { setSaving(false); }
  }
  async function toggleItem(item: Item, available: boolean) {
    setToggling(item.id);
    client.setQueryData(dashboardQuery.queryKey, (old) => old ? { ...old, items: old.items.map((i) => i.id === item.id ? { ...i, available } : i) } : old);
    try { await setAvailability({ data: { id: item.id, available } }); toast.success(available ? `${item.name} menüde gösteriliyor.` : `${item.name} gizlendi.`); }
    catch { toast.error("Ürün durumu değiştirilemedi."); }
    finally { await refresh(); setToggling(null); }
  }
  async function setRead(id: string, is_read: boolean) {
    client.setQueryData(commentsQuery.queryKey, (old) => old?.map((c) => c.id === id ? { ...c, is_read } : c));
    try { await markRead({ data: { id, is_read } }); } catch { toast.error("Yorum güncellenemedi."); }
    finally { await client.invalidateQueries({ queryKey: ["comments"] }); }
  }
  async function removeOne(id: string) {
    try { await removeComment({ data: { id } }); await client.invalidateQueries({ queryKey: ["comments"] }); toast.success("Yorum silindi."); } catch { toast.error("Yorum silinemedi."); }
  }
  function downloadQr() {
    const svg = qr.current?.querySelector("svg"); if (!svg) return;
    const exported = svg.cloneNode(true);
    if (!(exported instanceof SVGElement)) return;
    const colors = getComputedStyle(document.documentElement);
    exported.style.setProperty("--qr-background", colors.getPropertyValue("--qr-background"));
    exported.style.setProperty("--qr-foreground", colors.getPropertyValue("--qr-foreground"));
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(exported)], { type: "image/svg+xml" }));
    const link = document.createElement("a"); link.href = url; link.download = "kahve-menu-qr.svg"; link.click(); URL.revokeObjectURL(url);
  }

  const categoryName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? "";
  const hiddenCount = data.items.filter((i) => !i.available).length;
  const products = data.items.filter((i) => (filter === "hidden" ? !i.available : !filter || i.category_id === filter) && i.name.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")));
  const tabs: { id: Tab; label: string; icon: typeof Coffee; count?: number | undefined }[] = [
    { id: "items", label: "Ürünler", icon: UtensilsCrossed, count: data.items.length },
    { id: "categories", label: "Kategoriler", icon: LayoutGrid, count: data.categories.length },
    { id: "comments", label: "Yorumlar", icon: MessageSquareText, count: comments.data?.filter((c) => !c.is_read).length || undefined },
    { id: "wheel", label: "Çark", icon: FerrisWheel },
    { id: "qr", label: "QR kod", icon: QrCode },
  ];
  const newItem = () => setEditing({ available: true, image: "", category_id: filter || data.categories[0]?.id || "", position: data.items.length + 1 });

  return <main className="min-h-screen pb-16">
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Coffee className="size-5" /></div>
          <div><p className="font-semibold leading-tight">Kahve Menüsü</p><p className="text-xs text-muted-foreground">Yönetim paneli</p></div>
        </div>
        <Button variant="outline" size="sm" asChild><Link to="/menu"><Eye />Menüyü gör</Link></Button>
      </div>
      <nav className="mx-auto grid max-w-5xl grid-cols-5 gap-1 px-4 pb-3" aria-label="Panel bölümleri">
        {tabs.map((t) => <button key={t.id} type="button" onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined}
          className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-xs sm:flex-row sm:gap-2 sm:px-3 sm:py-2.5 sm:text-sm font-medium transition-colors ${tab === t.id ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
          <t.icon className="size-4 shrink-0" /><span className="whitespace-nowrap">{t.label}</span>
          {t.count !== undefined && <span className={`absolute right-1 top-1 rounded-full px-1.5 text-[10px] sm:static sm:text-xs ${tab === t.id ? "bg-primary-foreground/15" : "bg-secondary"}`}>{t.count}</span>}
        </button>)}
      </nav>
    </header>

    <section className="mx-auto max-w-5xl px-4 pt-6">
      {tab === "items" && <>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-2xl font-semibold">Ürünler</h1><p className="mt-1 text-sm text-muted-foreground">{data.items.filter((i) => i.available).length} ürün menüde görünüyor</p></div>
          <Button size="lg" className="rounded-xl px-5" disabled={!data.categories.length} onClick={newItem}><Plus />Yeni ürün ekle</Button>
        </div>
        {!data.categories.length && <div className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center"><p className="text-sm text-muted-foreground">Ürün eklemeden önce bir kategori oluşturun.</p><Button className="mt-4" variant="secondary" onClick={() => setTab("categories")}><Plus />Kategori ekle</Button></div>}
        <label className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card px-3.5"><Search className="size-4 text-muted-foreground" /><input aria-label="Ürün ara" placeholder="Ürün ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full min-w-0 bg-transparent py-3 text-base outline-none sm:text-sm" /></label>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4" role="group" aria-label="Kategori filtresi">
          {[{ id: "", name: "Tümü" }, ...data.categories].map((c) => <button key={c.id || "all"} type="button" onClick={() => setFilter(c.id)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${filter === c.id ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{c.name}</button>)}
          {hiddenCount > 0 && <button type="button" onClick={() => setFilter("hidden")}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm transition-colors ${filter === "hidden" ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
            <EyeOff className="size-3.5" />Gizli<span className="rounded-full bg-secondary px-1.5 text-xs">{hiddenCount}</span>
          </button>}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((i) => <article key={i.id} className="flex flex-col rounded-2xl border border-border bg-card p-3">
            <div className="flex gap-3">
              {i.image ? <img src={menuImage(i.image)} alt={i.name} className={`size-20 shrink-0 rounded-xl object-cover ${i.available ? "" : "opacity-50"}`} /> : <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground"><ImageOff className="size-5" /></div>}
              <div className="min-w-0 flex-1">
                <h2 className="break-words font-medium leading-snug">{i.name}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{categoryName(i.category_id)}</p>
                <p className="mt-1.5 font-semibold text-primary">{i.price} Birr {i.old_price && <span className="ml-1 text-xs font-normal text-muted-foreground line-through">{i.old_price} Birr</span>}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <label className={`mr-auto inline-flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-3 text-xs font-medium ${i.available ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground"}`}>
                <Switch aria-label={`${i.name} menüde göster`} checked={i.available} disabled={toggling === i.id} onCheckedChange={(available) => void toggleItem(i, available)} className="data-[state=checked]:bg-success data-[state=unchecked]:bg-muted-foreground/40" />
                {i.available ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}{i.available ? "Menüde" : "Gizli"}
              </label>
              <Button size="sm" variant="secondary" aria-label={`${i.name} düzenle`} onClick={() => setEditing(i)}><Pencil />Düzenle</Button>
              <Button size="sm" variant="ghost" aria-label={`${i.name} sil`} className="text-destructive hover:text-destructive" onClick={() => setDeleting({ id: i.id, kind: "item", name: i.name })}><Trash2 />Sil</Button>
            </div>
          </article>)}
        </div>
        {!products.length && data.categories.length > 0 && <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Ürün bulunamadı.</p>}
      </>}

      {tab === "categories" && <>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h1 className="text-2xl font-semibold">Kategoriler</h1><p className="mt-1 text-sm text-muted-foreground">Menüdeki bölümler, sıra numarasına göre dizilir</p></div>
          <Button size="lg" className="rounded-xl px-5" onClick={() => setCategory({ position: data.categories.length + 1 })}><Plus />Yeni kategori</Button>
        </div>
        <div className="mt-6 space-y-3">
          {data.categories.map((c) => <article key={c.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-semibold text-primary">{c.position}</span>
            <div className="min-w-0 flex-1"><h2 className="break-words font-medium">{c.name}</h2><p className="text-xs text-muted-foreground">{data.items.filter((i) => i.category_id === c.id).length} ürün</p></div>
            <Button size="sm" variant="secondary" aria-label={`${c.name} düzenle`} onClick={() => setCategory(c)}><Pencil />Düzenle</Button>
            <Button size="icon" variant="ghost" title="Kategoriyi sil" aria-label={`${c.name} sil`} className="text-destructive hover:text-destructive" onClick={() => setDeleting({ id: c.id, kind: "category", name: c.name })}><Trash2 /></Button>
          </article>)}
          {!data.categories.length && <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Henüz kategori yok.</p>}
        </div>
      </>}

      {tab === "comments" && <>
        <h1 className="text-2xl font-semibold">Yorumlar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Misafirlerin gönderdiği yorumlar. Bunları yalnızca siz görürsünüz.</p>
        <div className="mt-6 space-y-3">
          {comments.isLoading && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
          {comments.isError && <p className="text-sm text-destructive">Yorumlar yüklenemedi.</p>}
          {comments.data?.map((c) => <article key={c.id} className={`rounded-2xl border p-4 ${c.is_read ? "border-border bg-card/60" : "border-primary/40 bg-card"}`}>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {!c.is_read && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">Yeni</span>}
              <h2 className="font-medium">{c.author_name || "İsimsiz misafir"}</h2>
              <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">{c.message}</p>
            <div className="mt-3 flex gap-2 border-t border-border pt-3">
              <Button size="sm" variant="secondary" onClick={() => void setRead(c.id, !c.is_read)}>{c.is_read ? <><Mail />Okunmadı yap</> : <><MailOpen />Okundu</>}</Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => void removeOne(c.id)}><Trash2 />Sil</Button>
            </div>
          </article>)}
          {comments.data && !comments.data.length && <p className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Henüz yorum yok.</p>}
        </div>
      </>}

      {tab === "wheel" && <WheelPanel />}

      {tab === "qr" && <>
        <h1 className="text-2xl font-semibold">QR kod</h1>
        <p className="mt-1 text-sm text-muted-foreground">Misafirleriniz bu kodu okutarak menüyü telefonlarında açar</p>
        <div className="mt-6 grid items-start gap-6 md:grid-cols-[300px_1fr]">
          <div className="qr-paper rounded-2xl p-7 text-center">
            <Coffee className="mx-auto size-7" />
            <h2 className="mb-5 mt-3 text-xl font-medium">Kahve Menüsü</h2>
            <div ref={qr} className="mx-auto flex aspect-square w-full max-w-[232px] items-center justify-center">
              {menuUrl ? <QRCodeSVG value={menuUrl} size={232} marginSize={2} level="M" bgColor="var(--qr-background)" fgColor="var(--qr-foreground)" /> : <QrCode className="size-24 opacity-40" strokeWidth={1} />}
            </div>
            <p className="mt-5 text-sm">{menuUrl ? "Menü için okutun" : "QR kodu henüz hazır değil"}</p>
          </div>
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            {menuUrl ? <div><p className="mb-2 text-xs font-medium text-muted-foreground">MENÜ BAĞLANTISI</p><p className="break-all rounded-xl bg-secondary p-3 text-sm">{menuUrl}</p></div> : <p role="status" className="text-sm text-muted-foreground">QR kodu için sitenin yayınlanması gerekiyor.</p>}
            <div className="grid gap-2 sm:grid-cols-2">
              <Button size="lg" className="rounded-xl" disabled={!menuUrl} onClick={downloadQr}><Download />QR kodu indir</Button>
              <Button size="lg" className="rounded-xl" disabled={!menuUrl} variant="outline" onClick={async () => { if (!menuUrl) return; try { await navigator.clipboard.writeText(menuUrl); toast.success("Bağlantı kopyalandı."); } catch { toast.error("Bağlantı kopyalanamadı."); } }}><Copy />Bağlantıyı kopyala</Button>
            </div>
          </div>
        </div>
      </>}
    </section>

    <Dialog open={editing !== null} onOpenChange={(open) => { if (!open && !saving) setEditing(null); }}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-1.5rem)] overflow-y-auto rounded-2xl p-5">
        <DialogTitle className="text-xl">{editing?.id ? "Ürünü düzenle" : "Yeni ürün ekle"}</DialogTitle>
        <DialogDescription>Fotoğrafını yükleyin, adını ve fiyatını yazın.</DialogDescription>
        {editing && <form onSubmit={submitItem} className="space-y-4">
          <PhotoUploader value={editing.image ?? ""} onChange={(image) => setEditing((current) => current ? { ...current, image } : current)} onBusyChange={setPhotoBusy} />
          <Field label="Ürün adı"><input className={field} name="name" required maxLength={120} placeholder="Örn. Latte" defaultValue={editing.name} /></Field>
          <Field label="Kategori"><select className={field} name="category_id" defaultValue={editing.category_id ?? data.categories[0]?.id}>{data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fiyat (Birr)"><input className={field} type="number" inputMode="decimal" step="0.01" min="0" name="price" required placeholder="0" defaultValue={editing.price} /></Field>
            <Field label="Eski fiyat" hint="isteğe bağlı"><input className={field} type="number" inputMode="decimal" step="0.01" min="0" name="old_price" placeholder="İndirim için" defaultValue={editing.old_price ?? ""} /></Field>
          </div>
          <Field label="Açıklama" hint="isteğe bağlı"><textarea className={`${field} min-h-20`} name="description" maxLength={500} placeholder="Kısa bir açıklama yazın" defaultValue={editing.description} /></Field>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-secondary p-3.5">
            <div><p className="text-sm font-medium">Menüde göster</p><p className="text-xs text-muted-foreground">Kapalıysa misafirler bu ürünü görmez</p></div>
            <Switch aria-label="Menüde göster" checked={editing.available ?? true} onCheckedChange={(available) => setEditing((current) => current ? { ...current, available } : current)} />
          </div>
          <Field label="Menüdeki sırası"><input className={`${field} w-28`} type="number" min="0" name="position" defaultValue={editing.position ?? 0} /></Field>
          <Button size="lg" disabled={saving || photoBusy} className="w-full rounded-xl" type="submit"><Check />{saving ? "Kaydediliyor..." : photoBusy ? "Fotoğraf yükleniyor..." : "Kaydet"}</Button>
        </form>}
      </DialogContent>
    </Dialog>

    <Dialog open={category !== null} onOpenChange={(open) => { if (!open && !saving) setCategory(null); }}>
      <DialogContent className="w-[calc(100%-1.5rem)] rounded-2xl p-5">
        <DialogTitle className="text-xl">{category?.id ? "Kategoriyi düzenle" : "Yeni kategori"}</DialogTitle>
        <DialogDescription>Örneğin "Sıcak içecekler" veya "Tatlılar".</DialogDescription>
        {category && <form onSubmit={submitCategory} className="space-y-4">
          <Field label="Kategori adı"><input name="name" required maxLength={80} className={field} defaultValue={category.name} /></Field>
          <Field label="Menüdeki sırası"><input name="position" type="number" min="0" required className={`${field} w-28`} defaultValue={category.position} /></Field>
          <Button size="lg" disabled={saving} className="w-full rounded-xl" type="submit"><Check />Kaydet</Button>
        </form>}
      </DialogContent>
    </Dialog>

    <Dialog open={deleting !== null} onOpenChange={(open) => { if (!open && !saving) setDeleting(null); }}>
      <DialogContent className="w-[calc(100%-1.5rem)] rounded-2xl p-5">
        <DialogTitle>Silmek istiyor musunuz?</DialogTitle>
        <DialogDescription>"{deleting?.name}" kalıcı olarak silinecek.</DialogDescription>
        <div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setDeleting(null)} disabled={saving}>Vazgeç</Button><Button variant="destructive" onClick={confirmDelete} disabled={saving}><Trash2 />Sil</Button></div>
      </DialogContent>
    </Dialog>
  </main>;
}

# Morsel Meetup Menu Wheel

## Yayınlama

- **Lovable:** Projeyi **Publish → Publish changes** ile yayınlayın. `NITRO_PRESET` ayarlamayın; mevcut Lovable/Cloudflare ayarları kullanılır.
- **Vercel:** Git deposunu içe aktarın, Node.js 22 veya üstünü seçin ve aşağıdaki değişkenleri ekleyin. `vercel.json`, `NITRO_PRESET=vercel` ile derler. Nitro `.vercel/output` içinde hem statik dosyaları hem de sayfaları, sunucu fonksiyonlarını ve `/api/public/*` isteklerini karşılayan yönlendirmeleri üretir.
- **Netlify:** Git deposunu bağlayın ve aşağıdaki değişkenleri ekleyin. `netlify.toml`, `NITRO_PRESET=netlify` ile derler ve `dist` klasörünü yayımlar. Nitro, diğer istekleri `.netlify/functions-internal` içindeki sunucu fonksiyonuna yönlendirir.

Vercel ve Netlify için `.env.example` dosyasındaki şu değişkenleri ekleyin:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`: derleme sırasında kullanılmalı.
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: sunucu fonksiyonlarının çalışma ortamında bulunmalı. `SUPABASE_SERVICE_ROLE_KEY` gizlidir; `VITE_` önekiyle eklemeyin ve depoya yazmayın.

Lovable Cloud, yönetilen projenin servis anahtarını dışarı vermez. Harici yayında sunucu özelliklerinin tamamı için aynı şema, veriler ve depolama yapısıyla kendi yönettiğiniz bir arka uç ve ona ait anahtarlar gerekir. Bu ayarlar mevcut Lovable yayınını veya veritabanını değiştirmez. Menü logosunun göreli görsel yolu Lovable dışında sunulmazsa aynı dosyayı o adreste barındırın.

**Yayınlamadan önce:** `/dashboard` mevcut haliyle giriş istemez. Herkese açık bir yayın yaptığınızda yönetim erişimi de herkese açık kalır.

## Yerel geliştirme

Node.js 22.12 veya üstüyle:

```sh
bun install --frozen-lockfile
npm run dev
```

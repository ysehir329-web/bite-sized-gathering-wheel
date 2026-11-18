<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->
## Application architecture

- Use the existing Lovable Vite wrapper to select Nitro deployment targets; let each Nitro preset generate its server routing so SSR, server functions, and public APIs stay on the same handler.

- Keep menu management at `/dashboard`; menu item/category functions use the publishable key with menu-table RLS, while comments, wheel admin, prize codes and photo uploads go through `managementDb` (src/lib/admin-middleware.ts, service role) because their tables/storage are locked to anon. The panel has no sign-in yet: the future owner sign-in check belongs in that one middleware so every management function is gated at once.
- Keep the guest menu at `/` and filter out unavailable products in its server function; the QR code must target this public menu, never the management or sign-in page.
- Resolve QR destinations to the current public origin, with the verified deployment URL as the editor-preview fallback; this prevents printed codes from pointing to an editor sign-in wall.
- Project was imported from GitHub (morsel-meetup-wheel, itself from morsel-and-meetup-market); the menu data lives in Lovable Cloud tables menu_categories and menu_items.
- Uploaded product photos go through the uploadMenuPhoto server function (type, size and magic-byte checks, server-made name) into the private menu-photos storage bucket, which has no public read or write rule, and are served only through /api/public/menu-photo/$name with the server admin client (storage has no public read rule); the workspace blocks public buckets, and this keeps menu data small.
- Guest comments live in guest_comments; anon may only INSERT unread 1-1000 char messages, and only management functions read, mark or delete them (menu_reviews is locked and deprecated).
- Lucky wheel settings live in wheel_settings (no anon/authenticated read, so daily prize limits stay private) and are edited only in the /dashboard Çark tab; guests read display fields only via /api/public/wheel-config, which uses the server admin client, while /api/public/wheel-spin calls spin_wheel_guest() with the service role, using an httpOnly device cookie for the per-device daily limit, a loose per-IP hourly cap, and a one-time prize code stored in wheel_claims; the browser spin counter only drives button text.
<!-- AGENT-MEMORY:BEGIN -->
- Render the guest wheel inside the menu with shared design components and load its public settings when the menu mounts; avoiding an iframe removes an extra document load and preserves the app's appearance. Keep prize selection on the existing server endpoint.
<!-- AGENT-MEMORY:END -->

import { createFileRoute } from "@tanstack/react-router";
import { isMenuPhotoName, MENU_PHOTO_BUCKET } from "@/lib/menu-photo";

// Public on purpose: guests scanning the QR code must see product photos.
// Storage itself has no public read rule; this route serves only files from the
// menu photo bucket whose names match the generated upload format.
export const Route = createFileRoute("/api/public/menu-photo/$name")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!isMenuPhotoName(params.name)) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from(MENU_PHOTO_BUCKET).download(params.name);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, {
          headers: {
            "content-type": data.type || "image/jpeg",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});

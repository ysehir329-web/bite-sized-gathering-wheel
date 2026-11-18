import { createFileRoute } from "@tanstack/react-router";

// Public on purpose: the guest wheel reads its title, spin limit and prize list.
// wheel_settings is locked in the database (prize limits stay private), so this
// handler reads it with the server-only client and returns display fields only.
export const Route = createFileRoute("/api/public/wheel-config")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.from("wheel_settings").select("title, subtitle, max_spins, prizes").eq("id", 1).single();
        if (error || !data) return Response.json({ error: "unavailable" }, { status: 503 });
        const prizes = ((data.prizes ?? []) as { t: string; e: string; c: string; x?: boolean }[]).map(({ t, e, c, x }) => ({ t, e, c, x: !!x }));
        return Response.json({ title: data.title, subtitle: data.subtitle, max_spins: data.max_spins, prizes }, { headers: { "cache-control": "no-store" } });
      },
    },
  },
});

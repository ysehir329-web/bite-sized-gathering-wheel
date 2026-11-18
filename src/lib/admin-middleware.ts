import { createMiddleware } from "@tanstack/react-start";

/**
 * Every management server function that touches locked tables or storage goes through here.
 * The panel has no sign-in yet (Gmail sign-in comes later): add the signed-in owner check
 * at the top of this handler then, and every management function is protected at once.
 */
export const managementDb = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return next({ context: { db: supabaseAdmin } });
});

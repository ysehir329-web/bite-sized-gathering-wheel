import { createFileRoute } from "@tanstack/react-router";

// Public on purpose: any guest may spin. The server keeps a per-device cookie and
// the database enforces the daily spin limit, picks the prize and stores its code.
export const Route = createFileRoute("/api/public/wheel-spin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleWheelSpin } = await import("@/lib/wheel-spin.server");
        return handleWheelSpin(request);
      },
    },
  },
});

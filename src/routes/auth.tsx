import { createFileRoute, redirect } from "@tanstack/react-router";

// Preserve old management bookmarks without asking for credentials.
export const Route = createFileRoute("/auth")({
  beforeLoad: () => { throw redirect({ to: "/dashboard", replace: true }); },
});

import { createFileRoute, redirect } from "@tanstack/react-router";

// The app opens on management; guests reach the menu at /menu through the QR code.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kahve Menüsü — Yönetim" },
      { name: "description", content: "Menünüzü yönetin ve misafirleriniz için QR kodunu indirin." },
      { property: "og:title", content: "Kahve Menüsü Yönetimi" },
      { property: "og:description", content: "Menü yönetimi ve QR kod." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  beforeLoad: () => { throw redirect({ to: "/dashboard", replace: true }); },
});
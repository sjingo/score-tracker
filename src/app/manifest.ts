import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lions Score Tracker",
    short_name: "Lions",
    description: "Track scores and manage your Lions team",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f7faff",
    theme_color: "#0084d5",
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/lions-mobile.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Lions Score Tracker on mobile",
      },
      {
        src: "/screenshots/lions-wide.png",
        sizes: "1440x900",
        type: "image/png",
        form_factor: "wide",
        label: "Lions Score Tracker on desktop",
      },
    ],
  };
}

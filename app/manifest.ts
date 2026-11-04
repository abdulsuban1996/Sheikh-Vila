import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "শেখ ভিলা",
    short_name: "শেখ ভিলা",
    description: "পারিবারিক ম্যানেজমেন্ট",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    theme_color: "#064e3b",
    background_color: "#f1f5f9",
    lang: "bn",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

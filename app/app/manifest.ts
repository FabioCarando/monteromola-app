import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tenuta Monteromola",
    short_name: "Monteromola",
    description: "Workspace Tenuta Monteromola",
    start_url: "/",
    display: "standalone",
    background_color: "#FCFAF5",
    theme_color: "#6F2636",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

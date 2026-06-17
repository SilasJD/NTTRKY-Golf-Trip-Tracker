import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NTTRKY Golf Trip Tracker",
    short_name: "NTTRKY Golf",
    description: "Scorecards, leaderboard, skins, and awards for the NTTRKY Utah golf trip.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#15803d",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// Set base to "/" for Netlify/Cloudflare Pages. For GitHub Pages project sites,
// change to "/<repo-name>/".
export default defineConfig({
  base: "/fwc-sticker-tracker/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
      },
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "FWC Sticker Tracker",
        short_name: "Stickers",
        description: "Track FIFA World Cup sticker albums and speed up swapping.",
        theme_color: "#0b7d3b",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: "node",
  },
});

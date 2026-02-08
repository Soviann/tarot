import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Tarot Score Tracker",
        short_name: "Tarot",
        description: "Track scores for 5-player French Tarot",
        theme_color: "#1e3a5f",
        background_color: "#ffffff",
        display: "standalone",
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
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    origin: process.env.DDEV_PRIMARY_URL,
    hmr: {
      // HMR passes through Nginx reverse proxy on the main DDEV port
      host: process.env.DDEV_HOSTNAME,
      protocol: "wss",
      clientPort: 443,
    },
  },
});

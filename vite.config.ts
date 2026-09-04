import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@googlemaps/markerclusterer": path.resolve(
        import.meta.dirname,
        "./node_modules/@googlemaps/markerclusterer/dist/index.esm.mjs",
      ),
    },
  },
  ssr: {
    noExternal: ["@googlemaps/markerclusterer"],
  },
  define: {
    "process.env.GOOGLE_MAPS_PLATFORM_KEY": JSON.stringify(
      process.env.GOOGLE_MAPS_PLATFORM_KEY || "",
    ),
  },
  server: {
    hmr: {
      protocol: "wss",
      clientPort: 443,
    },
  },
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    tailwindcss(),
    react(),
  ],
});

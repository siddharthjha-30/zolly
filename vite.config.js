import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  appType: "spa",
  server: { host: true, port: 8080, strictPort: true, allowedHosts: true },
  preview: { host: true, port: 8080, strictPort: true, allowedHosts: true },
  build: { outDir: "dist", emptyOutDir: true },
});

import { defineConfig } from "vite";

export default defineConfig({
  root: "src/frontend",
  publicDir: "../../public",
  build: {
    outDir: "../../dist/frontend",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8787",
    },
  },
});

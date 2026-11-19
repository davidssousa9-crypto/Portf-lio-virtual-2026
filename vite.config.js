import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  appType: "mpa",
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true
  },
  build: {
    target: "es2020",
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), "index.html"),
        conhecimento: resolve(process.cwd(), "conhecimento/index.html")
      }
    }
  }
});

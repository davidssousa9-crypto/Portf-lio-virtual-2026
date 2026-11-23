import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  appType: "mpa",
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    open: "/",
    hmr: true,
    watch: {
      ignored: ["**/node_modules/**", "**/.git/**", "**/test-results/**"]
    }
  },
  build: {
    target: "es2020",
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), "index.html"),
        areas: resolve(process.cwd(), "areas-de-conhecimento.html"),
        linguagens: resolve(process.cwd(), "areas/linguagens/index.html"),
        natureza: resolve(process.cwd(), "areas/natureza/index.html"),
        matematica: resolve(process.cwd(), "areas/matematica/index.html"),
        humanas: resolve(process.cwd(), "areas/humanas/index.html"),
        senai: resolve(process.cwd(), "areas/senai/index.html"),
        curriculo: resolve(process.cwd(), "curriculo.html"),
        anexos: resolve(process.cwd(), "anexos.html"),
        ppe: resolve(process.cwd(), "ppe.html")
      }
    }
  }
});

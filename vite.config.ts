import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "ui",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "ui/index.html"),
    },
  },
  server: {
    port: 3000,
  },
});

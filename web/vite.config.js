import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// base: "./" => rutas relativas, para que funcione en la raíz del dominio
// o en cualquier subcarpeta de cPanel sin reconfigurar nada.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        explorer: resolve(__dirname, "explorer.html"),
      },
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" => rutas relativas, para que funcione en la raíz del dominio
// o en cualquier subcarpeta de cPanel sin reconfigurar nada.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});

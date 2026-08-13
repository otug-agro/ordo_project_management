import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Caminhos relativos permitem publicar em qualquer endereço
  // usuario.github.io/nome-do-repositorio/ sem alterar o código.
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});

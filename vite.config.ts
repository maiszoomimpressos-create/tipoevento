import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import basicSsl from "@vitejs/plugin-basic-ssl"; // Importar o plugin basicSsl
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    https: true, // Habilitar HTTPS
  },
  plugins: [dyadComponentTagger(), react(), basicSsl()], // Adicionar o plugin basicSsl
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

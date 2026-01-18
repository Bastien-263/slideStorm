import path from "node:path";
import react from "@vitejs/plugin-react";
import { skybridge } from "skybridge/web";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [skybridge(), react()],
  root: __dirname,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/_proxy': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});

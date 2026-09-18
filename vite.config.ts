import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import glsl from "vite-plugin-glsl";
import path from "path";
import { readFileSync } from "node:fs";

/** One source for the version: package.json, read at build time. */
const { version } = JSON.parse(readFileSync("./package.json", "utf8"));

export default defineConfig({
  plugins: [react(), tailwindcss(), glsl()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

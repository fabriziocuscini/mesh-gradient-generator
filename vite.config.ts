import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import glsl from "vite-plugin-glsl";
import path from "path";
import { readFileSync } from "node:fs";

/** One source for the version: package.json, read at build time. */
const packageJsonPath = path.resolve(__dirname, "./package.json");
const { version } = JSON.parse(readFileSync(packageJsonPath, "utf8"));

/**
 * The version reaches the app as a define, so it is fixed when the config
 * loads. A dev server left running across a version bump went on serving the
 * old number while production showed the new one. Watching package.json and
 * restarting on a change keeps the two in step.
 */
function restartOnVersionChange(): Plugin {
  return {
    name: "restart-on-version-change",
    configureServer(server) {
      server.watcher.add(packageJsonPath);
      server.watcher.on("change", (file) => {
        if (path.resolve(file) === packageJsonPath) server.restart();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), glsl(), restartOnVersionChange()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

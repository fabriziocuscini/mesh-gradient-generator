import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  globalCss: {
    "html, body": {
      margin: 0,
      padding: 0,
      bg: "gray.50",
      color: "gray.900",
      fontFamily: "system-ui, -apple-system, sans-serif",
      minHeight: "100vh",
    },
    "#root": {
      minHeight: "100vh",
    },
  },
});

export const system = createSystem(defaultConfig, config);

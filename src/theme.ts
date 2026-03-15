import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        ultramarine: {
          50: { value: "#FAF9FF" },
          100: { value: "#EDEDFF" },
          200: { value: "#D2D4FF" },
          300: { value: "#B1B9FF" },
          400: { value: "#889AFE" },
          500: { value: "#4166F5" },
          600: { value: "#0B47A4" },
          700: { value: "#00346C" },
          800: { value: "#002344" },
          900: { value: "#001326" },
          950: { value: "#000C1A" },
        },
      },
    },
    semanticTokens: {
      colors: {
        ultramarine: {
          contrast: {
            value: { _light: "white", _dark: "white" },
          },
          fg: {
            value: {
              _light: "{colors.ultramarine.700}",
              _dark: "{colors.ultramarine.300}",
            },
          },
          subtle: {
            value: {
              _light: "{colors.ultramarine.100}",
              _dark: "{colors.ultramarine.900}",
            },
          },
          muted: {
            value: {
              _light: "{colors.ultramarine.200}",
              _dark: "{colors.ultramarine.800}",
            },
          },
          emphasized: {
            value: {
              _light: "{colors.ultramarine.300}",
              _dark: "{colors.ultramarine.700}",
            },
          },
          solid: {
            value: {
              _light: "{colors.ultramarine.500}",
              _dark: "{colors.ultramarine.600}",
            },
          },
          focusRing: {
            value: {
              _light: "{colors.ultramarine.500}",
              _dark: "{colors.ultramarine.500}",
            },
          },
          border: {
            value: {
              _light: "{colors.ultramarine.300}",
              _dark: "{colors.ultramarine.700}",
            },
          },
        },
      },
    },
  },
  globalCss: {
    "html, body": {
      bg: "bg",
      color: "fg",
      fontFamily: "system-ui, -apple-system, sans-serif",
      minHeight: "100vh",
    },
    "#root": {
      minHeight: "100vh",
    },
    "*::-webkit-scrollbar": {
      width: "6px",
    },
    "*::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "*::-webkit-scrollbar-thumb": {
      background: "var(--chakra-colors-border)",
      borderRadius: "3px",
    },
    "*::-webkit-scrollbar-thumb:hover": {
      background: "var(--chakra-colors-fg-subtle)",
    },
    ".react-colorful": {
      width: "100% !important",
      height: "160px !important",
    },
    ".react-colorful__saturation": {
      borderRadius: "8px 8px 0 0 !important",
    },
    ".react-colorful__hue": {
      borderRadius: "0 0 8px 8px !important",
      height: "12px !important",
    },
    ".react-colorful__saturation-pointer, .react-colorful__hue-pointer": {
      width: "16px !important",
      height: "16px !important",
    },
  },
});

export const system = createSystem(defaultConfig, config);

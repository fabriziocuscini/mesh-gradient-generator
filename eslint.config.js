import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // Vendored from FigUI. Two of its files trip rules that are correct for our
    // own code: button.tsx exports `buttonVariants` (a cva() call, which
    // allowConstantExport does not cover) and color-chit.tsx has an empty catch.
    files: ["src/components/ui/**"],
    rules: {
      "react-refresh/only-export-components": "off",
      "no-empty": "off",
    },
  },
  prettier,
]);

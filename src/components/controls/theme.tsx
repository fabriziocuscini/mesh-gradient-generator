import { ThemeProvider as NextThemeProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "./Tooltip";

/**
 * The single place that touches next-themes. Keeping it to one module is what
 * would make a Figma plugin port cheap: a plugin iframe is null-origin and has
 * no localStorage, so next-themes would have to be swapped for an observer on
 * <html class="figma-dark"> — which this file already matches, since the dark
 * variant in figui.css lists that selector too.
 */
export function ThemeProvider(props: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
      {...props}
    />
  );
}

export type ColorMode = "light" | "dark";

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeToggle() {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme();
  const colorMode = (forcedTheme || resolvedTheme) as ColorMode | undefined;
  return {
    colorMode,
    // Reads resolvedTheme, not theme: from "system" the updater form would be
    // handed "system" and flip to the wrong side on the first press.
    toggle: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
  };
}

export function ThemeToggleButton() {
  // next-themes leaves colorMode undefined until it has read the document,
  // which is the signal itself — no mounted flag needed. Rendering the wrong
  // icon for a frame is worse than briefly rendering none.
  const { colorMode, toggle } = useThemeToggle();

  return (
    <Tooltip content="Toggle color mode (D)">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle color mode"
        onClick={toggle}
      >
        {colorMode === undefined ? (
          <span className="size-4" />
        ) : colorMode === "dark" ? (
          <Moon className="size-4" strokeWidth={1.5} />
        ) : (
          <Sun className="size-4" strokeWidth={1.5} />
        )}
      </Button>
    </Tooltip>
  );
}

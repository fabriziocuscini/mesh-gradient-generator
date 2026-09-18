import { ThemeProvider as NextThemeProvider, useTheme } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { flushSync } from "react-dom";
import { Monitor, Moon, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/components/ui/segmented-control";
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
      // The system setting is the starting point. A choice in the control
      // below overrides it and is what localStorage then holds.
      defaultTheme="system"
      disableTransitionOnChange
      {...props}
    />
  );
}

export type ColorMode = "light" | "dark";

/** What the user picked, which is not the same as the colour on screen. */
export type ThemeChoice = "system" | ColorMode;

const CHOICES: { value: ThemeChoice; icon: LucideIcon; label: string }[] = [
  { value: "system", icon: Monitor, label: "Match system" },
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
];

/**
 * Runs the theme change inside a view transition, which crossfades the old
 * screen into the new one. `flushSync` is what makes that work: the browser
 * takes its "after" snapshot as soon as the callback returns, so the class on
 * <html> has to be on the document by then, not on the next render.
 *
 * Browsers without the API, and anyone who asked for less motion, get the
 * change straight away.
 */
function crossfade(apply: () => void) {
  const start = document.startViewTransition?.bind(document);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!start || reduced) {
    apply();
    return;
  }

  start(() => flushSync(apply));
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeToggle() {
  const { resolvedTheme, setTheme, forcedTheme } = useTheme();
  const colorMode = (forcedTheme || resolvedTheme) as ColorMode | undefined;
  return {
    colorMode,
    // Reads resolvedTheme, not theme: from "system" the updater form would be
    // handed "system" and flip to the wrong side on the first press.
    toggle: () =>
      crossfade(() => setTheme(resolvedTheme === "dark" ? "light" : "dark")),
  };
}

export function ThemeModeControl() {
  const { theme, setTheme } = useTheme();

  // next-themes leaves the choice undefined until it has read the document,
  // which is the signal itself — no mounted flag needed. The placeholder holds
  // the width so the header does not jump when the real control arrives.
  if (theme === undefined) return <div className="h-6 w-24" />;

  return (
    <SegmentedControl
      value={theme}
      onValueChange={(value) => crossfade(() => setTheme(value as ThemeChoice))}
      aria-label="Color mode"
    >
      {CHOICES.map(({ value, icon: Icon, label }) => (
        <Tooltip key={value} content={label}>
          <SegmentedControlItem value={value} aria-label={label}>
            <Icon className="size-4" strokeWidth={1.5} />
          </SegmentedControlItem>
        </Tooltip>
      ))}
    </SegmentedControl>
  );
}

import type { ReactElement, ReactNode } from "react";
import {
  TooltipContent,
  TooltipRoot,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TooltipProps {
  /** Must be a single element: Base UI renders the trigger as this node. */
  children: ReactElement;
  content: ReactNode;
  /** Renders `children` bare, for triggers that are conditionally unlabelled. */
  disabled?: boolean;
}

/**
 * Timing is not set here. Base UI keeps `delay`/`closeDelay` on the provider,
 * and FigUI's own `Tooltip` export wraps every root in a private provider with
 * `delay={0}`, so this uses `TooltipRoot` under the single app-level provider
 * in main.tsx instead.
 */
export function Tooltip({ children, content, disabled }: TooltipProps) {
  if (disabled) return children;

  return (
    <TooltipRoot>
      <TooltipTrigger render={children} />
      <TooltipContent>{content}</TooltipContent>
    </TooltipRoot>
  );
}

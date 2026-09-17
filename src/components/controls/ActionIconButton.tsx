import type { ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "./Tooltip";

type ActionIconButtonProps = Omit<
  ComponentProps<typeof Button>,
  "children" | "size"
> & {
  icon: LucideIcon;
  label: string;
  /**
   * Keyboard shortcut for this action — "P", or "Shift+Space" for a chord.
   * It reaches the tooltip only: the aria-label stays the plain action,
   * since a screen reader announcing "Randomize palette R" helps nobody.
   */
  shortcut?: string;
  onClick: () => void;
};

/**
 * The tooltip surface is grey-900 in both colour modes, the way Figma's is, so
 * a light wash is what reads on it either way.
 */
function ShortcutKeys({ shortcut }: { shortcut: string }) {
  return shortcut.split("+").map((key) => (
    <kbd
      key={key}
      className="rounded-sm bg-white-200 px-1 font-[inherit] text-[0.9em] leading-[1.2]"
    >
      {key}
    </kbd>
  ));
}

export function ActionIconButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
  variant = "ghost",
  ...rest
}: ActionIconButtonProps) {
  return (
    <Tooltip
      content={
        shortcut ? (
          <span className="flex items-center gap-1">
            <span>{label}</span>
            <ShortcutKeys shortcut={shortcut} />
          </span>
        ) : (
          label
        )
      }
    >
      <Button
        aria-label={label}
        variant={variant}
        size="icon"
        onClick={onClick}
        {...rest}
      >
        <Icon className="size-3" />
      </Button>
    </Tooltip>
  );
}

import { Popover as BasePopover } from "@base-ui/react/popover";
import { cn } from "@/lib/utils";

/**
 * Not part of the FigUI registry, which ships no popover. Styled as a Figma
 * floating panel: unlike Figma's dropdown menus (always dark, which is why the
 * vendored SelectContent hardcodes grey-900), Figma's colour picker and other
 * popovers follow the theme.
 */
const Popover = BasePopover.Root;
const PopoverTrigger = BasePopover.Trigger;
const PopoverClose = BasePopover.Close;

function PopoverContent({
  className,
  children,
  initialFocus,
  side = "bottom",
  align = "start",
  sideOffset = 4,
  ...props
}: BasePopover.Positioner.Props &
  Pick<BasePopover.Popup.Props, "initialFocus">) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        {...props}
      >
        <BasePopover.Popup
          initialFocus={initialFocus}
          className={cn(
            "rounded-lg bg-white-1000 p-3 shadow-400 outline-none",
            "inset-ring inset-ring-black-100",
            "dark:bg-grey-800 dark:inset-ring-white-200",
            className,
          )}
        >
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

export { Popover, PopoverTrigger, PopoverClose, PopoverContent };

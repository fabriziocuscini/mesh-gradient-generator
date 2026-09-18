import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { cn } from "@/lib/utils";

/**
 * Not part of the FigUI registry, which ships no collapsible. Written against
 * Base UI to match the rest of the vendored primitives, since Figma's own
 * right-hand panel is built from collapsible sections.
 */
function Collapsible({ ...props }: BaseCollapsible.Root.Props) {
  return <BaseCollapsible.Root {...props} />;
}

function CollapsibleTrigger({
  className,
  ...props
}: BaseCollapsible.Trigger.Props) {
  return (
    <BaseCollapsible.Trigger
      className={cn(
        "flex h-8 w-full cursor-default items-center gap-1 rounded-sm outline-none",
        "focus-visible:inset-ring focus-visible:inset-ring-blue-500",
        className,
      )}
      {...props}
    />
  );
}

function CollapsiblePanel({
  className,
  ...props
}: BaseCollapsible.Panel.Props) {
  return (
    <BaseCollapsible.Panel
      className={cn(
        "overflow-hidden",
        // Base UI measures the panel and exposes its height as a custom
        // property, which is the only way to transition from/to `auto`.
        "h-(--collapsible-panel-height)",
        "motion-safe:transition-[height] motion-safe:duration-150 motion-safe:ease-out",
        "data-[ending-style]:h-0 data-[starting-style]:h-0",
        className,
      )}
      {...props}
    />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsiblePanel };

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface PanelSectionProps {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rendered on the right of the header, outside the trigger so a click on
   *  one of these does not also collapse the section. */
  actions?: ReactNode;
  children: ReactNode;
}

export function PanelSection({
  title,
  open,
  onOpenChange,
  actions,
  children,
}: PanelSectionProps) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      // Closed, the header is the whole section, so it needs the same 8px
      // below as above. Open, the panel's own pb-4 closes the section off.
      className={cn("pt-2", !open && "pb-2")}
    >
      <div className="flex h-8 items-center justify-between gap-1 px-4">
        <CollapsibleTrigger
          className={cn(
            "group -ml-1 flex min-w-0 flex-1 items-center gap-0.5 pl-1",
            open
              ? "text-black-800 dark:text-white-1000"
              : "text-black-500 dark:text-white-500",
          )}
        >
          <ChevronRight className="size-3 shrink-0 text-black-500 transition-transform duration-150 group-data-panel-open:rotate-90 dark:text-white-500" />
          <span className="typography-body-medium-strong truncate">
            {title}
          </span>
        </CollapsibleTrigger>
        {actions && (
          <div className="flex shrink-0 items-center gap-0.5">{actions}</div>
        )}
      </div>
      <CollapsiblePanel>
        <div className="flex flex-col gap-3 px-4 pt-0.5 pb-4">{children}</div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

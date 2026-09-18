import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Not part of the FigUI registry, which ships no dialog. Base UI's Popup
 * centres itself, so there is no positioner part.
 */
const Dialog = BaseDialog.Root;
const DialogTrigger = BaseDialog.Trigger;
const DialogTitle = BaseDialog.Title;

function DialogPopup({
  className,
  children,
  ...props
}: BaseDialog.Popup.Props) {
  return (
    <BaseDialog.Portal>
      {/* Base UI holds the parts mounted until their transition ends, so the
          same classes cover the way in and the way out. data-starting-style is
          the frame before opening, data-ending-style the one while closing.
          Both parts move together: holding the dialog back until the backdrop
          had finished dimming reads as a hang, not as staging. */}
      <BaseDialog.Backdrop
        className={cn(
          "fixed inset-0 bg-black-500",
          "transition-opacity duration-200 ease-out",
          "data-ending-style:opacity-0 data-starting-style:opacity-0",
          "motion-reduce:transition-none",
        )}
      />
      <BaseDialog.Popup
        className={cn(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "flex flex-col rounded-lg bg-white-1000 shadow-500 outline-none",
          "inset-ring inset-ring-black-100",
          "dark:bg-grey-800 dark:inset-ring-white-200",
          // Rises 8px and grows the last 4%, so it arrives rather than
          // appears. Tailwind v4 writes translate and scale as their own CSS
          // properties, so the centring translate above survives untouched.
          "transition-[opacity,scale,translate] duration-200 ease-out",
          "data-starting-style:translate-y-[calc(-50%+8px)] data-starting-style:scale-96 data-starting-style:opacity-0",
          "data-ending-style:translate-y-[calc(-50%+8px)] data-ending-style:scale-96 data-ending-style:opacity-0",
          "motion-reduce:transition-none",
          className,
        )}
        {...props}
      >
        {children}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

function DialogClose({ className, ...props }: BaseDialog.Close.Props) {
  return (
    <BaseDialog.Close
      render={
        <Button variant="ghost" size="icon" aria-label="Close">
          <X className="size-3" />
        </Button>
      }
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  );
}

export { Dialog, DialogTrigger, DialogTitle, DialogPopup, DialogClose };

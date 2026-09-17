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
      <BaseDialog.Backdrop className="fixed inset-0 bg-black-400" />
      <BaseDialog.Popup
        className={cn(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          "flex flex-col rounded-lg bg-white-1000 shadow-500 outline-none",
          "inset-ring inset-ring-black-100",
          "dark:bg-grey-800 dark:inset-ring-white-200",
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
          <X />
        </Button>
      }
      className={cn("absolute top-2 right-2", className)}
      {...props}
    />
  );
}

export { Dialog, DialogTrigger, DialogTitle, DialogPopup, DialogClose };

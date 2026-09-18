/* FIGUI PATCH - upstream's disabled state is a hard-coded opacity-50. It now
   reads the app's opacity-disabled token, so every disabled control in the app
   fades by the same amount. Re-apply on upgrade. */
import { Input as BaseInput } from "@base-ui/react";
import { cn } from "@/lib/utils";

const INPUT_BASE_CLASS =
  "placeholder:text-grey-400 text-black-800 bg-grey-100 typography-body-medium hover:ring-grey-200 dark:placeholder:text-grey-400 dark:bg-grey-700 dark:text-white-1000 dark:hover:ring-grey-600 flex h-6 w-full min-w-0 items-center rounded-md px-2 ring ring-transparent outline-none selection:bg-blue-500 focus:ring-blue-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-disabled aria-invalid:border-red-500 aria-invalid:ring-red-500/20 dark:focus:ring-blue-500";

function TextInput({ className, ...props }: BaseInput.Props) {
  return (
    <BaseInput
      {...props}
      data-slot="input"
      className={cn(INPUT_BASE_CLASS, className)}
    />
  );
}

export { TextInput, INPUT_BASE_CLASS };

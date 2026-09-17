import { type Ref } from "react";
import { GripVertical, Minus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ColorChit,
  ColorInput,
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input";
import { PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

interface ColorRowProps {
  hex: string;
  onChange: (hex: string) => void;
  onRemove?: () => void;
  removable?: boolean;
  active?: boolean;
  handleRef?: Ref<HTMLButtonElement>;
}

/**
 * Figma's colour row: a chit that opens the picker, then the hex as a field you
 * can type into rather than a label you have to open a popover to edit.
 */
export function ColorRow({
  hex: rawHex,
  onChange,
  onRemove,
  removable = true,
  active = false,
  handleRef,
}: ColorRowProps) {
  const hex = HEX_RE.test(rawHex) ? rawHex : "#000000";
  const value = hex.slice(1).toUpperCase();

  return (
    <div className="group relative flex h-6 items-center gap-1">
      {/* Sits outside the row, revealed on hover, and is a plain button so
          dnd-kit's callback ref lands on a real DOM node. */}
      <button
        ref={handleRef}
        type="button"
        aria-label="Drag to reorder"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "absolute -left-5 size-4 cursor-grab text-black-400 opacity-0 transition-opacity",
          "group-hover:opacity-100 active:cursor-grabbing dark:text-white-400",
        )}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-3" />
      </button>

      <InputGroup className="min-w-0 flex-1">
        <InputGroupAddon>
          <PopoverTrigger
            aria-label="Edit colour"
            className="flex size-6 cursor-default items-center justify-center rounded-sm outline-none focus-visible:inset-ring focus-visible:inset-ring-blue-500"
          >
            <ColorChit color={hex} />
          </PopoverTrigger>
        </InputGroupAddon>
        <ColorInput
          aria-label="Hex colour"
          value={value}
          onValueChange={(next) => {
            // chroma-js normalises 3- and 8-digit input too, but the store only
            // accepts 6, so drop any alpha rather than letting the field show a
            // value the gradient silently ignores.
            const six = next.slice(0, 6);
            if (/^[0-9a-fA-F]{6}$/.test(six)) onChange(`#${six.toLowerCase()}`);
          }}
          onCopy={(e) => {
            e.preventDefault();
            const selected = window.getSelection()?.toString() ?? value;
            e.clipboardData.setData("text/plain", `#${selected}`);
          }}
        />
      </InputGroup>

      {removable && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Remove color"
          className={cn(
            "size-6 shrink-0 text-black-500 opacity-0 transition-opacity dark:text-white-500",
            "group-hover:opacity-100",
            active && "opacity-100",
          )}
          onClick={onRemove}
        >
          <Minus className="size-3" />
        </Button>
      )}
    </div>
  );
}

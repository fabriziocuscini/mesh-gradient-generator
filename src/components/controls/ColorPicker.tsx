import { type Ref, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import {
  ColorChit,
  ColorInput,
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { ColorRow } from "./ColorRow";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

interface ColorPickerProps {
  hex: string;
  onChange: (hex: string) => void;
  onRemove?: () => void;
  removable?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dragHandleRef?: Ref<HTMLButtonElement>;
}

export function ColorPicker({
  hex,
  onChange,
  onRemove,
  removable = true,
  open,
  onOpenChange,
  dragHandleRef,
}: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const safeHex = HEX_RE.test(hex) ? hex : "#000000";
  const value = safeHex.slice(1).toUpperCase();

  const commit = (next: string) => {
    const six = next.slice(0, 6);
    if (/^[0-9a-fA-F]{6}$/.test(six)) onChange(`#${six.toLowerCase()}`);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => onOpenChange?.(isOpen)}
      // Base UI moves focus itself, which is what retires the 80ms timer the
      // Chakra version needed to outlast its popover mount. It does not select,
      // though, and typing over the old hex is the point.
      onOpenChangeComplete={(isOpen) => {
        if (isOpen) inputRef.current?.select();
      }}
    >
      <ColorRow
        hex={safeHex}
        onChange={onChange}
        onRemove={onRemove}
        removable={removable}
        handleRef={dragHandleRef}
      />
      <PopoverContent
        className="flex w-[232px] flex-col gap-2"
        initialFocus={inputRef}
      >
        <HexColorPicker color={safeHex} onChange={onChange} />
        <InputGroup>
          <InputGroupAddon>
            <ColorChit color={safeHex} />
          </InputGroupAddon>
          <ColorInput
            ref={inputRef}
            aria-label="Hex colour"
            value={value}
            onValueChange={commit}
            onCopy={(e) => {
              e.preventDefault();
              const selected = window.getSelection()?.toString() ?? value;
              e.clipboardData.setData("text/plain", `#${selected}`);
            }}
          />
        </InputGroup>
      </PopoverContent>
    </Popover>
  );
}

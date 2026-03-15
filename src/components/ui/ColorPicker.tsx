import { type Ref, useCallback, useEffect, useRef, useState } from "react";
import { Box, Input, InputGroup, Popover, Portal } from "@chakra-ui/react";
import { HexColorPicker } from "react-colorful";
import { ColorSwatch } from "./ColorSwatch";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function normalizeHex(raw: string): string | null {
  let v = raw.trim();
  if (!v.startsWith("#")) v = "#" + v;
  v = v.slice(0, 7);
  return HEX_RE.test(v) ? v.toLowerCase() : null;
}

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
  const [draft, setDraft] = useState(hex.replace("#", "").toUpperCase());

  useEffect(() => {
    setDraft(hex.replace("#", "").toUpperCase());
  }, [hex]);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 80);
      return () => clearTimeout(id);
    }
  }, [open]);

  const commit = useCallback(() => {
    const parsed = normalizeHex(draft);
    if (parsed) {
      onChange(parsed);
    } else {
      setDraft(hex.replace("#", "").toUpperCase());
    }
  }, [draft, hex, onChange]);

  return (
    <Popover.Root
      positioning={{ placement: "bottom-start" }}
      open={open}
      onOpenChange={(e) => onOpenChange?.(e.open)}
    >
      <Popover.Trigger asChild>
        <Box cursor="pointer">
          <ColorSwatch
            hex={hex}
            onRemove={onRemove}
            removable={removable}
            active={open}
            handleRef={dragHandleRef}
          />
        </Box>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content width="220px" p="3" borderRadius="xl" shadow="lg">
            <Popover.Body p="0" display="flex" flexDirection="column" gap="3">
              <HexColorPicker color={hex} onChange={onChange} />
              <InputGroup
                startElement="#"
                endElement={
                  <Box
                    width="4"
                    height="4"
                    borderRadius="sm"
                    bg={HEX_RE.test("#" + draft) ? "#" + draft : hex}
                    flexShrink={0}
                    border="1px solid"
                    borderColor="border"
                  />
                }
              >
                <Input
                  ref={inputRef}
                  size="xs"
                  variant="subtle"
                  fontFamily="mono"
                  textTransform="uppercase"
                  value={draft}
                  onChange={(e) =>
                    setDraft(
                      e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6),
                    )
                  }
                  onCopy={(e) => {
                    e.preventDefault();
                    const sel = window.getSelection()?.toString() ?? draft;
                    e.clipboardData.setData("text/plain", "#" + sel);
                  }}
                  onBlur={commit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit();
                  }}
                />
              </InputGroup>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

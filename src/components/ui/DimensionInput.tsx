import { useState, useMemo } from "react";
import {
  Stack,
  Input,
  InputGroup,
  Portal,
  createListCollection,
} from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";

interface FormatOption {
  label: string;
  value: string;
}

interface DimensionInputProps {
  widthValue: number;
  heightValue: number;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  formatValue?: string;
  formatOptions?: FormatOption[];
  onFormatChange?: (value: string) => void;
}

function parseDimension(raw: string): number | null {
  const n = parseInt(raw, 10);
  if (isNaN(n) || raw.trim() === "") return null;
  return Math.max(100, Math.min(n, 7680));
}

function digitsOnly(e: React.KeyboardEvent) {
  if (e.key.length === 1 && !/\d/.test(e.key)) {
    e.preventDefault();
  }
}

function useDimensionField(value: number, onChange: (v: number) => void) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  const displayed = focused ? draft : String(value);

  const handleFocus = () => {
    setDraft(String(value));
    setFocused(true);
  };

  const commit = () => {
    const parsed = parseDimension(draft);
    if (parsed !== null) onChange(parsed);
    setDraft(String(parsed ?? value));
    setFocused(false);
  };

  return { displayed, setDraft, handleFocus, commit };
}

export function DimensionInput({
  widthValue,
  heightValue,
  onWidthChange,
  onHeightChange,
  formatValue,
  formatOptions,
  onFormatChange,
}: DimensionInputProps) {
  const w = useDimensionField(widthValue, onWidthChange);
  const h = useDimensionField(heightValue, onHeightChange);

  const collection = useMemo(
    () =>
      formatOptions
        ? createListCollection({ items: formatOptions })
        : undefined,
    [formatOptions],
  );

  return (
    <Stack direction={{ base: "column", lg: "row" }} gap="3" width="full">
      <InputGroup flex="1" startElement="W">
        <Input
          size="xs"
          variant="subtle"
          inputMode="numeric"
          value={w.displayed}
          onChange={(e) => w.setDraft(e.target.value)}
          onFocus={w.handleFocus}
          onBlur={w.commit}
          onKeyDown={(e) => {
            digitsOnly(e);
            if (e.key === "Enter") w.commit();
          }}
        />
      </InputGroup>

      <InputGroup flex="1" startElement="H">
        <Input
          size="xs"
          variant="subtle"
          inputMode="numeric"
          value={h.displayed}
          onChange={(e) => h.setDraft(e.target.value)}
          onFocus={h.handleFocus}
          onBlur={h.commit}
          onKeyDown={(e) => {
            digitsOnly(e);
            if (e.key === "Enter") h.commit();
          }}
        />
      </InputGroup>

      {collection && formatValue && onFormatChange && (
        <Select.Root
          collection={collection}
          size="xs"
          width="auto"
          variant="subtle"
          value={[formatValue]}
          onValueChange={(details) => {
            const next = details.value[0];
            if (next != null) onFormatChange(next);
          }}
          positioning={{ sameWidth: false, placement: "bottom-end" }}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger
              fontWeight="medium"
              textStyle="xs"
              cursor="pointer"
              px="2"
            >
              <Select.ValueText
                whiteSpace="nowrap"
                overflow="visible"
                textOverflow="clip"
              />
              <Select.Indicator />
            </Select.Trigger>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content minW="6rem" whiteSpace="nowrap">
                {collection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      )}
    </Stack>
  );
}

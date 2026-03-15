import { useState } from "react";
import { Stack, Input, InputGroup } from "@chakra-ui/react";

interface DimensionInputProps {
  widthValue: number;
  heightValue: number;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
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
}: DimensionInputProps) {
  const w = useDimensionField(widthValue, onWidthChange);
  const h = useDimensionField(heightValue, onHeightChange);

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
    </Stack>
  );
}

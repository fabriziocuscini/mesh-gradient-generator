import type { KeyboardEvent } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupDivider,
  NumericInput,
  NumericInputRoot,
  NumericScrubArea,
} from "@/components/ui/input";

const MIN_DIMENSION = 100;
const MAX_DIMENSION = 7680;

interface DimensionInputProps {
  widthValue: number;
  heightValue: number;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
}

const SCRUB_CLASS =
  "typography-body-medium flex size-6 items-center justify-center text-black-500 dark:text-white-500";

/**
 * Replaces the hand-rolled draft/commit/clamp field the Chakra version needed:
 * NumericInputRoot clamps to min/max through Base UI's NumberField, and drag
 * the W or H label to scrub the value the way Figma does.
 *
 * FigUI's NumericInput also ships an expression evaluator (type `1920/2`, get
 * 960), but it cannot fire under Base UI 1.8: the input hard-filters keystrokes
 * against the locale's number format, so `/` and `*` never reach the field. No
 * loss against the Chakra version, whose own handler was digits-only.
 */
export function DimensionInput({
  widthValue,
  heightValue,
  onWidthChange,
  onHeightChange,
}: DimensionInputProps) {
  const commit = (onChange: (value: number) => void) => (next: string) => {
    const parsed = Number(next);
    if (next !== "" && Number.isFinite(parsed)) onChange(parsed);
  };

  // Base UI commits and clamps on blur, not on Enter, so Enter would otherwise
  // leave an out-of-range value sitting in the field. The Chakra version
  // committed on Enter and people expect that of a numeric field.
  const commitOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };

  return (
    <InputGroup className="w-full">
      <NumericInputRoot
        value={widthValue}
        min={MIN_DIMENSION}
        max={MAX_DIMENSION}
        onValueChange={commit(onWidthChange)}
      >
        <InputGroupAddon>
          <NumericScrubArea className={SCRUB_CLASS}>W</NumericScrubArea>
        </InputGroupAddon>
        <NumericInput aria-label="Export width" onKeyDown={commitOnEnter} />
      </NumericInputRoot>

      <InputGroupDivider />

      <NumericInputRoot
        value={heightValue}
        min={MIN_DIMENSION}
        max={MAX_DIMENSION}
        onValueChange={commit(onHeightChange)}
      >
        <InputGroupAddon>
          <NumericScrubArea className={SCRUB_CLASS}>H</NumericScrubArea>
        </InputGroupAddon>
        <NumericInput aria-label="Export height" onKeyDown={commitOnEnter} />
      </NumericInputRoot>
    </InputGroup>
  );
}

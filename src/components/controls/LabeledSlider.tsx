import { useRef } from "react";
import { Slider } from "@/components/ui/slider";

interface LabeledSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue?: number;
  onChange: (value: number) => void;
  onChangeStart?: () => void;
}

/**
 * Base UI suppresses the browser's own dblclick on the thumb, so
 * double-click-to-reset is timed by hand from successive pointerdowns.
 */
const DOUBLE_CLICK_MS = 350;

/** 0.30000000000000004 is not a label. */
function format(value: number): string {
  return String(parseFloat(value.toFixed(2)));
}

export function LabeledSlider({
  label,
  value,
  min,
  max,
  step,
  defaultValue,
  onChange,
  onChangeStart,
}: LabeledSliderProps) {
  const snapshotTaken = useRef(false);
  const lastThumbDown = useRef(0);

  const release = () => {
    snapshotTaken.current = false;
  };

  const reset = () => {
    if (defaultValue !== undefined && value !== defaultValue) {
      onChangeStart?.();
      onChange(defaultValue);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="typography-body-medium text-black-500 dark:text-white-500">
          {label}
        </span>
        <span className="typography-body-medium text-black-400 tabular-nums dark:text-white-400">
          {format(value)}
        </span>
      </div>
      <Slider
        className="w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(next) => {
          if (!snapshotTaken.current && onChangeStart) {
            onChangeStart();
            snapshotTaken.current = true;
          }
          onChange(Array.isArray(next) ? next[0] : next);
        }}
        // Base UI skips onValueCommitted when a drag is cancelled or lands on
        // the same value, which would strand the ref and cost the *next* drag
        // its undo entry. onPointerUp is the belt to that braces.
        onValueCommitted={release}
        onPointerUp={release}
        thumbProps={{
          onPointerDown: () => {
            const now = performance.now();
            const isDouble = now - lastThumbDown.current < DOUBLE_CLICK_MS;
            // Zeroing on a hit stops a triple-click firing twice.
            lastThumbDown.current = isDouble ? 0 : now;
            if (isDouble) reset();
          },
        }}
      />
    </div>
  );
}

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
  const thumbHeld = useRef(false);
  const pressDragged = useRef(false);

  const release = () => {
    snapshotTaken.current = false;
    // A press that dragged the value is not the first half of a double-click.
    // Without this, a quick drag followed by a click within DOUBLE_CLICK_MS
    // paired up as one, so the reset fired on the wrong press and the real
    // double-click that came next did nothing.
    if (pressDragged.current) lastThumbDown.current = 0;
    thumbHeld.current = false;
    pressDragged.current = false;
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
        <span className="typography-body-medium text-ink-secondary">
          {label}
        </span>
        <span className="typography-body-medium text-ink-muted tabular-nums">
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
          // Only a press can drag. Arrow keys move the value too, and marking
          // those would strand the flag until the next pointer release.
          if (thumbHeld.current) pressDragged.current = true;
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
            thumbHeld.current = true;
            pressDragged.current = false;
            if (isDouble) reset();
          },
        }}
      />
    </div>
  );
}

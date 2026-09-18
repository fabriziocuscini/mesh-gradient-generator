import { useCallback, useEffect, useRef } from "react";
import { Tooltip } from "@/components/controls/Tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectOption<T> {
  label: string;
  value: T;
}

interface SelectRowProps<T extends string | number> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  /**
   * Optional. Called with an option while the pointer rests on it, and with
   * null when the preview is over, so the canvas can show what that option
   * would look like before it is chosen.
   */
  onPreview?: (value: T | null) => void;
}

/**
 * How long the pointer has to sit on an option before the canvas takes it up.
 * Long enough that sweeping down the list to read the labels costs nothing,
 * short enough that stopping on a name feels like it answered you.
 */
const PREVIEW_DELAY_MS = 180;

/**
 * Values stay in their own type rather than round-tripping through strings the
 * way the Chakra version had to. That matters here: GRADIENT_TYPES ids are
 * shader ids in a non-index order, so a stringify/parse slip would silently
 * select the wrong renderer under the right label.
 */
export function SelectRow<T extends string | number>({
  label,
  value,
  options,
  onChange,
  onPreview,
}: SelectRowProps<T>) {
  const selected = options.find((option) => option.value === value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Read through a ref inside the timer, so a parent that hands down a fresh
  // callback each render doesn't have to restart the wait, and so the unmount
  // cleanup below can stay tied to nothing but the mount.
  const previewRef = useRef(onPreview);
  useEffect(() => {
    previewRef.current = onPreview;
  }, [onPreview]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const previewAfterDelay = useCallback(
    (next: T) => {
      if (!previewRef.current) return;
      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        previewRef.current?.(next);
      }, PREVIEW_DELAY_MS);
    },
    [clearTimer],
  );

  // Drops both the pending option and the one already on screen.
  const endPreview = useCallback(() => {
    clearTimer();
    previewRef.current?.(null);
  }, [clearTimer]);

  const endPreviewRef = useRef(endPreview);
  useEffect(() => {
    endPreviewRef.current = endPreview;
  }, [endPreview]);

  // A panel section can collapse while the preview is up, taking this row
  // with it. Put the committed value back rather than leave the canvas on a
  // shape nobody chose.
  useEffect(() => () => endPreviewRef.current(), []);

  return (
    <div className="flex h-6 items-center justify-between gap-2">
      <span className="typography-body-medium shrink-0 text-ink-secondary">
        {label}
      </span>
      <Select
        items={options}
        value={value}
        onValueChange={(next) => {
          // Typed `T | null`. Letting null through would push a history entry,
          // fire a crossfade and hand NaN to the shader.
          if (next != null) {
            clearTimer();
            onChange(next);
          }
        }}
        onOpenChange={(open) => {
          if (!open) endPreview();
        }}
      >
        {/* The trigger is a fixed 120px rather than filling the row, so a long
            option truncates. The tooltip is what makes that safe: hover and the
            full name appears after the provider's 400ms delay. flex-none undoes
            the trigger's own flex-1. */}
        <Tooltip content={selected?.label ?? ""} disabled={!selected}>
          <SelectTrigger className="w-30 flex-none" aria-label={label}>
            <SelectValue />
          </SelectTrigger>
        </Tooltip>
        <SelectContent align="end" onMouseLeave={endPreview}>
          {options.map((option) => (
            <SelectItem
              key={String(option.value)}
              value={option.value}
              onMouseEnter={() => previewAfterDelay(option.value)}
              // Base UI moves focus with the highlight, so arrow keys preview
              // too. Opening the menu focuses the current option, which is
              // already what the canvas shows, so nothing happens there.
              onFocus={() => previewAfterDelay(option.value)}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

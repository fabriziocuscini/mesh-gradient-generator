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
}

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
}: SelectRowProps<T>) {
  return (
    <div className="flex h-6 items-center justify-between gap-2">
      <span className="typography-body-medium shrink-0 text-black-500 dark:text-white-500">
        {label}
      </span>
      <Select
        items={options}
        value={value}
        onValueChange={(next) => {
          // Typed `T | null`. Letting null through would push a history entry,
          // fire a crossfade and hand NaN to the shader.
          if (next != null) onChange(next);
        }}
      >
        <SelectTrigger inline aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {options.map((option) => (
            <SelectItem key={String(option.value)} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

import { useRef } from "react";
import { HStack, Slider, Text } from "@chakra-ui/react";

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

  return (
    <Slider.Root
      size="sm"
      width="full"
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={(e) => {
        if (!snapshotTaken.current && onChangeStart) {
          onChangeStart();
          snapshotTaken.current = true;
        }
        onChange(e.value[0]);
      }}
      onValueChangeEnd={() => {
        snapshotTaken.current = false;
      }}
    >
      <HStack justify="space-between" mb="1">
        <Slider.Label>
          <Text textStyle="xs" fontWeight="medium" color="fg.muted">
            {label}
          </Text>
        </Slider.Label>
        <Slider.ValueText textStyle="xs" color="fg.subtle" />
      </HStack>
      <Slider.Control>
        <Slider.Track>
          <Slider.Range />
        </Slider.Track>
        <Slider.Thumb
          index={0}
          onDoubleClick={() => {
            if (defaultValue !== undefined && value !== defaultValue) {
              onChangeStart?.();
              onChange(defaultValue);
            }
          }}
        >
          <Slider.HiddenInput />
        </Slider.Thumb>
      </Slider.Control>
    </Slider.Root>
  );
}

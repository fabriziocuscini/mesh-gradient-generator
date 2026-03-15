import { HStack, Slider, Text } from "@chakra-ui/react";

interface LabeledSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export function LabeledSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: LabeledSliderProps) {
  return (
    <Slider.Root
      size="sm"
      width="full"
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={(e) => onChange(e.value[0])}
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
        <Slider.Thumbs />
      </Slider.Control>
    </Slider.Root>
  );
}

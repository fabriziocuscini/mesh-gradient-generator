import { Text, Portal, createListCollection, Stack } from "@chakra-ui/react";
import { Select } from "@chakra-ui/react";
import { useMemo } from "react";

interface SelectOption {
  label: string;
  value: string;
}

interface GradientSelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

export function GradientSelect({
  label,
  value,
  options,
  onChange,
}: GradientSelectProps) {
  const collection = useMemo(
    () => createListCollection({ items: options }),
    [options],
  );

  return (
    <Stack
      direction={{ base: "column", lg: "row" }}
      justify="space-between"
      width="full"
    >
      <Text textStyle="xs" fontWeight="medium" color="fg.muted" flexShrink={0}>
        {label}
      </Text>
      <Select.Root
        collection={collection}
        size="xs"
        width="auto"
        variant="ghost"
        value={[value]}
        onValueChange={(details) => {
          const next = details.value[0];
          if (next != null) onChange(next);
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
            <Select.Content minW="10rem" whiteSpace="nowrap">
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
    </Stack>
  );
}

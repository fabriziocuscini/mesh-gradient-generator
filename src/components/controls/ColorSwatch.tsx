import { type Ref } from "react";
import { Box, HStack, IconButton, Text } from "@chakra-ui/react";
import { GripVertical, Minus } from "lucide-react";

interface ColorSwatchProps {
  hex: string;
  onRemove?: () => void;
  onClick?: () => void;
  removable?: boolean;
  active?: boolean;
  handleRef?: Ref<HTMLButtonElement>;
}

export function ColorSwatch({
  hex: rawHex,
  onRemove,
  onClick,
  removable = true,
  active = false,
  handleRef,
}: ColorSwatchProps) {
  const hex = /^#[0-9a-fA-F]{6}$/.test(rawHex) ? rawHex : "#000000";
  return (
    <HStack
      height="10"
      gap="1.5"
      py="1"
      px="1"
      borderRadius="md"
      cursor="pointer"
      bg={active ? "bg.muted" : undefined}
      _hover={{ bg: "bg.subtle" }}
      role="group"
      position="relative"
      onClick={onClick}
    >
      <IconButton
        ref={handleRef}
        aria-label="Drag to reorder"
        variant="plain"
        size="xs"
        color="fg.subtle"
        position="absolute"
        left="-6"
        top="50%"
        css={{
          transform: "translateY(-50%)",
          opacity: 0,
          "[role=group]:hover &": { opacity: 1 },
          transition: "opacity 0.15s",
          cursor: "grab",
          "&:active": { cursor: "grabbing" },
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={10} />
      </IconButton>
      <Box
        width="5"
        height="5"
        borderRadius="full"
        bg={hex}
        flexShrink={0}
        border="1px solid"
        borderColor="border"
      />
      <Text textStyle="xs" fontFamily="mono" color="fg" flex="1">
        {hex.replace("#", "").toUpperCase()}
      </Text>
      {removable && onRemove && (
        <IconButton
          aria-label="Remove color"
          variant="ghost"
          size="2xs"
          color="fg.muted"
          css={{
            opacity: active ? 1 : 0,
            "[role=group]:hover &": { opacity: 1 },
            transition: "opacity 0.15s",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Minus />
        </IconButton>
      )}
    </HStack>
  );
}

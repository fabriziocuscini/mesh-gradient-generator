import {
  Box,
  HStack,
  IconButton,
  type IconButtonProps,
} from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";
import { Tooltip } from "./tooltip";

interface ActionIconButtonProps extends Omit<IconButtonProps, "children"> {
  icon: LucideIcon;
  label: string;
  /**
   * Keyboard shortcut for this action — "P", or "Shift+Space" for a chord.
   * It reaches the tooltip only: the aria-label stays the plain action,
   * since a screen reader announcing "Randomize palette R" helps nobody.
   */
  shortcut?: string;
  onClick: () => void;
}

/**
 * Chips read backwards from the app's colour mode on purpose. The tooltip
 * sits on an inverted surface, so a light wash is what shows up on it while
 * the app itself is light.
 */
function ShortcutKeys({ shortcut }: { shortcut: string }) {
  return shortcut.split("+").map((key) => (
    <Box
      key={key}
      as="kbd"
      fontFamily="inherit"
      fontSize="0.9em"
      lineHeight="1.2"
      px="1"
      borderRadius="xs"
      bg={{ base: "whiteAlpha.400", _dark: "blackAlpha.400" }}
    >
      {key}
    </Box>
  ));
}

export function ActionIconButton({
  icon: Icon,
  label,
  shortcut,
  onClick,
  ...rest
}: ActionIconButtonProps) {
  return (
    <Tooltip
      content={
        shortcut ? (
          <HStack gap="1">
            <span>{label}</span>
            <ShortcutKeys shortcut={shortcut} />
          </HStack>
        ) : (
          label
        )
      }
      openDelay={400}
      closeDelay={0}
    >
      <IconButton
        aria-label={label}
        variant="ghost"
        size="2xs"
        onClick={onClick}
        {...rest}
      >
        <Icon size={14} />
      </IconButton>
    </Tooltip>
  );
}

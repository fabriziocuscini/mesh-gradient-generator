import { IconButton, type IconButtonProps } from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";
import { Tooltip } from "./tooltip";

interface ActionIconButtonProps extends Omit<IconButtonProps, "children"> {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

export function ActionIconButton({
  icon: Icon,
  label,
  onClick,
  ...rest
}: ActionIconButtonProps) {
  return (
    <Tooltip content={label} openDelay={400} closeDelay={0}>
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

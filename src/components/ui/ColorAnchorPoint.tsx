import { useRef } from "react";
import { Box } from "@chakra-ui/react";
import { anchorInset } from "@/lib/anchorPosition";

const CLICK_THRESHOLD = 4;

interface ColorAnchorPointProps {
  hex: string;
  x: number;
  y: number;
  onDragStart: () => void;
  onDrag: (x: number, y: number) => void;
  onDragEnd: () => void;
  onClick?: () => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  containerRef: React.RefObject<HTMLElement | null>;
  /**
   * Handle on the positioned element, so playback can move the dot in step
   * with the shader without a re-render per frame. Whoever takes it owns
   * clearing the inline `left`/`top` it writes.
   */
  nodeRef?: React.Ref<HTMLDivElement>;
}

export function ColorAnchorPoint({
  hex,
  x,
  y,
  onDragStart,
  onDrag,
  onDragEnd,
  onClick,
  onHoverStart,
  onHoverEnd,
  containerRef,
  nodeRef,
}: ColorAnchorPointProps) {
  const pointerOrigin = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerOrigin.current = { x: e.clientX, y: e.clientY };
    didDrag.current = false;
    onDragStart();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const container = containerRef.current;
    if (!container) return;

    if (
      pointerOrigin.current &&
      !didDrag.current &&
      (Math.abs(e.clientX - pointerOrigin.current.x) > CLICK_THRESHOLD ||
        Math.abs(e.clientY - pointerOrigin.current.y) > CLICK_THRESHOLD)
    ) {
      didDrag.current = true;
    }

    const rect = container.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    onDrag(nx, ny);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (!didDrag.current) {
      onClick?.();
    }
    pointerOrigin.current = null;
    onDragEnd();
  };

  return (
    <Box
      ref={nodeRef}
      position="absolute"
      left={anchorInset(x)}
      top={anchorInset(y)}
      transform="translate(-50%, -50%)"
      cursor="grab"
      _active={{ cursor: "grabbing" }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      zIndex={1}
      userSelect="none"
      touchAction="none"
    >
      <Box
        width="22px"
        height="22px"
        borderRadius="full"
        border="2px solid white"
        shadow="0 1px 4px rgba(0,0,0,0.3)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        transition="transform 0.15s ease"
        _hover={{ transform: "scale(1.25)" }}
        _active={{ transform: "scale(1.1)" }}
      >
        <Box width="14px" height="14px" borderRadius="full" bg={hex} />
      </Box>
    </Box>
  );
}

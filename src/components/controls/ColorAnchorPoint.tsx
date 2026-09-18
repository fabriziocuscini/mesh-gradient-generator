import { type CSSProperties, useRef } from "react";
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
    <div
      ref={nodeRef}
      /*
       * The offset reaches `left`/`top` through a class, not through this style
       * object, and that indirection is load-bearing. The playback loop writes
       * `node.style.left` every frame and clears it on pause; an inline `left`
       * here would be what it cleared, leaving nothing behind and dropping
       * every anchor into the corner. Feeding the class a custom property
       * instead means the inline value wins while playing and the class is
       * still there, up to date, the moment it is cleared.
       */
      style={
        {
          "--anchor-x": anchorInset(x),
          "--anchor-y": anchorInset(y),
        } as CSSProperties
      }
      className="absolute top-(--anchor-y) left-(--anchor-x) z-[1] -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none active:cursor-grabbing"
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="flex size-[22px] items-center justify-center rounded-full border-2 border-white-1000 shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-transform duration-150 ease-out hover:scale-125 active:scale-110">
        <div
          className="size-[14px] rounded-full"
          style={{ backgroundColor: hex }}
        />
      </div>
    </div>
  );
}

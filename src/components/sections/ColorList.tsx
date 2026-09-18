import { AnimatePresence, motion } from "motion/react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable, isSortable } from "@dnd-kit/react/sortable";
import { Plus } from "lucide-react";
import { useGradientStore } from "@/store/gradientStore";
import { type ColorPoint } from "@/types";
import { ColorPicker } from "@/components/controls/ColorPicker";
import { ActionIconButton } from "@/components/controls/ActionIconButton";
import { randomHexColor } from "@/lib/colors";

const MAX_COLORS = 10;
const MIN_COLORS = 2;

interface SortableColorItemProps {
  color: ColorPoint;
  index: number;
  canRemove: boolean;
  isPickerOpen: boolean;
  onPickerOpenChange: (colorId: string, isOpen: boolean) => void;
  onColorChange: (id: string, hex: string) => void;
  onRemove: (id: string) => void;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
}

function SortableColorItem({
  color,
  index,
  canRemove,
  isPickerOpen,
  onPickerOpenChange,
  onColorChange,
  onRemove,
  onHoverStart,
  onHoverEnd,
}: SortableColorItemProps) {
  const { ref, handleRef, isDragging } = useSortable({
    id: color.id,
    index,
  });

  return (
    <motion.div
      ref={ref}
      key={color.id}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: isDragging ? 0.5 : 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      onMouseEnter={() => onHoverStart(color.id)}
      onMouseLeave={onHoverEnd}
    >
      <ColorPicker
        hex={color.hex}
        onChange={(hex) => onColorChange(color.id, hex)}
        onRemove={canRemove ? () => onRemove(color.id) : undefined}
        removable={canRemove}
        open={isPickerOpen}
        onOpenChange={(isOpen) => onPickerOpenChange(color.id, isOpen)}
        dragHandleRef={handleRef}
      />
    </motion.div>
  );
}

/**
 * The Colors section's header action. Everything else that used to live here
 * now sits on the floating toolbar over the canvas, since those actions change
 * the whole gradient rather than the swatch list.
 */
export function ColorListActions() {
  const colors = useGradientStore((s) => s.colors);
  const addColor = useGradientStore((s) => s.addColor);

  if (colors.length >= MAX_COLORS) return null;

  return (
    <ActionIconButton
      icon={Plus}
      label="Add color"
      onClick={() => addColor(randomHexColor())}
    />
  );
}

export function ColorList() {
  const colors = useGradientStore((s) => s.colors);
  const setColorHex = useGradientStore((s) => s.setColorHex);
  const removeColor = useGradientStore((s) => s.removeColor);
  const reorderColors = useGradientStore((s) => s.reorderColors);
  const setHighlightedColorId = useGradientStore(
    (s) => s.setHighlightedColorId,
  );
  const selectedColorId = useGradientStore((s) => s.selectedColorId);
  const setSelectedColorId = useGradientStore((s) => s.setSelectedColorId);
  const pushHistory = useGradientStore((s) => s.pushHistory);

  const canRemove = colors.length > MIN_COLORS;

  const handlePickerOpenChange = (colorId: string, isOpen: boolean) => {
    if (isOpen) {
      pushHistory();
      setSelectedColorId(colorId);
    } else {
      setSelectedColorId(null);
      setHighlightedColorId(null);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <DragDropProvider
        onDragEnd={(event) => {
          if (event.canceled) return;
          const { source } = event.operation;
          if (isSortable(source)) {
            const { initialIndex, index } = source;
            if (initialIndex !== index) {
              reorderColors(initialIndex, index);
            }
          }
        }}
      >
        <AnimatePresence initial={false}>
          {colors.map((color, index) => (
            <SortableColorItem
              key={color.id}
              color={color}
              index={index}
              canRemove={canRemove}
              isPickerOpen={selectedColorId === color.id}
              onPickerOpenChange={handlePickerOpenChange}
              onColorChange={setColorHex}
              onRemove={removeColor}
              onHoverStart={(id) => {
                if (!selectedColorId) setHighlightedColorId(id);
              }}
              onHoverEnd={() => {
                if (!selectedColorId) setHighlightedColorId(null);
              }}
            />
          ))}
        </AnimatePresence>
      </DragDropProvider>
    </div>
  );
}

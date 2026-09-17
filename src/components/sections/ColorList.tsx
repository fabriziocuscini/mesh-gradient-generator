import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable, isSortable } from "@dnd-kit/react/sortable";
import { Mic, MicOff, Palette, Pause, Play, Plus, Shuffle } from "lucide-react";
import { useGradientStore } from "@/store/gradientStore";
import { type ColorPoint } from "@/types";
import { ColorPicker } from "@/components/controls/ColorPicker";
import { ActionIconButton } from "@/components/controls/ActionIconButton";
import { Tooltip } from "@/components/controls/Tooltip";
import { Button } from "@/components/ui/button";
import { ImageColorPicker } from "@/components/sections/ImageColorPicker";
import { randomHexColor } from "@/lib/colors";
import { useClapDetector, isWebAudioSupported } from "@/hooks/useClapDetector";

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
 * The Colors section's header actions. Separate from the list so they can sit
 * in the collapsible header beside the title, the way Figma's panels do.
 */
export function ColorListActions() {
  const colors = useGradientStore((s) => s.colors);
  const addColor = useGradientStore((s) => s.addColor);
  const randomizePositions = useGradientStore((s) => s.randomizePositions);
  const randomizePalette = useGradientStore((s) => s.randomizePalette);
  const setClapDetectionActive = useGradientStore(
    (s) => s.setClapDetectionActive,
  );
  const isPlaying = useGradientStore((s) => s.isPlaying);
  const togglePlayback = useGradientStore((s) => s.togglePlayback);

  const [clapEnabled, setClapEnabled] = useState(false);
  const [clapFlash, setClapFlash] = useState(false);
  const flashTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const handleClap = useCallback(() => {
    useGradientStore.getState().randomizePositions();
    setClapFlash(true);
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    flashTimeout.current = setTimeout(() => setClapFlash(false), 300);
  }, []);

  const { isListening, hasPermission, requestPermission } = useClapDetector({
    onClap: handleClap,
    enabled: clapEnabled,
  });

  useEffect(() => {
    setClapDetectionActive(isListening);
  }, [isListening, setClapDetectionActive]);

  useEffect(() => {
    return () => {
      if (flashTimeout.current) clearTimeout(flashTimeout.current);
    };
  }, []);

  const handleClapToggle = useCallback(async () => {
    if (isListening) {
      setClapEnabled(false);
    } else if (hasPermission) {
      setClapEnabled(true);
    } else {
      await requestPermission();
      setClapEnabled(true);
    }
  }, [isListening, hasPermission, requestPermission]);

  const clapTooltip =
    hasPermission === false
      ? "Microphone access denied"
      : isListening
        ? "Listening for claps"
        : "Clap to randomize";

  const MicIcon = isListening ? Mic : MicOff;

  return (
    <>
      <ActionIconButton
        icon={isPlaying ? Pause : Play}
        label={isPlaying ? "Pause animation" : "Animate anchor points"}
        shortcut="P"
        onClick={togglePlayback}
        variant={isPlaying ? "primary" : "ghost"}
      />
      {isWebAudioSupported && (
        // The flash wrapper is outside the tooltip now: Base UI's trigger
        // renders the button itself, so a motion.div in between would have
        // become the trigger.
        <motion.div
          animate={clapFlash ? { scale: [1, 1.35, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Tooltip content={clapTooltip}>
            <Button
              aria-label={clapTooltip}
              variant={isListening ? "primary" : "ghost"}
              size="icon"
              onClick={handleClapToggle}
              disabled={hasPermission === false}
            >
              <MicIcon />
            </Button>
          </Tooltip>
        </motion.div>
      )}
      <ActionIconButton
        icon={Shuffle}
        label="Randomize positions"
        shortcut="Space"
        onClick={randomizePositions}
      />
      <ActionIconButton
        icon={Palette}
        label="Randomize palette"
        shortcut="R"
        onClick={randomizePalette}
      />
      <ImageColorPicker />
      {colors.length < MAX_COLORS && (
        <ActionIconButton
          icon={Plus}
          label="Add color"
          onClick={() => addColor(randomHexColor())}
        />
      )}
    </>
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

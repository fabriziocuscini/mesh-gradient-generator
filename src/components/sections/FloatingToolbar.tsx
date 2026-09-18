import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Mic, MicOff, Palette, Pause, Play, Shuffle } from "lucide-react";
import { useGradientStore } from "@/store/gradientStore";
import { ActionIconButton } from "@/components/controls/ActionIconButton";
import { Tooltip } from "@/components/controls/Tooltip";
import { Button } from "@/components/ui/button";
import { ImageColorPicker } from "@/components/sections/ImageColorPicker";
import { useClapDetector, isWebAudioSupported } from "@/hooks/useClapDetector";
import { cn } from "@/lib/utils";

/** 32px, the way Figma's own floating toolbar sizes its buttons. The panel
 *  keeps its 24px ones: this bar sits over the artwork, not in a dense list. */
const TOOLBAR_BUTTON = "size-8";

/** One surface shared by both pills, copied from the popover's. */
const PILL = cn(
  "flex items-center gap-0.5 rounded-xl p-1.5",
  "bg-white-1000 shadow-400 inset-ring inset-ring-black-100",
  "dark:bg-grey-800 dark:inset-ring-white-200",
);

/**
 * The actions that act on the whole gradient, floating over the canvas the way
 * Figma floats its tool bar. They used to sit in the Colors panel header, where
 * only adding a swatch really belonged.
 */
export function FloatingToolbar() {
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
    // z-10 beats the anchor handles' z-[1]: the canvas container is
    // position:relative with an auto z-index, so it opens no stacking context
    // and an anchor would otherwise draw over the bar.
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
      <div className={cn(PILL, "pointer-events-auto")}>
        <ActionIconButton
          className={TOOLBAR_BUTTON}
          icon={isPlaying ? Pause : Play}
          label={isPlaying ? "Pause animation" : "Animate anchor points"}
          shortcut="P"
          onClick={togglePlayback}
        />
        {isWebAudioSupported && (
          // The flash wrapper is outside the tooltip: Base UI's trigger
          // renders the button itself, so a motion.div in between would have
          // become the trigger.
          <motion.div
            animate={clapFlash ? { scale: [1, 1.35, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Tooltip content={clapTooltip}>
              <Button
                aria-label={clapTooltip}
                variant="ghost"
                size="icon"
                className={TOOLBAR_BUTTON}
                onClick={handleClapToggle}
                disabled={hasPermission === false}
              >
                <MicIcon className="size-4" strokeWidth={1.5} />
              </Button>
            </Tooltip>
          </motion.div>
        )}
        <ActionIconButton
          className={TOOLBAR_BUTTON}
          icon={Shuffle}
          label="Randomize positions"
          shortcut="Space"
          onClick={randomizePositions}
        />
        <ActionIconButton
          className={TOOLBAR_BUTTON}
          icon={Palette}
          label="Randomize palette"
          shortcut="R"
          onClick={randomizePalette}
        />
      </div>

      <div className={cn(PILL, "pointer-events-auto")}>
        <ImageColorPicker triggerClassName={TOOLBAR_BUTTON} />
      </div>
    </div>
  );
}

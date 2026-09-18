import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ChevronUp,
  Mic,
  MicOff,
  Palette,
  Pause,
  Play,
  Shuffle,
} from "lucide-react";
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

/** The collapsed bar: a tab flush with the bottom edge of the canvas, with
 *  only its top corners rounded, the way a drawer pull looks. */
const TAB = cn(
  // rounded-b-none is explicit: the Button's own rounded-md would otherwise
  // keep the bottom corners, and this is a panel peeking out, not a button.
  "flex h-5 w-30 items-center justify-center rounded-t-xl rounded-b-none",
  "bg-white-1000 shadow-400 inset-ring inset-ring-black-100",
  "dark:bg-grey-800 dark:inset-ring-white-200",
);

/** One surface shared by both pills, copied from the popover's. */
const PILL = cn(
  "flex items-center gap-0.5 rounded-xl p-1.5",
  "bg-white-1000 shadow-400 inset-ring inset-ring-black-100",
  "dark:bg-grey-800 dark:inset-ring-white-200",
);

/** How far outside the bar a wheel event still counts, in pixels. Collapsed,
 *  the bar is a 44px handle, so this is what makes it easy to scroll back up. */
const WHEEL_ZONE_PADDING = 56;

/** A trackpad fires a burst of small deltas, so ignore the smallest ones. */
const WHEEL_THRESHOLD = 4;

/** `hasPermission` is null until the browser has been asked, so that is the
 *  one state where the tooltip warns about the prompt that follows a click. */
function clapLabel(isListening: boolean, hasPermission: boolean | null) {
  if (hasPermission === false) return "Microphone access denied";
  if (isListening) return "Listening for claps";
  if (hasPermission === null) return "Clap to randomize (requires mic access)";
  return "Clap to randomize";
}

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

  const clapTooltip = clapLabel(isListening, hasPermission);

  const MicIcon = isListening ? Mic : MicOff;

  const reduceMotion = useReducedMotion();
  const [collapsed, setCollapsed] = useState(false);
  const zoneRef = useRef<HTMLDivElement>(null);

  // The wheel listener is on the window, not on the bar. The bar sits in a
  // pointer-events-none layer so that anchor points under it stay draggable,
  // and an element in that layer receives no wheel events either.
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const zone = zoneRef.current;
      if (!zone) return;

      // The box keeps the bar's size while collapsed, because the collapse is
      // a transform. So the target area does not move out from under the
      // cursor, and one scroll back up returns the bar.
      const r = zone.getBoundingClientRect();
      const inZone =
        e.clientX >= r.left - WHEEL_ZONE_PADDING &&
        e.clientX <= r.right + WHEEL_ZONE_PADDING &&
        e.clientY >= r.top - WHEEL_ZONE_PADDING &&
        e.clientY <= r.bottom + WHEEL_ZONE_PADDING;
      if (!inZone) return;

      // Non-passive, so this can stop the gesture reaching the document. The
      // page has nothing to scroll, but macOS would still rubber-band it.
      e.preventDefault();

      // A downward flick reports a negative deltaY under macOS natural
      // scrolling, so the sign here follows the finger, not the number: push
      // the bar down to stow it, pull up to bring it back.
      if (e.deltaY < -WHEEL_THRESHOLD) setCollapsed(true);
      else if (e.deltaY > WHEEL_THRESHOLD) setCollapsed(false);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  const slide = {
    duration: reduceMotion ? 0 : 0.28,
    ease: [0.32, 0.72, 0, 1] as const,
  };

  return (
    // z-10 beats the anchor handles' z-[1]: the canvas container is
    // position:relative with an auto z-index, so it opens no stacking context
    // and an anchor would otherwise draw over the bar.
    <div
      ref={zoneRef}
      className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
    >
      {/* `inert` is what stops a hidden bar from taking clicks or tab stops.
          The pills set pointer-events-auto, so an ancestor cannot switch them
          off on its own. */}
      <motion.div
        className="flex items-center gap-2"
        inert={collapsed}
        animate={{
          y: collapsed ? 72 : 0,
          opacity: collapsed ? 0 : 1,
          scale: collapsed ? 0.94 : 1,
        }}
        transition={slide}
      >
        {/* Playback is its own pill: it acts on time, the rest act on the
            gradient itself. */}
        <div className={cn(PILL, "pointer-events-auto")}>
          <ActionIconButton
            className={TOOLBAR_BUTTON}
            icon={isPlaying ? Pause : Play}
            label={isPlaying ? "Pause animation" : "Animate anchor points"}
            shortcut="P"
            onClick={togglePlayback}
          />
        </div>

        <div className={cn(PILL, "pointer-events-auto")}>
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
          <ImageColorPicker triggerClassName={TOOLBAR_BUTTON} />
        </div>
      </motion.div>

      {/* -bottom-6 cancels the bar's own 24px inset, so the tab sits on the
          bottom edge of the canvas rather than floating above it. */}
      <motion.div
        className="absolute inset-x-0 -bottom-6 flex justify-center"
        inert={!collapsed}
        // Without initial={false} the first paint puts the tab at y 0, so the
        // page loads with the tab on screen and then slides it away.
        initial={false}
        animate={{ y: collapsed ? 0 : 20 }}
        transition={slide}
      >
        <Tooltip content="Show toolbar">
          <Button
            aria-label="Show toolbar"
            variant="ghost"
            size="icon"
            // The ghost variant's hover fill is dropped: the tab reads as a
            // panel peeking out, and a panel does not light up under the
            // cursor. The press state stays, as a click still does something.
            className={cn(
              TAB,
              "pointer-events-auto p-0 hover:bg-white-1000 dark:hover:bg-grey-800",
            )}
            onClick={() => setCollapsed(false)}
          >
            <ChevronUp className="size-4" strokeWidth={1.5} />
          </Button>
        </Tooltip>
      </motion.div>
    </div>
  );
}

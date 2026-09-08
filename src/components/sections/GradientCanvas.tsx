import { useCallback, useEffect, useRef, useState } from "react";
import { Box } from "@chakra-ui/react";
import { AnimatePresence, motion } from "motion/react";
import { useWebGLRenderer } from "@/hooks/useWebGLRenderer";
import { useGradientStore } from "@/store/gradientStore";
import {
  packColorsForShader,
  packPositionsForShader,
  hexToNormalizedRgb,
} from "@/lib/colors";
import { ColorAnchorPoint } from "@/components/ui/ColorAnchorPoint";
import { anchorInset } from "@/lib/anchorPosition";
import { applyDrift, driftOffset, livePositionsRef } from "@/lib/drift";
import { AudioWaveOverlay } from "@/components/ui/AudioWaveOverlay";
import type { RenderParams } from "@/lib/webgl";

/**
 * The paint rate during playback. The anchors travel on 10–18 second cycles,
 * so at a typical canvas size no anchor moves more than about two pixels
 * between frames here and the drift still reads as continuous — while a full
 * 120Hz would re-shade several million pixels through a
 * transcendental-heavy shader four times over to show the same image.
 */
const PLAYBACK_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / PLAYBACK_FPS;

/** Small enough not to admit the previous display frame — see tick(). */
const FRAME_TOLERANCE_MS = 1;

export function GradientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef<[number, number]>([0.5, 0.5]);
  const isDraggingRef = useRef(false);
  const playStartRef = useRef(0);
  const heldAtRef = useRef<number | null>(null);
  const anchorNodesRef = useRef(new Map<string, HTMLDivElement>());

  const { render, resize, isReady } = useWebGLRenderer(canvasRef);
  const [showAnchors, setShowAnchors] = useState(false);
  const [draggingAnchor, setDraggingAnchor] = useState(false);

  const colors = useGradientStore((s) => s.colors);
  const gradientTypeIndex = useGradientStore((s) => s.gradientTypeIndex);
  const warpShapeIndex = useGradientStore((s) => s.warpShapeIndex);
  const warpRatio = useGradientStore((s) => s.warpRatio);
  const warpSize = useGradientStore((s) => s.warpSize);
  const noiseRatio = useGradientStore((s) => s.noiseRatio);
  const setColorPosition = useGradientStore((s) => s.setColorPosition);
  const pushHistory = useGradientStore((s) => s.pushHistory);
  const highlightedColorId = useGradientStore((s) => s.highlightedColorId);
  const selectedColorId = useGradientStore((s) => s.selectedColorId);
  const setSelectedColorId = useGradientStore((s) => s.setSelectedColorId);
  const clapDetectionActive = useGradientStore((s) => s.clapDetectionActive);
  const isPlaying = useGradientStore((s) => s.isPlaying);
  const hoveredColorId = useGradientStore((s) => s.hoveredColorId);
  const setHoveredColorId = useGradientStore((s) => s.setHoveredColorId);

  const highlightedColor = highlightedColorId
    ? colors.find((c) => c.id === highlightedColorId)
    : null;

  // Reaching for an anchor shouldn't mean chasing it. Playback holds still
  // while the pointer is on one — its dot or its row in the list — while one
  // is being dragged, which keeps the hold through a drop (the pointer is
  // still on the dot afterwards, so the motion waits until you leave), and
  // for as long as a colour picker is open on one, so a colour can be judged
  // against a composition that is standing still.
  //
  // Checked against the live colours rather than for a bare id, because a
  // colour deleted while the pointer is on it — or from inside its own open
  // picker — never gets to report that it is no longer the one being worked
  // on, and a hold nothing can release is a dead play button.
  const held =
    isPlaying &&
    (draggingAnchor ||
      colors.some((c) => c.id === hoveredColorId || c.id === selectedColorId));

  /**
   * Seconds of playback so far, frozen for the duration of a hold. Offsets
   * computed during one — a drag correction, say — have to match the frame
   * on screen, not where the wall clock has run on to.
   */
  const playbackSeconds = useCallback(
    () =>
      ((heldAtRef.current ?? performance.now()) - playStartRef.current) / 1000,
    [],
  );

  // The one place that decides where the anchors are. The frame loop is not
  // the only caller — a drag repaints through here, and during a hold that is
  // the only thing painting at all — so reading positions back out of a ref
  // the loop had written would show a stale frame the moment it stopped.
  const paint = useCallback(() => {
    if (!isReady()) return;
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const resolution = resize(width, height);

    const base = colors.map((c) => c.position);
    const positions = isPlaying ? applyDrift(base, playbackSeconds()) : base;
    livePositionsRef.current = isPlaying ? positions : null;

    const params: RenderParams = {
      resolution,
      time: 0,
      noiseTime: 0,
      bgColor: hexToNormalizedRgb(colors[0]?.hex ?? "#000000"),
      colors: packColorsForShader(colors.map((c) => c.hex)),
      positions: packPositionsForShader(positions),
      numberPoints: colors.length,
      noiseRatio,
      warpRatio,
      warpSize,
      mouse: mousePosRef.current,
      gradientTypeIndex,
      warpShapeIndex,
    };

    render(params);

    // React owns the dots when nothing is playing.
    if (!isPlaying) return;
    for (const [i, color] of colors.entries()) {
      const node = anchorNodesRef.current.get(color.id);
      if (!node) continue;
      node.style.left = anchorInset(positions[i][0]);
      node.style.top = anchorInset(positions[i][1]);
    }
  }, [
    colors,
    isPlaying,
    playbackSeconds,
    gradientTypeIndex,
    warpShapeIndex,
    warpRatio,
    warpSize,
    noiseRatio,
    render,
    resize,
    isReady,
  ]);

  useEffect(() => {
    paint();
  }, [paint]);

  // The playback clock. Kept out of the frame loop's effect below, which a
  // colour change restarts — reading the start time from there would rewind
  // the animation every time an anchor was dragged.
  useEffect(() => {
    if (isPlaying) {
      playStartRef.current = performance.now();
      return;
    }
    livePositionsRef.current = null;
    // Hand the dots back to React. Pause commits the positions they were
    // left at, so the class the effect reveals matches the inline offset it
    // clears and nothing jumps; without this the stale inline style would
    // outrank every later position the store sets, including a drag.
    for (const node of anchorNodesRef.current.values()) {
      node.style.left = "";
      node.style.top = "";
    }
  }, [isPlaying]);

  // Stop the clock for the duration of a hold. Declared above the frame loop
  // so this cleanup — which hands back the time spent held — runs before the
  // loop's effect restarts: React fires every cleanup for a commit before any
  // effect, in declaration order.
  useEffect(() => {
    if (!held) return;
    heldAtRef.current = performance.now();
    return () => {
      // Give back the held time rather than letting the drift jump to
      // wherever it would have reached, so it picks up mid-stride.
      playStartRef.current += performance.now() - (heldAtRef.current ?? 0);
      heldAtRef.current = null;
    };
  }, [held]);

  // Anchors drift off-store: the shader and the dots are driven straight
  // from this loop, leaving the sidebar's colour list and pickers out of
  // the frame budget entirely. The store only hears about it on pause.
  useEffect(() => {
    if (!isPlaying || held) return;

    let frame = 0;
    let lastPaintAt = Number.NEGATIVE_INFINITY;

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      // A millisecond of tolerance, so a timestamp landing a hair under the
      // interval still paints rather than slipping a whole display frame and
      // halving the rate. It has to stay small — anything approaching half
      // the interval lets the frame *before* the target through, which is how
      // a cap like this ends up painting at double the rate it asked for.
      if (now - lastPaintAt < FRAME_INTERVAL_MS - FRAME_TOLERANCE_MS) return;
      lastPaintAt = now;
      paint();
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [isPlaying, held, paint]);

  const registerAnchorNode = useCallback(
    (id: string) => (node: HTMLDivElement | null) => {
      if (node) anchorNodesRef.current.set(id, node);
      else anchorNodesRef.current.delete(id);
    },
    [],
  );

  // A drag while playing sets the base the drift swings around, not the
  // position itself — offsetting by the current drift keeps the dot pinned
  // under the cursor instead of leaping by however far it had travelled.
  const handleAnchorDrag = useCallback(
    (id: string, index: number, x: number, y: number) => {
      if (!useGradientStore.getState().isPlaying) {
        setColorPosition(id, [x, y]);
        return;
      }
      const [dx, dy] = driftOffset(index, playbackSeconds());
      setColorPosition(id, [x - dx, y - dy]);
    },
    [setColorPosition, playbackSeconds],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => paint());
    observer.observe(container);
    return () => observer.disconnect();
  }, [paint]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mousePosRef.current = [
        (e.clientX - rect.left) / rect.width,
        (e.clientY - rect.top) / rect.height,
      ];
      paint();
    },
    [paint],
  );

  return (
    <Box
      ref={containerRef}
      position="relative"
      width="100%"
      height="100%"
      bg="black"
      style={{ overflow: "clip" }}
      onMouseEnter={() => setShowAnchors(true)}
      onMouseLeave={() => {
        if (!isDraggingRef.current) setShowAnchors(false);
      }}
      onMouseMove={handleMouseMove}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />

      <AnimatePresence>
        {showAnchors && (
          <motion.div
            key="all-anchors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                pointerEvents: "auto",
              }}
            >
              {colors.map((color, index) => (
                <ColorAnchorPoint
                  key={color.id}
                  hex={color.hex}
                  x={color.position[0]}
                  y={color.position[1]}
                  containerRef={containerRef}
                  nodeRef={registerAnchorNode(color.id)}
                  onHoverStart={() => setHoveredColorId(color.id)}
                  onHoverEnd={() => setHoveredColorId(null)}
                  onDragStart={() => {
                    isDraggingRef.current = true;
                    setDraggingAnchor(true);
                    pushHistory();
                  }}
                  onDrag={(nx, ny) => handleAnchorDrag(color.id, index, nx, ny)}
                  onDragEnd={() => {
                    isDraggingRef.current = false;
                    setDraggingAnchor(false);
                    // Pointer capture suppresses mouseleave for the whole
                    // drag, so a drop landing away from the dot — dragged past
                    // the edge, where the dot clamps and the cursor doesn't —
                    // would otherwise hold playback forever.
                    const node = anchorNodesRef.current.get(color.id);
                    if (!node?.matches(":hover")) setHoveredColorId(null);
                    if (!containerRef.current?.matches(":hover")) {
                      setShowAnchors(false);
                    }
                  }}
                  onClick={() => {
                    requestAnimationFrame(() => setSelectedColorId(color.id));
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {!showAnchors && highlightedColor && (
          <motion.div
            key="highlight-anchor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
              }}
            >
              <ColorAnchorPoint
                hex={highlightedColor.hex}
                x={highlightedColor.position[0]}
                y={highlightedColor.position[1]}
                containerRef={containerRef}
                nodeRef={registerAnchorNode(highlightedColor.id)}
                onDragStart={() => {}}
                onDrag={() => {}}
                onDragEnd={() => {}}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {clapDetectionActive && (
          <motion.div
            key="audio-wave"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "20%",
              pointerEvents: "none",
            }}
          >
            <AudioWaveOverlay />
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

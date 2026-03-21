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
import { AudioWaveOverlay } from "@/components/ui/AudioWaveOverlay";
import type { RenderParams } from "@/lib/webgl";

export function GradientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosRef = useRef<[number, number]>([0.5, 0.5]);
  const isDraggingRef = useRef(false);

  const { render, resize, isReady } = useWebGLRenderer(canvasRef);
  const [showAnchors, setShowAnchors] = useState(false);

  const colors = useGradientStore((s) => s.colors);
  const gradientTypeIndex = useGradientStore((s) => s.gradientTypeIndex);
  const warpShapeIndex = useGradientStore((s) => s.warpShapeIndex);
  const warpRatio = useGradientStore((s) => s.warpRatio);
  const warpSize = useGradientStore((s) => s.warpSize);
  const noiseRatio = useGradientStore((s) => s.noiseRatio);
  const setColorPosition = useGradientStore((s) => s.setColorPosition);
  const pushHistory = useGradientStore((s) => s.pushHistory);
  const highlightedColorId = useGradientStore((s) => s.highlightedColorId);
  const setSelectedColorId = useGradientStore((s) => s.setSelectedColorId);
  const clapDetectionActive = useGradientStore((s) => s.clapDetectionActive);

  const highlightedColor = highlightedColorId
    ? colors.find((c) => c.id === highlightedColorId)
    : null;

  const renderGradient = useCallback(() => {
    if (!isReady()) return;
    const container = containerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const resolution = resize(width, height);

    const params: RenderParams = {
      resolution,
      time: 0,
      noiseTime: 0,
      bgColor: hexToNormalizedRgb(colors[0]?.hex ?? "#000000"),
      colors: packColorsForShader(colors.map((c) => c.hex)),
      positions: packPositionsForShader(colors.map((c) => c.position)),
      numberPoints: colors.length,
      noiseRatio,
      warpRatio,
      warpSize,
      mouse: mousePosRef.current,
      gradientTypeIndex,
      warpShapeIndex,
    };

    render(params);
  }, [
    colors,
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
    renderGradient();
  }, [renderGradient]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => renderGradient());
    observer.observe(container);
    return () => observer.disconnect();
  }, [renderGradient]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      mousePosRef.current = [
        (e.clientX - rect.left) / rect.width,
        (e.clientY - rect.top) / rect.height,
      ];
      renderGradient();
    },
    [renderGradient],
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
              {colors.map((color) => (
                <ColorAnchorPoint
                  key={color.id}
                  hex={color.hex}
                  x={color.position[0]}
                  y={color.position[1]}
                  containerRef={containerRef}
                  onDragStart={() => {
                    isDraggingRef.current = true;
                    pushHistory();
                  }}
                  onDrag={(nx, ny) => setColorPosition(color.id, [nx, ny])}
                  onDragEnd={() => {
                    isDraggingRef.current = false;
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

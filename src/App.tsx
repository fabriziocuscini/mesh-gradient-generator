import { useCallback, useEffect, useRef, useState } from "react";
import { Box } from "@chakra-ui/react";
import { Analytics } from "@vercel/analytics/react";
import { GradientCanvas } from "@/components/sections/GradientCanvas";
import { ControlPanel } from "@/components/sections/ControlPanel";
import { useGradientStore } from "@/store/gradientStore";

const DEFAULT_SIDEBAR_WIDTH = 300;
const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 480;

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const dragging = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if ((e.metaKey || e.ctrlKey) && e.code === "KeyZ" && !isInput) {
        e.preventDefault();
        if (e.shiftKey) {
          useGradientStore.getState().redo();
        } else {
          useGradientStore.getState().undo();
        }
        return;
      }

      if (isInput) return;

      if (e.code === "Space") {
        e.preventDefault();
        const store = useGradientStore.getState();
        store.randomizePositions();
        if (e.shiftKey) {
          store.randomizeEffects();
        }
      }

      if (e.code === "KeyR") {
        useGradientStore.getState().randomizePalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const width = window.innerWidth - e.clientX;
    setSidebarWidth(
      Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width)),
    );
  }, []);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  return (
    <>
      <Box height="100vh" overflow="hidden" display="flex">
        <Box flex="1" minWidth="0" height="100%">
          <GradientCanvas />
        </Box>

        <Box
          width="3px"
          flexShrink={0}
          cursor="col-resize"
          bg={{ base: "gray.200", _dark: "whiteAlpha.100" }}
          _hover={{ bg: { base: "gray.300", _dark: "whiteAlpha.200" } }}
          transition="background 0.15s"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={() => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH)}
        />

        <Box width={`${sidebarWidth}px`} flexShrink={0} height="100%">
          <ControlPanel />
        </Box>
      </Box>
      <Analytics />
    </>
  );
}

export default App;

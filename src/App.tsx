import { useCallback, useEffect, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { GradientCanvas } from "@/components/sections/GradientCanvas";
import { ControlPanel } from "@/components/sections/ControlPanel";
import { FloatingToolbar } from "@/components/sections/FloatingToolbar";
import { useGradientStore } from "@/store/gradientStore";
import { useThemeToggle } from "@/components/controls/theme";

const MIN_SIDEBAR_WIDTH = 240;
const MAX_SIDEBAR_WIDTH = 480;
// The panel opens at its narrowest, so the canvas gets the rest. A
// double-click on the divider brings it back here.
const DEFAULT_SIDEBAR_WIDTH = MIN_SIDEBAR_WIDTH;

function App() {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const dragging = useRef(false);
  // Lives here with the other shortcuts. It used to be a private hook inside
  // the colour-mode button, so the binding only existed while that button was
  // mounted — easy to lose to a refactor with no compile error to show for it.
  const { toggle: toggleColorMode } = useThemeToggle();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      // The guard is about text entry. Base UI's slider parks focus on a
      // hidden range input, which holds no text and must not swallow undo or
      // the bare-key shortcuts — Chakra's thumb was a div, so it never did.
      const isRange =
        tag === "INPUT" && (target as HTMLInputElement).type === "range";
      const isInput =
        !isRange && (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT");

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

      // Everything below is a bare key, so let the browser's own chords
      // through untouched — P in particular sits under Cmd+P for print.
      if (e.metaKey || e.ctrlKey || e.altKey) return;

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

      if (e.code === "KeyP") {
        useGradientStore.getState().togglePlayback();
      }

      if (e.code === "KeyD") {
        toggleColorMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleColorMode]);

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
      <div className="flex h-screen overflow-hidden">
        <div className="relative h-full min-w-0 flex-1">
          <GradientCanvas />
          <FloatingToolbar />
        </div>

        <div
          className="relative w-px shrink-0 cursor-col-resize bg-grey-200 transition-colors duration-150 hover:bg-grey-300 dark:bg-grey-600 dark:hover:bg-grey-500"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={() => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH)}
        >
          {/* The line is 1px like every other stroke, which is too thin to
              grab. This sits on top of it and takes 4px from each side. It is
              a child, so it still hovers and drags the line itself. */}
          <div className="absolute inset-y-0 -right-1 -left-1 cursor-col-resize" />
        </div>

        {/* Width stays data rather than a class: a Figma plugin build pins one
            value and calls figma.ui.resize without touching a component. */}
        <div className="h-full shrink-0" style={{ width: `${sidebarWidth}px` }}>
          <ControlPanel />
        </div>
      </div>
      <Analytics />
    </>
  );
}

export default App;

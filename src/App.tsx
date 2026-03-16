import { useEffect } from "react";
import { Box, Splitter } from "@chakra-ui/react";
import { GradientCanvas } from "@/components/sections/GradientCanvas";
import { ControlPanel } from "@/components/sections/ControlPanel";
import { useGradientStore } from "@/store/gradientStore";

function App() {
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

  return (
    <Box height="100vh" overflow="hidden">
      <Splitter.Root
        height="100%"
        defaultSize={[85, 15]}
        panels={[
          { id: "canvas", minSize: 60 },
          { id: "controls", minSize: 10, maxSize: 35 },
        ]}
        keyboardResizeBy={3}
      >
        <Splitter.Panel id="canvas">
          <Box height="100%" minWidth="0">
            <GradientCanvas />
          </Box>
        </Splitter.Panel>

        <Splitter.Context>
          {(context) => (
            <Splitter.ResizeTrigger
              id="canvas:controls"
              onDoubleClick={() => context.resetSizes()}
            >
              <Splitter.ResizeTriggerSeparator />
            </Splitter.ResizeTrigger>
          )}
        </Splitter.Context>

        <Splitter.Panel id="controls">
          <ControlPanel />
        </Splitter.Panel>
      </Splitter.Root>
    </Box>
  );
}

export default App;

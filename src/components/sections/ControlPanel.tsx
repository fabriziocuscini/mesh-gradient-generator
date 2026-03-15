import { useCallback, useState } from "react";
import { Box, Button, HStack, Separator, Text, VStack } from "@chakra-ui/react";
import { Download } from "lucide-react";
import { useGradientStore } from "@/store/gradientStore";
import { GRADIENT_TYPES, WARP_SHAPES } from "@/types";
import {
  hexToNormalizedRgb,
  packColorsForShader,
  packPositionsForShader,
} from "@/lib/colors";
import { exportPng } from "@/lib/export";
import { GradientSelect } from "@/components/ui/GradientSelect";
import { LabeledSlider } from "@/components/ui/LabeledSlider";
import { DimensionInput } from "@/components/ui/DimensionInput";
import { ColorModeButton } from "@/components/ui/color-mode";
import { ColorList } from "./ColorList";

export function ControlPanel() {
  const gradientTypeIndex = useGradientStore((s) => s.gradientTypeIndex);
  const warpShapeIndex = useGradientStore((s) => s.warpShapeIndex);
  const warpRatio = useGradientStore((s) => s.warpRatio);
  const warpSize = useGradientStore((s) => s.warpSize);
  const noiseRatio = useGradientStore((s) => s.noiseRatio);
  const width = useGradientStore((s) => s.width);
  const height = useGradientStore((s) => s.height);

  const setGradientTypeIndex = useGradientStore((s) => s.setGradientTypeIndex);
  const setWarpShapeIndex = useGradientStore((s) => s.setWarpShapeIndex);
  const setWarpRatio = useGradientStore((s) => s.setWarpRatio);
  const setWarpSize = useGradientStore((s) => s.setWarpSize);
  const setNoiseRatio = useGradientStore((s) => s.setNoiseRatio);
  const setWidth = useGradientStore((s) => s.setWidth);
  const setHeight = useGradientStore((s) => s.setHeight);

  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const state = useGradientStore.getState();
      await exportPng({
        resolution: [state.width, state.height],
        time: 0,
        noiseTime: 0,
        bgColor: hexToNormalizedRgb(state.colors[0]?.hex ?? "#000000"),
        colors: packColorsForShader(state.colors.map((c) => c.hex)),
        positions: packPositionsForShader(state.colors.map((c) => c.position)),
        numberPoints: state.colors.length,
        noiseRatio: state.noiseRatio,
        warpRatio: state.warpRatio,
        warpSize: state.warpSize,
        mouse: [0.5, 0.5],
        gradientTypeIndex: state.gradientTypeIndex,
        warpShapeIndex: state.warpShapeIndex,
      });
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }, []);

  const gradientOptions = GRADIENT_TYPES.map((t) => ({
    label: t.name,
    value: String(t.id),
  }));

  const warpOptions = WARP_SHAPES.map((s) => ({
    label: s.name,
    value: String(s.id),
  }));

  return (
    <VStack
      align="stretch"
      gap="0"
      height="100%"
      bg={{ base: "white", _dark: "gray.950" }}
      overflow="hidden"
    >
      {/* Header */}
      <HStack justify="space-between" px="4" py="3" flexShrink={0}>
        <Text textStyle="sm" fontWeight="semibold" color="fg">
          Mesh Gradient
        </Text>
        <ColorModeButton />
      </HStack>

      <Separator />

      {/* Scrollable controls */}
      <Box flex="1" overflowY="auto" py="4">
        <VStack align="stretch" gap="5">
          {/* Gradient & Warp type */}
          <VStack align="stretch" gap="3" px="4">
            <GradientSelect
              label="Gradient"
              value={String(gradientTypeIndex)}
              options={gradientOptions}
              onChange={(v) => setGradientTypeIndex(Number(v))}
            />
            <GradientSelect
              label="Warp Shape"
              value={String(warpShapeIndex)}
              options={warpOptions}
              onChange={(v) => setWarpShapeIndex(Number(v))}
            />
          </VStack>

          <Separator />

          {/* Sliders */}
          <VStack align="stretch" gap="4" px="4">
            <LabeledSlider
              label="Warp"
              value={warpRatio}
              min={0}
              max={1}
              step={0.01}
              onChange={setWarpRatio}
            />
            <LabeledSlider
              label="Warp Size"
              value={warpSize}
              min={0}
              max={5}
              step={0.01}
              onChange={setWarpSize}
            />
            <LabeledSlider
              label="Noise"
              value={noiseRatio}
              min={0}
              max={0.2}
              step={0.01}
              onChange={setNoiseRatio}
            />
          </VStack>

          <Separator />

          {/* Colors */}
          <VStack align="stretch" gap="4" px="4">
            <ColorList />
          </VStack>
        </VStack>
      </Box>

      {/* Footer – Export */}
      <VStack align="stretch" gap="3" flexShrink={0}>
        <Separator />
        <VStack align="stretch" gap="3" px="4" pb="4">
          <Text textStyle="xs" fontWeight="medium" color="fg.muted">
            Export Size
          </Text>
          <DimensionInput
            widthValue={width}
            heightValue={height}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
          />
          <Button
            size="sm"
            width="full"
            variant="solid"
            colorPalette="ultramarine"
            rounded="full"
            onClick={handleExport}
            loading={exporting}
            loadingText="Exporting…"
          >
            <Download size={14} />
            Download PNG
          </Button>
        </VStack>
      </VStack>
    </VStack>
  );
}

import { useCallback, useMemo, useState } from "react";
import {
  Box,
  Button,
  HStack,
  IconButton,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Download, Github, Shuffle } from "lucide-react";
import { ActionIconButton } from "@/components/ui/ActionIconButton";
import { useGradientStore } from "@/store/gradientStore";
import {
  GRADIENT_TYPES,
  WARP_SHAPES,
  EXPORT_FORMATS,
  DEFAULT_WARP_RATIO,
  DEFAULT_WARP_SIZE,
  DEFAULT_NOISE_RATIO,
  DEFAULT_EXPORT_QUALITY,
  MIN_EXPORT_QUALITY,
  MAX_EXPORT_QUALITY,
  type ExportFormat,
} from "@/types";
import {
  hexToNormalizedRgb,
  packColorsForShader,
  packPositionsForShader,
} from "@/lib/colors";
import { exportImage } from "@/lib/export";
import { GradientSelect } from "@/components/ui/GradientSelect";
import { LabeledSlider } from "@/components/ui/LabeledSlider";
import { DimensionInput } from "@/components/ui/DimensionInput";
import { ColorModeButton } from "@/components/ui/color-mode";
import { Tooltip } from "@/components/ui/tooltip";
import { ColorList } from "./ColorList";

export function ControlPanel() {
  const gradientTypeIndex = useGradientStore((s) => s.gradientTypeIndex);
  const warpShapeIndex = useGradientStore((s) => s.warpShapeIndex);
  const warpRatio = useGradientStore((s) => s.warpRatio);
  const warpSize = useGradientStore((s) => s.warpSize);
  const noiseRatio = useGradientStore((s) => s.noiseRatio);
  const width = useGradientStore((s) => s.width);
  const height = useGradientStore((s) => s.height);
  const exportFormat = useGradientStore((s) => s.exportFormat);
  const exportQuality = useGradientStore((s) => s.exportQuality);

  const setGradientTypeIndex = useGradientStore((s) => s.setGradientTypeIndex);
  const setWarpShapeIndex = useGradientStore((s) => s.setWarpShapeIndex);
  const setWarpRatio = useGradientStore((s) => s.setWarpRatio);
  const setWarpSize = useGradientStore((s) => s.setWarpSize);
  const setNoiseRatio = useGradientStore((s) => s.setNoiseRatio);
  const setWidth = useGradientStore((s) => s.setWidth);
  const setHeight = useGradientStore((s) => s.setHeight);
  const setExportFormat = useGradientStore((s) => s.setExportFormat);
  const setExportQuality = useGradientStore((s) => s.setExportQuality);
  const randomizeEffects = useGradientStore((s) => s.randomizeEffects);
  const pushHistory = useGradientStore((s) => s.pushHistory);

  const [exporting, setExporting] = useState(false);

  const currentFormat = useMemo(
    () =>
      EXPORT_FORMATS.find((f) => f.value === exportFormat) ?? EXPORT_FORMATS[0],
    [exportFormat],
  );

  const formatSelectOptions = useMemo(
    () => EXPORT_FORMATS.map((f) => ({ label: f.label, value: f.value })),
    [],
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const state = useGradientStore.getState();
      const fmt =
        EXPORT_FORMATS.find((f) => f.value === state.exportFormat) ??
        EXPORT_FORMATS[0];
      await exportImage(
        {
          resolution: [state.width, state.height],
          time: 0,
          noiseTime: 0,
          bgColor: hexToNormalizedRgb(state.colors[0]?.hex ?? "#000000"),
          colors: packColorsForShader(state.colors.map((c) => c.hex)),
          positions: packPositionsForShader(
            state.colors.map((c) => c.position),
          ),
          numberPoints: state.colors.length,
          noiseRatio: state.noiseRatio,
          warpRatio: state.warpRatio,
          warpSize: state.warpSize,
          mouse: [0.5, 0.5],
          gradientTypeIndex: state.gradientTypeIndex,
          warpShapeIndex: state.warpShapeIndex,
        },
        {
          mime: fmt.mime,
          ext: fmt.ext,
          quality: fmt.lossy ? state.exportQuality / 100 : undefined,
        },
      );
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
        <HStack gap="0">
          <Tooltip content="GitHub repository" openDelay={400} closeDelay={0}>
            <IconButton
              asChild
              variant="ghost"
              aria-label="GitHub repository"
              size="2xs"
            >
              <a
                href="https://github.com/fabriziocuscini/mesh-gradient-generator"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github />
              </a>
            </IconButton>
          </Tooltip>
          <ColorModeButton />
        </HStack>
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

          {/* Effects */}
          <VStack align="stretch" gap="4" px="4">
            <HStack justify="space-between">
              <Text textStyle="xs" fontWeight="medium" color="fg">
                Effects
              </Text>
              <ActionIconButton
                icon={Shuffle}
                label="Randomize effects"
                onClick={randomizeEffects}
              />
            </HStack>
            <LabeledSlider
              label="Warp"
              value={warpRatio}
              min={0}
              max={1}
              step={0.01}
              defaultValue={DEFAULT_WARP_RATIO}
              onChange={setWarpRatio}
              onChangeStart={pushHistory}
            />
            <LabeledSlider
              label="Warp Size"
              value={warpSize}
              min={0}
              max={5}
              step={0.01}
              defaultValue={DEFAULT_WARP_SIZE}
              onChange={setWarpSize}
              onChangeStart={pushHistory}
            />
            <LabeledSlider
              label="Noise"
              value={noiseRatio}
              min={0}
              max={0.2}
              step={0.01}
              defaultValue={DEFAULT_NOISE_RATIO}
              onChange={setNoiseRatio}
              onChangeStart={pushHistory}
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
            Export
          </Text>
          <DimensionInput
            widthValue={width}
            heightValue={height}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
            formatValue={exportFormat}
            formatOptions={formatSelectOptions}
            onFormatChange={(v) => setExportFormat(v as ExportFormat)}
          />
          {currentFormat.lossy && (
            <LabeledSlider
              label="Quality"
              value={exportQuality}
              min={0}
              max={MAX_EXPORT_QUALITY}
              step={1}
              defaultValue={DEFAULT_EXPORT_QUALITY}
              onChange={(v) =>
                setExportQuality(Math.max(MIN_EXPORT_QUALITY, v))
              }
            />
          )}
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
            Download {currentFormat.label}
          </Button>
        </VStack>
      </VStack>
    </VStack>
  );
}

import { useCallback, useMemo, useState } from "react";
import { Download, Github, Loader2, Shuffle } from "lucide-react";
import { ActionIconButton } from "@/components/controls/ActionIconButton";
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
} from "@/types";
import {
  hexToNormalizedRgb,
  packColorsForShader,
  packPositionsForShader,
} from "@/lib/colors";
import { livePositionsRef } from "@/lib/drift";
import { exportImage } from "@/lib/export";
import { SelectRow } from "@/components/controls/SelectRow";
import { LabeledSlider } from "@/components/controls/LabeledSlider";
import { DimensionInput } from "@/components/controls/DimensionInput";
import { PanelSection } from "@/components/controls/PanelSection";
import { ThemeToggleButton } from "@/components/controls/theme";
import { Tooltip } from "@/components/controls/Tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ColorList, ColorListActions } from "./ColorList";

type SectionName = "gradient" | "effects" | "colors" | "export";

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
  // Not persisted, like the rest of this app's state.
  const [openSections, setOpenSections] = useState<
    Record<SectionName, boolean>
  >({ gradient: true, effects: true, colors: true, export: true });

  const toggle = useCallback(
    (name: SectionName) => (open: boolean) =>
      setOpenSections((prev) => ({ ...prev, [name]: open })),
    [],
  );

  const currentFormat = useMemo(
    () =>
      EXPORT_FORMATS.find((f) => f.value === exportFormat) ?? EXPORT_FORMATS[0],
    [exportFormat],
  );

  const formatOptions = useMemo(
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
          // Mid-playback the store still holds the base composition, so
          // take the anchors from the frame actually on screen — otherwise
          // the download is of a gradient you never saw.
          positions: packPositionsForShader(
            livePositionsRef.current ?? state.colors.map((c) => c.position),
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

  // t.id is a shader id, not an array index — pass it through untouched.
  const gradientOptions = GRADIENT_TYPES.map((t) => ({
    label: t.name,
    value: t.id,
  }));

  const warpOptions = WARP_SHAPES.map((s) => ({
    label: s.name,
    value: s.id,
  }));

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white-1000 dark:bg-grey-800">
      <div className="flex h-11 shrink-0 items-center justify-between gap-1 px-4">
        <span className="typography-body-large-strong text-ink">
          Mesh Gradient
        </span>
        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip content="GitHub repository">
            <Button
              variant="ghost"
              size="icon"
              aria-label="GitHub repository"
              render={
                <a
                  href="https://github.com/fabriziocuscini/mesh-gradient-generator"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <Github className="size-4" strokeWidth={1.5} />
            </Button>
          </Tooltip>
          <ThemeToggleButton />
        </div>
      </div>

      <Separator />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <PanelSection
          title="Gradient"
          open={openSections.gradient}
          onOpenChange={toggle("gradient")}
        >
          <SelectRow
            label="Gradient"
            value={gradientTypeIndex}
            options={gradientOptions}
            onChange={setGradientTypeIndex}
          />
          <SelectRow
            label="Warp Shape"
            value={warpShapeIndex}
            options={warpOptions}
            onChange={setWarpShapeIndex}
          />
        </PanelSection>

        <Separator />

        <PanelSection
          title="Effects"
          open={openSections.effects}
          onOpenChange={toggle("effects")}
          actions={
            <ActionIconButton
              icon={Shuffle}
              label="Randomize effects"
              shortcut="Shift+Space"
              onClick={randomizeEffects}
            />
          }
        >
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
        </PanelSection>

        <Separator />

        <PanelSection
          title="Colors"
          open={openSections.colors}
          onOpenChange={toggle("colors")}
          actions={<ColorListActions />}
        >
          <ColorList />
        </PanelSection>

        <Separator />

        <PanelSection
          title="Export"
          open={openSections.export}
          onOpenChange={toggle("export")}
        >
          <DimensionInput
            widthValue={width}
            heightValue={height}
            onWidthChange={setWidth}
            onHeightChange={setHeight}
          />
          <SelectRow
            label="Format"
            value={exportFormat}
            options={formatOptions}
            onChange={setExportFormat}
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
            variant="primary"
            size="large"
            className="mt-1 w-full"
            onClick={handleExport}
            // Chakra's `loading` also disabled the button. Without that, a
            // double-click fires two full-resolution WebGL exports.
            disabled={exporting}
            aria-busy={exporting}
          >
            {exporting ? (
              <Loader2 className="motion-safe:animate-spin" strokeWidth={1.5} />
            ) : (
              <Download strokeWidth={1.5} />
            )}
            {exporting ? "Exporting…" : `Download ${currentFormat.label}`}
          </Button>
        </PanelSection>

        <Separator />
      </div>
    </div>
  );
}

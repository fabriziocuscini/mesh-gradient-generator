import { useCallback, useRef, useState } from "react";
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  FileUpload,
  HStack,
  Icon,
  IconButton,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ImagePlus, Minus, Plus, Upload } from "lucide-react";
import { useGradientStore } from "@/store/gradientStore";
import { ColorAnchorPoint } from "@/components/ui/ColorAnchorPoint";
import { Tooltip } from "@/components/ui/tooltip";
import {
  extractColorsFromImage,
  sampleColorAtPosition,
} from "@/lib/imageColors";

interface Anchor {
  id: string;
  hex: string;
  position: [number, number];
}

let anchorId = 0;
function nextAnchorId(): string {
  return `img-anchor-${++anchorId}`;
}

const DEFAULT_COLOR_COUNT = 5;
const MAX_COLORS = 10;
const MIN_COLORS = 2;

export function ImageColorPicker() {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const loadPalette = useGradientStore((s) => s.loadPalette);

  const reset = useCallback(() => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImage(null);
    setImageSrc(null);
    setAnchors([]);
  }, [imageSrc]);

  const handleOpenChange = useCallback(
    (details: { open: boolean }) => {
      setOpen(details.open);
      if (!details.open) reset();
    },
    [reset],
  );

  const handleFileAccept = useCallback((details: { files: File[] }) => {
    const file = details.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setImageSrc(url);
      const extracted = extractColorsFromImage(img, DEFAULT_COLOR_COUNT);
      setAnchors(
        extracted.map((c) => ({
          id: nextAnchorId(),
          hex: c.hex,
          position: c.position,
        })),
      );
    };
    img.src = url;
  }, []);

  const handleDrag = useCallback(
    (id: string, nx: number, ny: number) => {
      if (!image) return;
      const hex = sampleColorAtPosition(image, nx, ny);
      setAnchors((prev) =>
        prev.map((a) => (a.id === id ? { ...a, hex, position: [nx, ny] } : a)),
      );
    },
    [image],
  );

  const handleAddColor = useCallback(() => {
    if (!image || anchors.length >= MAX_COLORS) return;
    const nx = Math.random();
    const ny = Math.random();
    const hex = sampleColorAtPosition(image, nx, ny);
    setAnchors((prev) => [
      ...prev,
      { id: nextAnchorId(), hex, position: [nx, ny] },
    ]);
  }, [image, anchors.length]);

  const handleRemoveColor = useCallback(() => {
    if (anchors.length <= MIN_COLORS) return;
    setAnchors((prev) => prev.slice(0, -1));
  }, [anchors.length]);

  const handleDone = useCallback(() => {
    loadPalette(anchors.map((a) => a.hex));
    setOpen(false);
    reset();
  }, [anchors, loadPalette, reset]);

  const hasImage = image !== null;

  return (
    <Dialog.Root
      lazyMount
      open={open}
      onOpenChange={handleOpenChange}
      size="lg"
      placement="center"
    >
      <Tooltip content="Upload image" openDelay={400} closeDelay={0}>
        <Dialog.Trigger asChild>
          <IconButton aria-label="Upload image" variant="ghost" size="2xs">
            <ImagePlus size={14} />
          </IconButton>
        </Dialog.Trigger>
      </Tooltip>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" position="absolute" top="2" insetEnd="2" />
            </Dialog.CloseTrigger>

            <Dialog.Body pt="10" pb={hasImage ? "0" : "10"} px="6">
              {!hasImage ? (
                <FileUpload.Root
                  accept={["image/*"]}
                  maxFiles={1}
                  onFileAccept={handleFileAccept}
                >
                  <FileUpload.HiddenInput />
                  <FileUpload.Dropzone
                    width="full"
                    py="16"
                    cursor="pointer"
                    borderStyle="dashed"
                  >
                    <VStack gap="3">
                      <Icon size="xl" color="fg.muted">
                        <Upload />
                      </Icon>
                      <VStack gap="1">
                        <Text textStyle="sm" fontWeight="medium">
                          Paste or{" "}
                          <Box
                            as="span"
                            color="colorPalette.fg"
                            colorPalette="ultramarine"
                          >
                            upload a photo
                          </Box>{" "}
                          to turn
                        </Text>
                        <Text textStyle="sm" fontWeight="medium">
                          it into a beautiful gradient
                        </Text>
                      </VStack>
                    </VStack>
                  </FileUpload.Dropzone>
                </FileUpload.Root>
              ) : (
                <Box display="flex" justifyContent="center">
                  <Box
                    ref={imageContainerRef}
                    position="relative"
                    borderRadius="md"
                    overflow="hidden"
                    userSelect="none"
                  >
                    <img
                      src={imageSrc!}
                      alt="Uploaded"
                      style={{
                        display: "block",
                        maxWidth: "100%",
                        maxHeight: "60vh",
                        width: "auto",
                        height: "auto",
                      }}
                      draggable={false}
                    />
                    {anchors.map((anchor) => (
                      <ColorAnchorPoint
                        key={anchor.id}
                        hex={anchor.hex}
                        x={anchor.position[0]}
                        y={anchor.position[1]}
                        containerRef={imageContainerRef}
                        onDragStart={() => {}}
                        onDrag={(nx, ny) => handleDrag(anchor.id, nx, ny)}
                        onDragEnd={() => {}}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Dialog.Body>

            {hasImage && (
              <Dialog.Footer px="6" pb="5" pt="4">
                <HStack flex="1" justify="space-between">
                  <HStack gap="2">
                    <Button
                      size="sm"
                      variant="outline"
                      rounded="full"
                      onClick={handleRemoveColor}
                      disabled={anchors.length <= MIN_COLORS}
                    >
                      <Minus size={14} />
                      Color
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      rounded="full"
                      onClick={handleAddColor}
                      disabled={anchors.length >= MAX_COLORS}
                    >
                      <Plus size={14} />
                      Color
                    </Button>
                  </HStack>
                  <Button
                    size="sm"
                    variant="solid"
                    rounded="full"
                    colorPalette="ultramarine"
                    onClick={handleDone}
                  >
                    Done
                  </Button>
                </HStack>
              </Dialog.Footer>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

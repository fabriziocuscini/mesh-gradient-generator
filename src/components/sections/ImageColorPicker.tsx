import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Minus, Plus, Upload } from "lucide-react";
import { useGradientStore } from "@/store/gradientStore";
import { ColorAnchorPoint } from "@/components/controls/ColorAnchorPoint";
import { Tooltip } from "@/components/controls/Tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  extractColorsFromImage,
  sampleColorAtPosition,
} from "@/lib/imageColors";
import { cn } from "@/lib/utils";

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

interface ImageColorPickerProps {
  /** Extra classes for the trigger button, so the floating toolbar can size
   *  it at 32px while a panel header would leave it at 24px. */
  triggerClassName?: string;
}

export function ImageColorPicker({ triggerClassName }: ImageColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [dragging, setDragging] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const loadPalette = useGradientStore((s) => s.loadPalette);

  const reset = useCallback(() => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImage(null);
    setImageSrc(null);
    setAnchors([]);
    setDragging(false);
  }, [imageSrc]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (!isOpen) reset();
    },
    [reset],
  );

  const acceptFile = useCallback((file: File | null | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;

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

  // The copy has always said "Paste or upload a photo". Chakra's FileUpload
  // never handled paste, so this is the first time it has been true.
  useEffect(() => {
    if (!open || image) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.items ?? [])]
        .find((item) => item.type.startsWith("image/"))
        ?.getAsFile();
      if (file) {
        e.preventDefault();
        acceptFile(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [open, image, acceptFile]);

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip content="Upload image">
        <DialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className={triggerClassName}
              aria-label="Upload image"
            >
              <ImagePlus className="size-4" strokeWidth={1.5} />
            </Button>
          }
        />
      </Tooltip>

      <DialogPopup className="w-[min(640px,calc(100vw-48px))] p-6">
        <DialogTitle className="sr-only">
          Extract a palette from an image
        </DialogTitle>
        <DialogClose />

        {!hasImage ? (
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 transition-colors",
              dragging
                ? "border-blue-500 bg-blue-100 dark:bg-pale-blue-900"
                : "border-grey-300 dark:border-grey-600",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              acceptFile(e.dataTransfer.files[0]);
            }}
          >
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
            <Upload className="size-6 text-black-500 dark:text-white-500" />
            <div className="typography-body-large text-center text-black-800 dark:text-white-1000">
              <p>
                Paste or{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  upload a photo
                </span>{" "}
                to turn
              </p>
              <p>it into a beautiful gradient</p>
            </div>
          </label>
        ) : (
          <>
            <div className="flex justify-center">
              <div
                ref={imageContainerRef}
                className="relative overflow-hidden rounded-md select-none"
              >
                <img
                  src={imageSrc!}
                  alt="Uploaded"
                  className="block h-auto max-h-[60vh] w-auto max-w-full"
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
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="large"
                  onClick={handleRemoveColor}
                  disabled={anchors.length <= MIN_COLORS}
                >
                  <Minus />
                  Color
                </Button>
                <Button
                  variant="secondary"
                  size="large"
                  onClick={handleAddColor}
                  disabled={anchors.length >= MAX_COLORS}
                >
                  <Plus />
                  Color
                </Button>
              </div>
              <Button variant="primary" size="large" onClick={handleDone}>
                Done
              </Button>
            </div>
          </>
        )}
      </DialogPopup>
    </Dialog>
  );
}

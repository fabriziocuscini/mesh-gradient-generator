import chroma from "chroma-js";

/**
 * Converts a hex color string to normalized RGB values (0-1 range).
 */
export function hexToNormalizedRgb(hex: string): [number, number, number] {
  const clean = (hex || "#000000").replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [
    Number.isFinite(r) ? r : 0,
    Number.isFinite(g) ? g : 0,
    Number.isFinite(b) ? b : 0,
  ];
}

/**
 * Packs an array of hex colors into a flat Float32Array of normalized RGB triplets.
 * Always outputs 30 floats (10 colors * 3 channels) to match the shader's u_colors[10].
 */
export function packColorsForShader(hexColors: string[]): Float32Array {
  const data = new Float32Array(30);
  for (let i = 0; i < Math.min(hexColors.length, 10); i++) {
    const [r, g, b] = hexToNormalizedRgb(hexColors[i]);
    data[i * 3] = r;
    data[i * 3 + 1] = g;
    data[i * 3 + 2] = b;
  }
  return data;
}

/**
 * Packs position tuples into a flat Float32Array.
 * Always outputs 20 floats (10 positions * 2 coords) to match the shader's u_positions[10].
 */
export function packPositionsForShader(
  positions: [number, number][],
): Float32Array {
  const data = new Float32Array(20);
  for (let i = 0; i < Math.min(positions.length, 10); i++) {
    data[i * 2] = positions[i][0];
    data[i * 2 + 1] = positions[i][1];
  }
  return data;
}

export function randomHexColor(): string {
  const hex = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0");
  return `#${hex}`;
}

const MIN_LIGHTNESS = 0.3;
const MAX_LIGHTNESS = 0.92;
// Below this OKLCH chroma a colour reads as grey, and its hue is meaningless.
const GREY_CHROMA = 0.03;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function jitter(amount: number): number {
  return (Math.random() * 2 - 1) * amount;
}

/**
 * Finds the hue in the middle of the widest empty arc on the hue wheel, so a
 * new swatch lands as far as it can from every hue already in the palette.
 */
function hueInWidestGap(hues: number[]): number {
  if (hues.length === 1) return (hues[0] + 180) % 360;
  const sorted = [...hues].sort((a, b) => a - b);
  let bestStart = sorted[0];
  let bestGap = 0;
  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length];
    const gap = (next - sorted[i] + 360) % 360;
    if (gap > bestGap) {
      bestGap = gap;
      bestStart = sorted[i];
    }
  }
  // Every colour sits on the same hue, so there is no gap to speak of.
  if (bestGap === 0) return (sorted[0] + 180) % 360;
  return (bestStart + bestGap / 2) % 360;
}

/**
 * The same idea one axis over: for a palette with no usable hue, spread the
 * new swatch through the lightness range instead.
 */
function lightnessInWidestGap(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const stops = [MIN_LIGHTNESS, ...sorted, MAX_LIGHTNESS];
  let best = (MIN_LIGHTNESS + MAX_LIGHTNESS) / 2;
  let bestGap = -1;
  for (let i = 0; i < stops.length - 1; i++) {
    const gap = stops[i + 1] - stops[i];
    if (gap > bestGap) {
      bestGap = gap;
      best = stops[i] + gap / 2;
    }
  }
  return best;
}

/**
 * OKLCH describes colours the eye can see but a screen cannot always show.
 * Drop the chroma until the colour fits in sRGB, rather than let chroma-js
 * clip the channels, which shifts the hue.
 */
function fitToSrgb(lightness: number, colorfulness: number, hue: number) {
  for (let c = colorfulness; c > 0; c -= 0.005) {
    const candidate = chroma.oklch(lightness, c, hue);
    if (!candidate.clipped()) return candidate.hex();
  }
  return chroma.oklch(lightness, 0, hue).hex();
}

/**
 * Picks a colour that belongs with the ones already in the list. It borrows
 * the palette's median lightness and chroma, so the new swatch carries the
 * same weight and saturation, and takes the hue in the middle of the widest
 * empty arc, so it is still plainly its own colour. A little jitter keeps a
 * run of additions from looking mechanical.
 */
export function harmoniousHexColor(existing: string[]): string {
  const palette = existing
    .filter((hex) => chroma.valid(hex))
    .map((hex) => chroma(hex).oklch());
  if (palette.length === 0) return randomHexColor();

  const lightnesses = palette.map(([l]) => l);
  const chromas = palette.map(([, c]) => c);
  const hues = palette
    .filter(([, c, h]) => c > GREY_CHROMA && Number.isFinite(h))
    .map(([, , h]) => h);

  const colorfulness = Math.max(0, median(chromas) + jitter(0.015));

  if (hues.length === 0) {
    // Every colour is a grey, so a hue gap says nothing. Space the new one
    // out by lightness and keep it grey.
    const lightness = lightnessInWidestGap(lightnesses);
    return fitToSrgb(lightness, colorfulness, Math.random() * 360);
  }

  const lightness = Math.min(
    MAX_LIGHTNESS,
    Math.max(MIN_LIGHTNESS, median(lightnesses) + jitter(0.06)),
  );
  const hue = (hueInWidestGap(hues) + jitter(8) + 360) % 360;
  return fitToSrgb(lightness, colorfulness, hue);
}

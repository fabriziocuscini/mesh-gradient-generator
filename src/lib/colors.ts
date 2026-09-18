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

/**
 * How the + button picks the colour it adds. Every rule but "random" keeps the
 * palette's median lightness and median chroma, so the new swatch has the same
 * weight and saturation as the ones around it, and only the hue is in
 * question.
 */
export const COLOR_STRATEGIES = [
  {
    value: "extend",
    label: "Extend the run",
    description: "Carry on past the end of the hues already used",
  },
  {
    value: "nearby",
    label: "Nearby hue",
    description: "A short step from one of the colours in the list",
  },
  {
    value: "harmonic",
    label: "Harmonic",
    description: "A classic interval away: 30, 60, 150 or 180 degrees",
  },
  {
    value: "random",
    label: "Random",
    description: "Anything at all",
  },
] as const;

export type ColorStrategy = (typeof COLOR_STRATEGIES)[number]["value"];

export const DEFAULT_COLOR_STRATEGY: ColorStrategy = "extend";

const MIN_LIGHTNESS = 0.3;
const MAX_LIGHTNESS = 0.92;
// Below this OKLCH chroma a colour reads as grey, and its hue is meaningless.
const GREY_CHROMA = 0.03;
/** How far "extend the run" and "nearby hue" step, in degrees. */
const MIN_STEP = 14;
const MAX_STEP = 38;
const HARMONIC_INTERVALS = [30, 60, 150, 180];
/** A harmonic interval landing this close to a hue in use is tried again. */
const TOO_CLOSE = 18;

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

function pick<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function step(): number {
  return MIN_STEP + Math.random() * (MAX_STEP - MIN_STEP);
}

function wrap(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

/** The shorter way round the wheel between two hues, 0 to 180. */
function hueDistance(a: number, b: number): number {
  const raw = Math.abs(wrap(a) - wrap(b));
  return raw > 180 ? 360 - raw : raw;
}

/**
 * The two ends of the arc the palette occupies. Found through its opposite:
 * the widest empty gap is the part of the wheel the palette does not use, so
 * the hues on either side of that gap are where the run starts and stops.
 */
function occupiedArc(hues: number[]): { start: number; end: number } {
  const sorted = [...hues].sort((a, b) => a - b);
  let end = sorted[0];
  let widest = 0;
  for (let i = 0; i < sorted.length; i++) {
    const next = sorted[(i + 1) % sorted.length];
    const gap = wrap(next - sorted[i]);
    if (gap > widest) {
      widest = gap;
      end = sorted[i];
    }
  }
  return { start: wrap(end + widest), end };
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

/** Walks outward from whichever end of the palette's own hue range. */
function extendedHue(hues: number[]): number {
  if (hues.length === 1) return wrap(hues[0] + step());
  const { start, end } = occupiedArc(hues);
  return Math.random() < 0.5 ? wrap(end + step()) : wrap(start - step());
}

/** A short step off one of the hues already in the list, either way. */
function nearbyHue(hues: number[]): number {
  const from = pick(hues);
  return wrap(from + step() * (Math.random() < 0.5 ? -1 : 1));
}

/**
 * A classic interval off one of the hues already in the list. Intervals that
 * land on a hue the palette is using are discarded, so this does not quietly
 * repeat a colour; if they all do, the nearby rule stands in.
 */
function harmonicHue(hues: number[]): number {
  const candidates = HARMONIC_INTERVALS.flatMap((interval) =>
    [1, -1].map((sign) => wrap(pick(hues) + interval * sign)),
  ).filter((hue) => hues.every((used) => hueDistance(hue, used) > TOO_CLOSE));
  return candidates.length > 0 ? pick(candidates) : nearbyHue(hues);
}

/**
 * Picks the colour the + button adds, under the rule the user has chosen.
 *
 * Apart from "random", all of them read the palette in OKLCH — where
 * lightness, chroma and hue come apart the way the eye sees them — take the
 * median lightness and median chroma so the new swatch sits with the rest,
 * and differ only in where they put the hue. Small jitter on all three keeps
 * a run of additions from looking mechanical.
 */
export function paletteHexColor(
  existing: string[],
  strategy: ColorStrategy = DEFAULT_COLOR_STRATEGY,
): string {
  if (strategy === "random") return randomHexColor();

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
    // Every colour is a grey, so no hue rule has anything to work from.
    // Space the new one out by lightness and keep it grey.
    return fitToSrgb(
      lightnessInWidestGap(lightnesses),
      colorfulness,
      Math.random() * 360,
    );
  }

  const lightness = Math.min(
    MAX_LIGHTNESS,
    Math.max(MIN_LIGHTNESS, median(lightnesses) + jitter(0.06)),
  );
  const hue =
    strategy === "extend"
      ? extendedHue(hues)
      : strategy === "harmonic"
        ? harmonicHue(hues)
        : nearbyHue(hues);

  return fitToSrgb(lightness, colorfulness, wrap(hue + jitter(5)));
}

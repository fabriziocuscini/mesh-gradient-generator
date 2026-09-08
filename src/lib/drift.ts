/**
 * Anchor drift — the motion model behind the play button.
 *
 * Each anchor gets a sinusoidal offset per axis on top of its stored base
 * position:
 *
 *   x = base.x + ax * sin(t * fx + px)
 *   y = base.y + ay * sin(t * fy + py)
 *
 * The warp pattern itself stays frozen (u_time = 0) — every bit of the
 * motion comes from the anchors moving, which is what makes it read as a
 * composition breathing rather than a texture scrolling past.
 */

export interface MeshDrift {
  /** Amplitude per axis, as a fraction of the canvas. */
  ax: number;
  ay: number;
  /** Angular frequency per axis (rad/s). */
  fx: number;
  fy: number;
  /** Phase offset per axis (rad). */
  px: number;
  py: number;
}

/** Amplitudes of 12–16% of the canvas give clearly visible travel. */
const MIN_AMPLITUDE = 0.12;
const MAX_AMPLITUDE = 0.16;

/** 0.34–0.61 rad/s — full cycles of roughly 10 to 18 seconds. */
const MIN_FREQUENCY = 0.34;
const MAX_FREQUENCY = 0.61;

const TAU = Math.PI * 2;

/**
 * The golden angle. Successive multiples never cluster, so no two anchors
 * start anywhere near in phase with each other.
 */
const GOLDEN_ANGLE = 2.399963229728653;

/** R1 low-discrepancy constants, for the same job on the [0,1) ranges. */
const R1_A = 0.7548776662466927;
const R1_B = 0.5698402909980532;

function frac(value: number): number {
  return value - Math.floor(value);
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}

/**
 * Drift parameters for the anchor at `index`.
 *
 * These are derived rather than authored because the colour count here
 * changes as points are added, removed and reordered. Spreading amplitude,
 * frequency and phase across the ranges above with low-discrepancy
 * sequences keeps the one property that matters: no two anchors move in
 * step, which is the difference between a composition that feels alive and
 * one that sways as a single block.
 */
export function driftForIndex(index: number): MeshDrift {
  // Offset so anchor 0 doesn't sit on the floor of every range.
  const i = index + 0.5;
  return {
    ax: lerp(MIN_AMPLITUDE, MAX_AMPLITUDE, frac(i * R1_A)),
    ay: lerp(MIN_AMPLITUDE, MAX_AMPLITUDE, frac(i * R1_B + 0.37)),
    fx: lerp(MIN_FREQUENCY, MAX_FREQUENCY, frac(i * R1_B)),
    fy: lerp(MIN_FREQUENCY, MAX_FREQUENCY, frac(i * R1_A + 0.61)),
    px: frac((i * GOLDEN_ANGLE) / TAU) * TAU,
    py: frac((i * GOLDEN_ANGLE + 1.7) / TAU) * TAU,
  };
}

/** The offset to add to anchor `index`'s base position at `seconds`. */
export function driftOffset(index: number, seconds: number): [number, number] {
  const { ax, ay, fx, fy, px, py } = driftForIndex(index);
  return [ax * Math.sin(seconds * fx + px), ay * Math.sin(seconds * fy + py)];
}

/** Base positions offset by their drift at `seconds`. */
export function applyDrift(
  basePositions: [number, number][],
  seconds: number,
): [number, number][] {
  return basePositions.map(([x, y], i) => {
    const [dx, dy] = driftOffset(i, seconds);
    return [x + dx, y + dy];
  });
}

/**
 * The anchor positions currently on screen while playback runs, or null
 * when it doesn't. Export reads this so a download taken mid-animation
 * matches the frame you can see — the store keeps the base composition
 * until playback is paused, so it can't answer that question itself.
 *
 * A module-level ref rather than store state, matching `clapAnalyserRef`:
 * it changes every frame and nothing should re-render when it does.
 */
export const livePositionsRef: { current: [number, number][] | null } = {
  current: null,
};

/**
 * Where an anchor dot sits over the canvas.
 *
 * Its own module rather than a second export from ColorAnchorPoint: the
 * playback loop writes these offsets straight onto the dots each frame, and
 * a non-component export alongside a component costs that file fast refresh.
 */

/** Half the dot's hit area, in CSS pixels. */
export const ANCHOR_RADIUS = 14;

/**
 * A normalised coordinate as a CSS offset, held far enough inside the canvas
 * that the dot stays grabbable when an anchor sits on — or drifts past — the
 * edge.
 */
export function anchorInset(normalized: number): string {
  return `clamp(${ANCHOR_RADIUS}px, ${normalized * 100}%, calc(100% - ${ANCHOR_RADIUS}px))`;
}

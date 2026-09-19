# mesh-gradient-generator

## 0.10.0

### Minor Changes

- The + button adds a new swatch at the top of the colour list, and the colour
  it picks now belongs with the palette: the generator reads the existing
  colours through chroma-js in OKLCH, borrows their median lightness and median
  chroma, and places only the hue. A three-dot menu beside the + chooses the
  hue rule, between extending the run of hues already used, a nearby hue, a
  harmonic interval and plain random.
- Resting the pointer on an option in the Gradient or Warp Shape menu shows it
  on the canvas, with the usual crossfade, after a 180ms dwell. Nothing is
  committed until a click.
- Undo and redo have their own pill on the right of the floating toolbar, each
  greyed out when its stack is empty.

### Patch Changes

- A new `--opacity-disabled` token at 0.35 gives every disabled control the
  same treatment, in place of FigUI's colour-only version.
- Menu radio items mark the chosen one with the same tick a select uses.
- The image dialog fades and rises into place over 200ms behind a darker
  scrim, and its drop zone no longer runs under the close button.
- The + button greys out at the ten-colour cap rather than disappearing.
- The collapsed toolbar tab lost the line across its bottom.

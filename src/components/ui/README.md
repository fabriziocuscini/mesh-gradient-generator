# Vendored FigUI primitives

Everything in this folder except `collapsible.tsx`, `dialog.tsx` and
`popover.tsx` is copied verbatim from [FigUI](https://figui.dev), a collection
of Figma UI3 components distributed as a shadcn registry. Treat it as vendored:
build on it from `src/components/controls/`, don't edit it in place.

## Refreshing

```bash
bunx --bun shadcn@latest add --yes --overwrite \
  https://figui.dev/r/{button,select,input,checkbox,switch,tabs,separator,radio,slider,tooltip,segmented-control,menu}.json
bun run format          # upstream wraps at 100 columns, this repo at 80
git diff src/components/ui
```

The format pass only re-wraps lines; it reorders no Tailwind classes. Anything
else in that diff is a real upstream change.

## Recorded patches

Re-apply these after a refresh. Each is marked in place with a `FIGUI PATCH`
comment.

| File                                  | Patch                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slider.tsx`                          | Adds a `thumbProps` passthrough. Slider renders its own thumb and ignores children, so double-click-to-reset had nowhere to bind; on `Root` the first click would jump the value off the track before the reset fired.                                                                                                                                     |
| `select.tsx`                          | Drops a stray `]` in a class string.                                                                                                                                                                                                                                                                                                                       |
| `button.tsx`, `segmented-control.tsx` | Drop a dead `import * as React`. This repo builds with `noUnusedLocals`.                                                                                                                                                                                                                                                                                   |
| `button.tsx`                          | Drops a redundant `[&_svg]:size-4` from the base class. It sat beside `[&_svg:not([class*='size-'])]:size-4`, whose whole purpose is to let a caller size an icon by putting a size class on it, and defeated it: `.btn svg` (0,1,1) outranks the icon's own `.size-3` (0,1,0). The `:not()` rule alone gives the same 16px default and works as designed. |

## Deliberate omissions

`input/input-group.tsx` is taken from the published registry, which lacks the
`InputGroupButton` that exists on FigUI's `main`. Nothing here needs it (Figma
puts a row's remove control outside the input group), and the registry version
carries explanatory comments that `main` has since stripped.

FigUI ships no popover, dialog or collapsible, and its `color-picker.tsx` is an
unexported stub of three empty functions. `collapsible.tsx`, `dialog.tsx` and
`popover.tsx` here are ours, written against Base UI to match the house style.
The saturation square comes from `react-colorful`.

# Mesh Gradient Generator

A real-time, GPU-accelerated mesh gradient generator built with React and WebGL 2. Design beautiful, organic gradients with full control over colors, blending styles, warp distortions, and noise — then export at any resolution as PNG.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite)
![WebGL](https://img.shields.io/badge/WebGL_2-GPU_Accelerated-orange)

---

## Features

### Color Management

- **2–10 color stops** — add or remove individual colors from the control panel
- **Hex color picker** — click any anchor point on the canvas or its swatch in the panel to open a full color picker with hex input
- **Drag to reorder** — rearrange colors in the list via drag-and-drop handles to control layering
- **Preset palettes** — starts with one of four curated palettes, randomised on load

### Canvas Interactivity

- **Drag anchor points** — click and drag any color's anchor point directly on the canvas to reposition it in real time
- **Hover to reveal** — anchor points appear when you hover over the canvas and fade out when you leave
- **Highlighted feedback** — hovering a color swatch in the panel highlights its corresponding anchor on the canvas

### Gradient Styles

Choose from five distinct gradient blending algorithms:

| Style            | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| **Sharp Bézier** | Enhanced Gaussian falloff for crisp, defined color regions |
| **Soft Bézier**  | Smooth Gaussian-like blending between colors               |
| **Mesh Static**  | Fixed 3×3 grid interpolation for structured gradients      |
| **Mesh Grid**    | Color positions mapped onto a 3×3 grid for organic layouts |
| **Simple**       | Distance-based blending for classic radial mixing          |

### Warp & Distortion

Apply spatial distortion to the gradient using 14 warp shapes:

Simplex Noise · Circular · Value Noise · Worley Noise · FBM Noise · Voronoi Noise · Domain Warping · Waves · Smooth Noise · Oval · Rows · Columns · Flat · Gravity

Fine-tune distortion with three sliders:

- **Warp Intensity** (0–1) — how strongly the warp displaces the gradient
- **Warp Size** (0–5) — the scale/frequency of the warp pattern
- **Noise Texture** (0–0.2) — adds a subtle grain layer over the gradient

### Export

- **Custom resolution** — set width and height independently, from 100px up to 7680px (8K)
- **PNG download** — renders to an offscreen WebGL canvas at full resolution and saves as `mesh-gradient-{W}x{H}.png`
- Default export size: **2560 × 1440**

### Keyboard Shortcuts

| Key     | Action                             |
| ------- | ---------------------------------- |
| `Space` | Randomise all anchor positions     |
| `R`     | Randomise the entire color palette |
| `D`     | Toggle light / dark mode           |

All shortcuts are disabled while typing in input fields.

### Appearance

- **Light and dark mode** — toggle via the header button or press `D`
- **Resizable layout** — the canvas and control panel are split with a draggable divider; double-click the handle to reset

---

## Tech Stack

| Layer                | Technology                                                                          |
| -------------------- | ----------------------------------------------------------------------------------- |
| **Framework**        | [React 19](https://react.dev) with [TypeScript 5.9](https://www.typescriptlang.org) |
| **Build tool**       | [Vite 8](https://vite.dev)                                                          |
| **Rendering**        | WebGL 2 with custom GLSL vertex & fragment shaders                                  |
| **Shader imports**   | [vite-plugin-glsl](https://github.com/UstymUkhman/vite-plugin-glsl)                 |
| **UI components**    | [Chakra UI v3](https://chakra-ui.com) + [Emotion](https://emotion.sh)               |
| **State management** | [Zustand](https://zustand.docs.pmnd.rs)                                             |
| **Color picker**     | [react-colorful](https://github.com/omgovich/react-colorful)                        |
| **Drag & drop**      | [@dnd-kit/react](https://dndkit.com)                                                |
| **Animations**       | [Motion](https://motion.dev) (AnimatePresence)                                      |
| **Icons**            | [Lucide React](https://lucide.dev)                                                  |
| **Theming**          | [next-themes](https://github.com/pacocoursey/next-themes)                           |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm**, **yarn**, or **pnpm**

### Installation

```bash
git clone https://github.com/your-username/mesh-gradient-generator.git
cd mesh-gradient-generator
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in a WebGL 2–capable browser.

### Build for Production

```bash
npm run build
npm run preview
```

### Linting & Formatting

```bash
npm run lint
npm run format
```

---

## Project Structure

```
src/
├── main.tsx                         # Entry point
├── App.tsx                          # Layout, splitter, keyboard shortcuts
├── theme.ts                         # Chakra UI theme configuration
├── types.ts                         # Shared types, gradient/warp definitions, palettes
├── components/
│   ├── sections/
│   │   ├── GradientCanvas.tsx       # WebGL canvas with interactive anchor points
│   │   ├── ControlPanel.tsx         # Sidebar controls, sliders, and export
│   │   └── ColorList.tsx            # Sortable color list with drag-and-drop
│   └── ui/
│       ├── ColorAnchorPoint.tsx     # Draggable anchor point on canvas
│       ├── ColorPicker.tsx          # Hex color picker popover
│       ├── ColorSwatch.tsx          # Color circle with label and actions
│       ├── GradientSelect.tsx       # Dropdown for gradient type / warp shape
│       ├── DimensionInput.tsx       # Width / height number inputs
│       ├── LabeledSlider.tsx        # Slider with label and live value
│       ├── ActionIconButton.tsx     # Icon button with tooltip
│       └── color-mode.tsx           # Light / dark mode toggle
├── store/
│   └── gradientStore.ts            # Zustand store for all app state
├── hooks/
│   └── useWebGLRenderer.ts         # WebGL 2 program lifecycle and rendering
├── lib/
│   ├── colors.ts                   # Hex ↔ RGB conversion, shader packing
│   ├── export.ts                   # Offscreen canvas PNG export
│   └── webgl.ts                    # Shader compilation, uniform management
└── shaders/
    ├── shader.vert                 # Fullscreen quad vertex shader
    └── shader.frag                 # Gradient, warp, and noise fragment shader
```

---

## License

MIT

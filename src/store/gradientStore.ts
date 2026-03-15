import { create } from "zustand";
import {
  type ColorPoint,
  PALETTES,
  WARP_SHAPES,
  DEFAULT_GRADIENT_TYPE_INDEX,
  DEFAULT_WARP_RATIO,
  DEFAULT_WARP_SIZE,
  DEFAULT_NOISE_RATIO,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
} from "@/types";

let nextId = 0;
function uid(): string {
  return `cp-${++nextId}-${Math.random().toString(36).slice(2, 7)}`;
}

function randomPosition(): [number, number] {
  return [Math.random(), Math.random()];
}

function createColorPoint(hex: string): ColorPoint {
  return { id: uid(), hex, position: randomPosition() };
}

function createInitialColors(): ColorPoint[] {
  const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  return palette.map(createColorPoint);
}

function randomWarpShapeIndex(): number {
  return WARP_SHAPES[Math.floor(Math.random() * WARP_SHAPES.length)].id;
}

export interface GradientStore {
  colors: ColorPoint[];
  gradientTypeIndex: number;
  warpShapeIndex: number;
  warpRatio: number;
  warpSize: number;
  noiseRatio: number;
  width: number;
  height: number;
  highlightedColorId: string | null;
  selectedColorId: string | null;

  setGradientTypeIndex: (index: number) => void;
  setWarpShapeIndex: (index: number) => void;
  setWarpRatio: (value: number) => void;
  setWarpSize: (value: number) => void;
  setNoiseRatio: (value: number) => void;
  setWidth: (value: number) => void;
  setHeight: (value: number) => void;

  setColorHex: (id: string, hex: string) => void;
  setColorPosition: (id: string, position: [number, number]) => void;
  addColor: (hex: string) => void;
  removeColor: (id: string) => void;
  reorderColors: (fromIndex: number, toIndex: number) => void;
  randomizePositions: () => void;
  loadPalette: (palette: string[]) => void;
  randomizePalette: () => void;
  setHighlightedColorId: (id: string | null) => void;
  setSelectedColorId: (id: string | null) => void;
}

export const useGradientStore = create<GradientStore>((set) => ({
  colors: createInitialColors(),
  gradientTypeIndex: DEFAULT_GRADIENT_TYPE_INDEX,
  warpShapeIndex: randomWarpShapeIndex(),
  warpRatio: DEFAULT_WARP_RATIO,
  warpSize: DEFAULT_WARP_SIZE,
  noiseRatio: DEFAULT_NOISE_RATIO,
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
  highlightedColorId: null,
  selectedColorId: null,

  setGradientTypeIndex: (index) => set({ gradientTypeIndex: index }),
  setWarpShapeIndex: (index) => set({ warpShapeIndex: index }),
  setWarpRatio: (value) => set({ warpRatio: value }),
  setWarpSize: (value) => set({ warpSize: value }),
  setNoiseRatio: (value) => set({ noiseRatio: value }),
  setWidth: (value) => set({ width: value }),
  setHeight: (value) => set({ height: value }),

  setColorHex: (id, hex) =>
    set((state) => {
      if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return state;
      return {
        colors: state.colors.map((c) => (c.id === id ? { ...c, hex } : c)),
      };
    }),

  setColorPosition: (id, position) =>
    set((state) => ({
      colors: state.colors.map((c) => (c.id === id ? { ...c, position } : c)),
    })),

  addColor: (hex) =>
    set((state) => {
      if (state.colors.length >= 10) return state;
      const safe = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#888888";
      return { colors: [...state.colors, createColorPoint(safe)] };
    }),

  removeColor: (id) =>
    set((state) => {
      if (state.colors.length <= 2) return state;
      return { colors: state.colors.filter((c) => c.id !== id) };
    }),

  reorderColors: (fromIndex, toIndex) =>
    set((state) => {
      const positions = state.colors.map((c) => c.position);
      const next = [...state.colors];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return {
        colors: next.map((c, i) => ({ ...c, position: positions[i] })),
      };
    }),

  randomizePositions: () =>
    set((state) => ({
      colors: state.colors.map((c) => ({ ...c, position: randomPosition() })),
    })),

  loadPalette: (palette) => set({ colors: palette.map(createColorPoint) }),

  randomizePalette: () =>
    set(() => {
      const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
      return { colors: palette.map(createColorPoint) };
    }),

  setHighlightedColorId: (id) => set({ highlightedColorId: id }),
  setSelectedColorId: (id) =>
    set({ selectedColorId: id, highlightedColorId: id }),
}));

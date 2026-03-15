export interface ColorPoint {
  id: string;
  hex: string;
  position: [number, number];
}

export interface GradientValues {
  colors: ColorPoint[];
  gradientTypeIndex: number;
  warpShapeIndex: number;
  warpRatio: number;
  warpSize: number;
  noiseRatio: number;
  width: number;
  height: number;
}

export interface GradientType {
  name: string;
  id: number;
}

export interface WarpShape {
  name: string;
  id: number;
}

export const GRADIENT_TYPES: GradientType[] = [
  { name: "Sharp Bézier", id: 4 },
  { name: "Soft Bézier", id: 1 },
  { name: "Mesh Static", id: 2 },
  { name: "Mesh Grid", id: 3 },
  { name: "Simple", id: 0 },
];

export const WARP_SHAPES: WarpShape[] = [
  { name: "Simplex Noise", id: 0 },
  { name: "Circular", id: 1 },
  { name: "Value Noise", id: 2 },
  { name: "Worley Noise", id: 3 },
  { name: "FBM Noise", id: 4 },
  { name: "Voronoi Noise", id: 5 },
  { name: "Domain Warping", id: 6 },
  { name: "Waves", id: 7 },
  { name: "Smooth Noise", id: 8 },
  { name: "Oval", id: 9 },
  { name: "Rows", id: 10 },
  { name: "Columns", id: 11 },
  { name: "Flat", id: 12 },
  { name: "Gravity", id: 13 },
];

export const PALETTES = [
  ["#EB4679", "#051681", "#EE7F7D", "#265BC9", "#C25EA5", "#7961D3"],
  ["#92B3C9", "#C6D1D1", "#7B8E54", "#F66E56", "#F96656", "#F3F4EC"],
  ["#2483A5", "#E0B94B", "#477459", "#C45408", "#6E9091", "#EFE3D1", "#E4D5B9"],
  ["#0F2F65", "#E687D8", "#347BD1", "#6890E2", "#07265C", "#A88BDF"],
  ["#F0A202", "#F18805", "#D95D39", "#202C59", "#581F18"],
];

export const DEFAULT_GRADIENT_TYPE_INDEX = 4;
export const DEFAULT_WARP_SHAPE_INDEX = 2;
export const DEFAULT_WARP_RATIO = 0.4;
export const DEFAULT_WARP_SIZE = 1;
export const DEFAULT_NOISE_RATIO = 0.08;
export const DEFAULT_WIDTH = 2560;
export const DEFAULT_HEIGHT = 1440;

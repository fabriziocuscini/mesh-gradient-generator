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

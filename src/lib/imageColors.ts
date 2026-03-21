interface ExtractedColor {
  hex: string;
  position: [number, number];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function getCanvas(image: HTMLImageElement): {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
} {
  const canvas = document.createElement("canvas");
  const maxDim = 200;
  const scale = Math.min(
    1,
    maxDim / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const w = Math.round(image.naturalWidth * scale);
  const h = Math.round(image.naturalHeight * scale);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0, w, h);
  return { ctx, w, h };
}

export function sampleColorAtPosition(
  image: HTMLImageElement,
  nx: number,
  ny: number,
): string {
  const { ctx, w, h } = getCanvas(image);
  const px = Math.min(w - 1, Math.max(0, Math.round(nx * (w - 1))));
  const py = Math.min(h - 1, Math.max(0, Math.round(ny * (h - 1))));

  const radius = 2;
  let rSum = 0,
    gSum = 0,
    bSum = 0,
    count = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const sx = Math.min(w - 1, Math.max(0, px + dx));
      const sy = Math.min(h - 1, Math.max(0, py + dy));
      const d = ctx.getImageData(sx, sy, 1, 1).data;
      rSum += d[0];
      gSum += d[1];
      bSum += d[2];
      count++;
    }
  }
  return rgbToHex(
    Math.round(rSum / count),
    Math.round(gSum / count),
    Math.round(bSum / count),
  );
}

interface Pixel {
  r: number;
  g: number;
  b: number;
  x: number;
  y: number;
}

function colorDistance(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
): number {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

export function extractColorsFromImage(
  image: HTMLImageElement,
  count: number = 5,
): ExtractedColor[] {
  const { ctx, w, h } = getCanvas(image);
  const imageData = ctx.getImageData(0, 0, w, h).data;

  const step = 2;
  const pixels: Pixel[] = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      if (imageData[i + 3] < 128) continue;
      pixels.push({
        r: imageData[i],
        g: imageData[i + 1],
        b: imageData[i + 2],
        x,
        y,
      });
    }
  }

  if (pixels.length === 0) {
    return Array.from({ length: count }, (_, i) => ({
      hex: "#888888",
      position: [((i + 1) / (count + 1)) as number, 0.5] as [number, number],
    }));
  }

  // k-means clustering
  let centroids = pixels
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((p) => ({ r: p.r, g: p.g, b: p.b }));

  for (let iter = 0; iter < 10; iter++) {
    const clusters: Pixel[][] = centroids.map(() => []);

    for (const px of pixels) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let ci = 0; ci < centroids.length; ci++) {
        const d = colorDistance(px, centroids[ci]);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = ci;
        }
      }
      clusters[bestIdx].push(px);
    }

    centroids = clusters.map((cluster, ci) => {
      if (cluster.length === 0) return centroids[ci];
      const len = cluster.length;
      return {
        r: Math.round(cluster.reduce((s, p) => s + p.r, 0) / len),
        g: Math.round(cluster.reduce((s, p) => s + p.g, 0) / len),
        b: Math.round(cluster.reduce((s, p) => s + p.b, 0) / len),
      };
    });
  }

  // Assign each centroid its closest pixel for position
  const assignments: Pixel[][] = centroids.map(() => []);
  for (const px of pixels) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let ci = 0; ci < centroids.length; ci++) {
      const d = colorDistance(px, centroids[ci]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = ci;
      }
    }
    assignments[bestIdx].push(px);
  }

  return centroids.map((c, i) => {
    const cluster = assignments[i];
    let posX = 0.5;
    let posY = 0.5;
    if (cluster.length > 0) {
      let closest = cluster[0];
      let closestDist = colorDistance(cluster[0], c);
      for (let j = 1; j < cluster.length; j++) {
        const d = colorDistance(cluster[j], c);
        if (d < closestDist) {
          closestDist = d;
          closest = cluster[j];
        }
      }
      posX = closest.x / (w - 1 || 1);
      posY = closest.y / (h - 1 || 1);
    }
    return {
      hex: rgbToHex(c.r, c.g, c.b),
      position: [posX, posY] as [number, number],
    };
  });
}

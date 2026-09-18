import vertSource from "@/shaders/shader.vert";
import fragSource from "@/shaders/shader.frag";
import {
  createProgram,
  createFullScreenQuad,
  getUniformLocations,
  setUniforms,
  drawQuad,
  type RenderParams,
} from "@/lib/webgl";

interface ExportOptions {
  mime: string;
  ext: string;
  /** 0.0–1.0, only used for lossy formats (JPEG, WebP). */
  quality?: number;
}

/**
 * Renders the gradient offscreen at full export resolution.
 *
 * Split from the saving half on purpose: a Figma plugin cannot trigger a
 * download from its iframe and has to hand the bytes to the plugin sandbox
 * through figma.ui.postMessage, so only downloadBlob would need replacing.
 */
export async function renderToBlob(
  params: RenderParams,
  { mime, ext, quality }: ExportOptions,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = params.resolution[0];
  canvas.height = params.resolution[1];

  const gl = canvas.getContext("webgl2", {
    antialias: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error("WebGL2 not available for export");

  const program = createProgram(gl, vertSource, fragSource);
  const { vao, buffer } = createFullScreenQuad(gl, program);
  const uniforms = getUniformLocations(gl, program);

  gl.useProgram(program);
  gl.viewport(0, 0, params.resolution[0], params.resolution[1]);
  setUniforms(gl, uniforms, params);
  drawQuad(gl, vao!);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, quality),
  );

  gl.deleteBuffer(buffer);
  gl.deleteVertexArray(vao);
  gl.deleteProgram(program);
  const glExt = gl.getExtension("WEBGL_lose_context");
  glExt?.loseContext();

  if (!blob) throw new Error(`Failed to create ${ext.toUpperCase()} blob`);

  return blob;
}

/** Saves a blob to disk. The half a plugin build would swap out. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportImage(
  params: RenderParams,
  options: ExportOptions,
): Promise<void> {
  const blob = await renderToBlob(params, options);
  const [w, h] = params.resolution;
  downloadBlob(blob, `mesh-gradient-${w}x${h}.${options.ext}`);
}

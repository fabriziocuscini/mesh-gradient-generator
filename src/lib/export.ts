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

/**
 * Renders the gradient at the given resolution to an offscreen canvas
 * and triggers a PNG download.
 */
export async function exportPng(params: RenderParams): Promise<void> {
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
    canvas.toBlob(resolve, "image/png"),
  );

  gl.deleteBuffer(buffer);
  gl.deleteVertexArray(vao);
  gl.deleteProgram(program);
  const ext = gl.getExtension("WEBGL_lose_context");
  ext?.loseContext();

  if (!blob) throw new Error("Failed to create PNG blob");

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mesh-gradient-${params.resolution[0]}x${params.resolution[1]}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

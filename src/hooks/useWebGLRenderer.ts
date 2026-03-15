import { useCallback, useEffect, useRef } from "react";
import vertSource from "@/shaders/shader.vert";
import fragSource from "@/shaders/shader.frag";
import {
  createProgram,
  createFullScreenQuad,
  getUniformLocations,
  setUniforms,
  drawQuad,
  type RenderParams,
  type UniformLocations,
} from "@/lib/webgl";

interface WebGLState {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vao: WebGLVertexArrayObject;
  buffer: WebGLBuffer;
  uniforms: UniformLocations;
}

export function useWebGLRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const stateRef = useRef<WebGLState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      antialias: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) {
      console.error("WebGL2 not supported");
      return;
    }

    const program = createProgram(gl, vertSource, fragSource);
    const { vao, buffer } = createFullScreenQuad(gl, program);
    const uniforms = getUniformLocations(gl, program);

    gl.useProgram(program);

    stateRef.current = { gl, program, vao: vao!, buffer: buffer!, uniforms };

    return () => {
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      stateRef.current = null;
    };
  }, [canvasRef]);

  const render = useCallback((params: RenderParams) => {
    const state = stateRef.current;
    if (!state) return;

    const { gl, vao, uniforms } = state;

    gl.viewport(0, 0, params.resolution[0], params.resolution[1]);
    gl.useProgram(state.program);
    setUniforms(gl, uniforms, params);
    drawQuad(gl, vao);
  }, []);

  /**
   * Resizes the canvas to the given display size, accounting for devicePixelRatio.
   * Returns the actual pixel dimensions for u_resolution.
   */
  const resize = useCallback(
    (displayWidth: number, displayHeight: number): [number, number] => {
      const canvas = canvasRef.current;
      if (!canvas) return [0, 0];

      const dpr = window.devicePixelRatio || 1;
      const pixelWidth = Math.round(displayWidth * dpr);
      const pixelHeight = Math.round(displayHeight * dpr);

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }

      return [pixelWidth, pixelHeight];
    },
    [canvasRef],
  );

  const isReady = useCallback(() => stateRef.current !== null, []);

  return { render, resize, isReady };
}

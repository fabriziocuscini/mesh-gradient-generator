export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }

  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertSource: string,
  fragSource: string,
): WebGLProgram {
  const vertShader = compileShader(gl, gl.VERTEX_SHADER, vertSource);
  const fragShader = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);

  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");

  gl.attachShader(program, vertShader);
  gl.attachShader(program, fragShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    gl.deleteShader(vertShader);
    gl.deleteShader(fragShader);
    throw new Error(`Program link error: ${info}`);
  }

  gl.deleteShader(vertShader);
  gl.deleteShader(fragShader);

  return program;
}

/**
 * Creates a full-screen quad as a VAO with two triangles covering clip space.
 * Vertices go from -1 to 1 in both axes.
 */
export function createFullScreenQuad(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  gl.bindVertexArray(null);

  return { vao, buffer };
}

const UNIFORM_NAMES = [
  "u_resolution",
  "u_time",
  "u_noiseTime",
  "u_bgColor",
  "u_colors",
  "u_positions",
  "u_numberPoints",
  "u_noiseRatio",
  "u_warpRatio",
  "u_warpSize",
  "u_mouse",
  "u_gradientTypeIndex",
  "u_warpShapeIndex",
] as const;

export type UniformName = (typeof UNIFORM_NAMES)[number];
export type UniformLocations = Record<UniformName, WebGLUniformLocation | null>;

export function getUniformLocations(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
): UniformLocations {
  const locations = {} as UniformLocations;
  for (const name of UNIFORM_NAMES) {
    locations[name] = gl.getUniformLocation(program, name);
  }
  return locations;
}

export interface RenderParams {
  resolution: [number, number];
  time: number;
  noiseTime: number;
  bgColor: [number, number, number];
  colors: Float32Array;
  positions: Float32Array;
  numberPoints: number;
  noiseRatio: number;
  warpRatio: number;
  warpSize: number;
  mouse: [number, number];
  gradientTypeIndex: number;
  warpShapeIndex: number;
}

export function setUniforms(
  gl: WebGL2RenderingContext,
  locs: UniformLocations,
  params: RenderParams,
) {
  gl.uniform2f(locs.u_resolution, params.resolution[0], params.resolution[1]);
  gl.uniform1f(locs.u_time, params.time);
  gl.uniform1f(locs.u_noiseTime, params.noiseTime);
  gl.uniform3f(
    locs.u_bgColor,
    params.bgColor[0],
    params.bgColor[1],
    params.bgColor[2],
  );
  gl.uniform3fv(locs.u_colors, params.colors);
  gl.uniform2fv(locs.u_positions, params.positions);
  gl.uniform1i(locs.u_numberPoints, params.numberPoints);
  gl.uniform1f(locs.u_noiseRatio, params.noiseRatio);
  gl.uniform1f(locs.u_warpRatio, params.warpRatio);
  gl.uniform1f(locs.u_warpSize, params.warpSize);
  gl.uniform2f(locs.u_mouse, params.mouse[0], params.mouse[1]);
  gl.uniform1i(locs.u_gradientTypeIndex, params.gradientTypeIndex);
  gl.uniform1i(locs.u_warpShapeIndex, params.warpShapeIndex);
}

export function drawQuad(
  gl: WebGL2RenderingContext,
  vao: WebGLVertexArrayObject,
) {
  gl.bindVertexArray(vao);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindVertexArray(null);
}

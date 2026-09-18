/// <reference types="vite/client" />

/** package.json's version, substituted by Vite at build time. */
declare const __APP_VERSION__: string;

declare module "*.vert" {
  const value: string;
  export default value;
}

declare module "*.frag" {
  const value: string;
  export default value;
}

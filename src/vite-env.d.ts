/// <reference types="vite/client" />

/**
 * Build id of the running bundle — injected at build time by `define` in
 * vite.config.ts. Changes on every deployment.
 */
declare const __APP_BUILD_ID__: string

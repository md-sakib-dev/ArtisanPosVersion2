import { defineConfig, type Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

/*
 * Unique id for this build — the config is re-evaluated on every
 * `vite build`, so the timestamp changes with each deployment.
 *
 * It is (1) baked into the bundle as `__APP_BUILD_ID__` and (2) written to
 * `dist/version.json`. The running app compares the two and reloads itself
 * when a newer build has been deployed (see src/utils/appUpdate.ts).
 */
const buildId = new Date().toISOString()

/**
 * Emits `version.json` next to index.html on production builds so a running
 * tab can ask "which build is deployed right now?" without loading the app.
 */
const versionFile = (): Plugin => ({
  name: 'emit-version-json',
  apply: 'build',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ buildId }),
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    versionFile(),
  ],
})

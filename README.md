# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Deployment & caching

The app shell must never be cached; fingerprinted assets must be cached
forever. Without the headers below, browsers keep serving an old
`index.html` (and therefore an old bundle) until the user hard-refreshes.

| File            | Response header                                              |
| --------------- | ------------------------------------------------------------ |
| `/index.html`   | `Cache-Control: no-cache` (or `max-age=0, must-revalidate`)  |
| `/version.json` | `Cache-Control: no-cache`                                    |
| `/assets/*`     | `Cache-Control: public, max-age=31536000, immutable`         |

`index.html` also carries `Cache-Control` / `Pragma` / `Expires` meta tags,
but those are only a hint — browsers ignore them for HTTP caching, so set the
header on the server (or CDN) as well.

nginx:

```nginx
location = /index.html   { add_header Cache-Control "no-cache"; }
location = /version.json { add_header Cache-Control "no-cache"; }
location /assets/        { add_header Cache-Control "public, max-age=31536000, immutable"; }
```

IIS (`web.config` — one `<location>` per path, so fingerprinted assets keep
their long cache):

```xml
<configuration>
  <location path="index.html">
    <system.webServer>
      <staticContent>
        <clientCache cacheControlMode="DisableCache" />
      </staticContent>
    </system.webServer>
  </location>
  <location path="version.json">
    <system.webServer>
      <staticContent>
        <clientCache cacheControlMode="DisableCache" />
      </staticContent>
    </system.webServer>
  </location>
  <location path="assets">
    <system.webServer>
      <staticContent>
        <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
      </staticContent>
    </system.webServer>
  </location>
</configuration>
```

Netlify / Vercel / Cloudflare Pages: use a `_headers` file (or `vercel.json`
`headers`) with the same three rules — `/assets/*` long-lived, everything else
`no-cache`.

### Automatic updates

Every build is stamped with a unique id (`vite.config.ts`) that is baked into
the bundle and written to `dist/version.json`. The running app polls that file
(`src/utils/appUpdate.ts`) and reloads itself — via a cache-busting URL — as
soon as a newer build is deployed, so open tabs no longer need Ctrl + F5. The
check pauses while a modal is open and runs once per deployment, so it can
neither interrupt a transaction nor reload in a loop.
